import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  CONTRACT_ADAPTER_SCORE_WEIGHTS,
  CONTRACT_BREAKDOWN_LABELS,
  contractStatusToHref,
  contractStatusToReasonCode,
  hasBlockedMilestones,
  hasUnsignedParties,
  resolvePartiesSigned,
  resolveTotalParties,
} from './contract-field-map.ts'
import type {
  ContractExplainabilitySnapshot,
  ContractStatus,
} from './contract-types.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { CONTRACT_REASON_CODES } from '../reason-codes/contract.ts'
import { ENGINE_ID } from '../types/engine.ts'
import { HEALTH } from '../types/health.ts'
import type { ExplanationBundle } from '../types/bundle.ts'
import type { BlockingFactor } from '../types/blocking.ts'
import type {
  ExplanationReason,
  StrengthWeaknessEntry,
} from '../types/reason.ts'
import type { Recommendation } from '../types/recommendation.ts'
import type { ScoreBreakdownEntry } from '../types/score-breakdown.ts'
import type { TimelineEvent } from '../types/timeline.ts'
import {
  EXPLANATION_SEVERITY,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
} from '../types/severity.ts'

export const CONTRACT_ADAPTER_VERSION = '1.0.0' as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveGeneratedAt(input: ContractExplainabilitySnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

const STAGE_SCORE: Readonly<Record<ContractStatus, number>> = {
  draft: 25,
  pending_signature: 55,
  active: 85,
  completed: 100,
  terminated: 10,
}

/** Read-only heuristic for display — does not affect contract FSM. */
export function computeContractProgressScore(
  input: ContractExplainabilitySnapshot,
): number {
  let score = STAGE_SCORE[input.status]
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  if (
    input.status === 'pending_signature'
    && hasUnsignedParties(partiesSigned, totalParties)
  ) {
    const signedRatio = totalParties > 0 ? partiesSigned / totalParties : 0
    score = roundScore(40 + signedRatio * 25)
  }

  if (hasBlockedMilestones(input.milestones) && input.status === 'active') {
    score -= 15
  }

  if (input.status === 'active' && input.canComplete) {
    score = Math.max(score, 90)
  }

  return roundScore(clamp(score, 0, 100))
}

function resolveHealth(
  input: ContractExplainabilitySnapshot,
  scorePercent: number,
): (typeof HEALTH)[keyof typeof HEALTH] {
  if (input.status === 'completed') return HEALTH.EXCELLENT
  if (input.status === 'terminated') return HEALTH.CRITICAL
  if (input.status === 'active' && scorePercent >= 80) return HEALTH.GOOD
  if (input.status === 'pending_signature') return HEALTH.WARNING
  if (input.status === 'active') return HEALTH.WARNING
  if (input.status === 'draft') return HEALTH.CRITICAL
  return HEALTH.CRITICAL
}

function statusMessage(status: ContractStatus): string {
  switch (status) {
    case 'draft':
      return 'Contract is in draft — terms are being finalized.'
    case 'pending_signature':
      return 'Contract pending signature — parties must sign to activate.'
    case 'active':
      return 'Contract is active — deliverables are in progress.'
    case 'completed':
      return 'Contract completed — all obligations fulfilled.'
    case 'terminated':
      return 'Contract terminated — no further obligations apply.'
    default:
      return `Contract status: ${status}`
  }
}

function buildSummary(
  input: ContractExplainabilitySnapshot,
  scorePercent: number,
): string {
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  if (input.status === 'completed') {
    return 'Contract completed — all milestones and obligations fulfilled.'
  }
  if (input.status === 'terminated') {
    return input.terminationReason
      ? `Contract terminated — ${input.terminationReason}`
      : 'Contract terminated — review termination details.'
  }
  if (
    input.status === 'pending_signature'
    && hasUnsignedParties(partiesSigned, totalParties)
  ) {
    return `${totalParties - partiesSigned} of ${totalParties} signature(s) pending — sign to activate.`
  }
  if (input.status === 'active' && input.canComplete) {
    return 'Contract active — ready to mark as completed.'
  }
  if (hasBlockedMilestones(input.milestones)) {
    return 'Contract active — blocked milestone(s) require attention.'
  }
  return `Contract progress ${Math.round(scorePercent)}% — ${statusMessage(input.status).toLowerCase()}`
}

function buildReasons(
  input: ContractExplainabilitySnapshot,
  scorePercent: number,
): readonly ExplanationReason[] {
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  const reasons: ExplanationReason[] = [
    {
      code: CONTRACT_REASON_CODES.SCORE_SUMMARY,
      message: `Contract progress ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
      relatedEntityId: input.entityId,
    },
    {
      code: contractStatusToReasonCode(input.status),
      message: statusMessage(input.status),
      severity:
        input.status === 'terminated'
          ? EXPLANATION_SEVERITY.CRITICAL
          : input.status === 'completed'
            ? EXPLANATION_SEVERITY.INFO
            : EXPLANATION_SEVERITY.WARNING,
      category: 'status',
      relatedEntityId: input.entityId,
    },
  ]

  if (
    hasUnsignedParties(partiesSigned, totalParties)
    && (input.status === 'pending_signature' || input.status === 'draft')
  ) {
    reasons.push({
      code: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      message: `${totalParties - partiesSigned} of ${totalParties} party signature(s) pending.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'signatures',
      relatedEntityId: input.entityId,
    })
  }

  if (
    input.status === 'pending_signature'
    && !hasUnsignedParties(partiesSigned, totalParties)
    && totalParties > 0
  ) {
    reasons.push({
      code: CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      message: 'All signatures collected — contract activation pending.',
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'activation',
      relatedEntityId: input.entityId,
    })
  }

  if (input.status === 'active' && input.canComplete) {
    reasons.push({
      code: CONTRACT_REASON_CODES.COMPLETION_READY,
      message: 'Contract eligible for completion.',
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'completion',
      relatedEntityId: input.entityId,
    })
  }

  if (input.status === 'terminated' && input.terminationReason) {
    reasons.push({
      code: CONTRACT_REASON_CODES.STATUS_TERMINATED,
      message: input.terminationReason,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: 'termination',
      relatedEntityId: input.entityId,
    })
  }

  if (hasBlockedMilestones(input.milestones)) {
    reasons.push({
      code: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      message: 'One or more milestones are blocked or overdue.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'milestones',
      relatedEntityId: input.entityId,
    })
  }

  return reasons
}

function buildBlockers(
  input: ContractExplainabilitySnapshot,
): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  if (
    hasUnsignedParties(partiesSigned, totalParties)
    && input.status === 'pending_signature'
  ) {
    blockers.push({
      reasonCode: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: 'All parties must sign before the contract can activate.',
    })
  }

  if (input.status === 'terminated') {
    blockers.push({
      reasonCode: CONTRACT_REASON_CODES.STATUS_TERMINATED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint:
        input.terminationReason ?? 'Contract was terminated — no further actions apply.',
    })
  }

  if (hasBlockedMilestones(input.milestones) && input.status === 'active') {
    blockers.push({
      reasonCode: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: 'Resolve blocked or overdue milestones to continue execution.',
    })
  }

  return blockers
}

function buildStrengths(
  input: ContractExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  if (input.status === 'completed') {
    strengths.push({
      code: CONTRACT_REASON_CODES.STATUS_COMPLETED,
      label: 'Contract completed',
      impactPercent: 40,
    })
  }

  if (
    totalParties > 0
    && partiesSigned === totalParties
    && input.status !== 'draft'
  ) {
    strengths.push({
      code: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      label: 'All parties signed',
      impactPercent: 30,
    })
  }

  if (input.status === 'active' && !hasBlockedMilestones(input.milestones)) {
    strengths.push({
      code: CONTRACT_REASON_CODES.STATUS_ACTIVE,
      label: 'Execution on track',
      impactPercent: 25,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: ContractExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  if (hasUnsignedParties(partiesSigned, totalParties)) {
    weaknesses.push({
      code: CONTRACT_REASON_CODES.SIGNATURES_INCOMPLETE,
      label: `${totalParties - partiesSigned} unsigned party(ies)`,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.signatures,
    })
  }

  if (
    input.status === 'pending_signature'
    && !hasUnsignedParties(partiesSigned, totalParties)
    && totalParties > 0
  ) {
    weaknesses.push({
      code: CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      label: 'Activation pending after signatures',
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.activation,
    })
  }

  if (hasBlockedMilestones(input.milestones)) {
    weaknesses.push({
      code: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      label: 'Blocked milestones',
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.milestones,
    })
  }

  return weaknesses
}

function dimensionScore(
  input: ContractExplainabilitySnapshot,
  dimension: keyof typeof CONTRACT_ADAPTER_SCORE_WEIGHTS,
): number {
  const weight = CONTRACT_ADAPTER_SCORE_WEIGHTS[dimension]
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  switch (dimension) {
    case 'signatures': {
      if (input.status === 'completed' || input.status === 'active') {
        return weight
      }
      if (totalParties === 0) return roundScore(weight * 0.5)
      return roundScore((partiesSigned / totalParties) * weight)
    }
    case 'activation': {
      if (input.status === 'active' || input.status === 'completed') {
        return weight
      }
      if (
        input.status === 'pending_signature'
        && !hasUnsignedParties(partiesSigned, totalParties)
        && totalParties > 0
      ) {
        return roundScore(weight * 0.8)
      }
      return 0
    }
    case 'execution': {
      const base = STAGE_SCORE[input.status] / 100
      return roundScore(base * weight)
    }
    case 'milestones': {
      if (!input.milestones?.length) return weight
      if (hasBlockedMilestones(input.milestones)) {
        return roundScore(weight * 0.4)
      }
      const completed = input.milestones.filter(
        (m) => m.status === 'completed' || m.status === 'done',
      ).length
      return roundScore((completed / input.milestones.length) * weight)
    }
    default:
      return 0
  }
}

function buildRecommendationsFromSnapshot(
  input: ContractExplainabilitySnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  const currentScore = computeContractProgressScore(input)
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)
  let index = 0

  if (input.canSign && hasUnsignedParties(partiesSigned, totalParties)) {
    recommendations.push({
      id: `contract-rec-sign-${index}`,
      label: 'Sign the contract to proceed',
      reasonCode: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.signatures,
      estimatedScore: roundScore(Math.min(100, currentScore + 20)),
      href: contractStatusToHref(input.entityId, 'sign'),
      category: 'signatures',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (
    input.status === 'pending_signature'
    && !hasUnsignedParties(partiesSigned, totalParties)
    && totalParties > 0
  ) {
    recommendations.push({
      id: `contract-rec-activate-${index}`,
      label: 'Activate contract — all signatures collected',
      reasonCode: CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.activation,
      estimatedScore: roundScore(Math.min(100, currentScore + 25)),
      href: contractStatusToHref(input.entityId),
      category: 'activation',
      severity: EXPLANATION_SEVERITY.INFO,
    })
    index += 1
  }

  if (input.canComplete && input.status === 'active') {
    recommendations.push({
      id: `contract-rec-complete-${index}`,
      label: 'Mark contract as completed',
      reasonCode: CONTRACT_REASON_CODES.COMPLETION_READY,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 30,
      estimatedScore: 100,
      href: contractStatusToHref(input.entityId, 'complete'),
      category: 'completion',
      severity: EXPLANATION_SEVERITY.INFO,
    })
    index += 1
  }

  if (input.canTerminate && input.status !== 'completed' && input.status !== 'terminated') {
    recommendations.push({
      id: `contract-rec-terminate-${index}`,
      label: 'Terminate contract (provide reason)',
      reasonCode: CONTRACT_REASON_CODES.TERMINATION_AVAILABLE,
      priority: RECOMMENDATION_PRIORITY.LOW,
      impactPercent: 5,
      estimatedScore: 10,
      href: contractStatusToHref(input.entityId, 'terminate'),
      category: 'termination',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (hasBlockedMilestones(input.milestones)) {
    recommendations.push({
      id: `contract-rec-milestone-${index}`,
      label: 'Resolve blocked or overdue milestones',
      reasonCode: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.milestones,
      estimatedScore: roundScore(Math.min(100, currentScore + 15)),
      href: contractStatusToHref(input.entityId, 'milestones'),
      category: 'milestones',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: ContractExplainabilitySnapshot,
): readonly ScoreBreakdownEntry[] {
  return (
    Object.keys(CONTRACT_ADAPTER_SCORE_WEIGHTS) as Array<
      keyof typeof CONTRACT_ADAPTER_SCORE_WEIGHTS
    >
  ).map((dimension) => {
    const weight = CONTRACT_ADAPTER_SCORE_WEIGHTS[dimension]
    const score = dimensionScore(input, dimension)
    const reasonCodes: ReasonCode[] = []
    const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
    const totalParties = resolveTotalParties(input.totalParties, input.parties)

    if (
      dimension === 'signatures'
      && hasUnsignedParties(partiesSigned, totalParties)
    ) {
      reasonCodes.push(CONTRACT_REASON_CODES.SIGNATURE_PENDING)
    }
    if (dimension === 'activation' && input.status === 'pending_signature') {
      reasonCodes.push(CONTRACT_REASON_CODES.ACTIVATION_PENDING)
    }
    if (dimension === 'execution') {
      reasonCodes.push(contractStatusToReasonCode(input.status))
    }
    if (dimension === 'milestones' && hasBlockedMilestones(input.milestones)) {
      reasonCodes.push(CONTRACT_REASON_CODES.MILESTONE_BLOCKED)
    }

    return {
      label: CONTRACT_BREAKDOWN_LABELS[dimension],
      weight,
      score,
      maxScore: weight,
      reasonCodes,
    }
  })
}

function mapTimelineStatus(
  status: string | undefined,
): (typeof TIMELINE_EVENT_STATUS)[keyof typeof TIMELINE_EVENT_STATUS] {
  if (status === 'blocked' || status === 'failed' || status === 'terminated') {
    return TIMELINE_EVENT_STATUS.BLOCKED
  }
  if (status === 'pending') {
    return TIMELINE_EVENT_STATUS.PENDING
  }
  if (status === 'in_progress' || status === 'active') {
    return TIMELINE_EVENT_STATUS.ACTIVE
  }
  return TIMELINE_EVENT_STATUS.COMPLETED
}

function buildTimelineFromSnapshot(
  input: ContractExplainabilitySnapshot,
): readonly TimelineEvent[] {
  if (input.timelineEvents && input.timelineEvents.length > 0) {
    return input.timelineEvents.map((event) => ({
      type: event.type,
      title: event.title,
      description: event.description ?? event.title,
      timestamp: event.timestamp,
      status: mapTimelineStatus(event.status),
      relatedEntity: input.entityId,
    }))
  }

  const events: TimelineEvent[] = []
  const evaluatedAt = resolveGeneratedAt(input)

  if (input.createdAt) {
    events.push({
      type: 'contract-created',
      title: 'Contract created',
      description: 'Contract draft opened.',
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  for (const party of input.parties ?? []) {
    if (party.signedAt) {
      events.push({
        type: 'contract-signed',
        title: 'Party signed',
        description: party.role
          ? `${party.role} signed the contract`
          : `Party ${party.userId} signed the contract`,
        timestamp: party.signedAt,
        status: TIMELINE_EVENT_STATUS.COMPLETED,
        relatedEntity: input.entityId,
      })
    }
  }

  if (input.activatedAt) {
    events.push({
      type: 'contract-activated',
      title: 'Contract activated',
      description: 'Contract entered active execution.',
      timestamp: input.activatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (input.completedAt) {
    events.push({
      type: 'contract-completed',
      title: 'Contract completed',
      description:
        input.completionReason ?? 'All contract obligations fulfilled.',
      timestamp: input.completedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (input.terminatedAt || input.status === 'terminated') {
    events.push({
      type: 'contract-terminated',
      title: 'Contract terminated',
      description: input.terminationReason ?? 'Contract was terminated.',
      timestamp: input.terminatedAt ?? evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId,
    })
  }

  if (events.length === 0) {
    events.push({
      type: 'contract-active',
      title: 'Contract in progress',
      description: statusMessage(input.status),
      timestamp: evaluatedAt,
      status:
        input.status === 'terminated'
          ? TIMELINE_EVENT_STATUS.BLOCKED
          : TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId,
    })
  }

  return events
}

export function buildContractExplanation(
  input: ContractExplainabilitySnapshot,
): ExplanationBundle {
  const scorePercent = computeContractProgressScore(input)
  const generatedAt = resolveGeneratedAt(input)
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties)
  const totalParties = resolveTotalParties(input.totalParties, input.parties)

  return {
    engine: ENGINE_ID.CONTRACT,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth(input, scorePercent),
    summary: buildSummary(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input, scorePercent),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: CONTRACT_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source: 'contract-adapter',
      tags: [input.status],
      extensions: {
        status: input.status,
        partiesSigned,
        totalParties,
        canSign: input.canSign ?? false,
        canComplete: input.canComplete ?? false,
        canTerminate: input.canTerminate ?? false,
      },
    },
  }
}

export const contractExplainabilityAdapter: ExplainabilityAdapter<ContractExplainabilitySnapshot> =
  {
    buildExplanation: buildContractExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
