import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  AGREEMENT_ADAPTER_SCORE_WEIGHTS,
  AGREEMENT_BREAKDOWN_LABELS,
  agreementStatusToHref,
  agreementStatusToReasonCode,
  commercialAwardToReasonCode,
  commercialDecisionToReasonCode,
  hasPendingSignatures,
  isAwardPending,
  isDecisionPending,
} from './agreement-field-map.ts'
import type {
  AgreementExplainabilitySnapshot,
  AgreementStatus,
} from './agreement-types.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { AGREEMENT_REASON_CODES } from '../reason-codes/agreement.ts'
import { COMMERCIAL_REASON_CODES } from '../reason-codes/commercial.ts'
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

export const AGREEMENT_ADAPTER_VERSION = '1.0.0' as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveGeneratedAt(input: AgreementExplainabilitySnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

const STAGE_SCORE: Readonly<Record<AgreementStatus, number>> = {
  draft: 25,
  review: 45,
  signing: 65,
  executing: 85,
  completed: 100,
  cancelled: 10,
}

/** Read-only heuristic for display — does not affect deal FSM. */
export function computeAgreementProgressScore(
  input: AgreementExplainabilitySnapshot,
): number {
  let score = STAGE_SCORE[input.status]

  if (isDecisionPending(input.decisionStatus)) {
    score -= 15
  }
  if (isAwardPending(input.awardStatus)) {
    score -= 10
  }
  if (
    hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
    && input.status === 'signing'
  ) {
    score -= 10
  }
  if (
    !input.linkedContractId
    && input.canCreateContract
    && (input.status === 'signing' || input.status === 'executing')
  ) {
    score -= 5
  }
  if ((input.stageBlockers?.length ?? 0) > 0) {
    score -= Math.min(20, (input.stageBlockers?.length ?? 0) * 5)
  }

  return roundScore(clamp(score, 0, 100))
}

function resolveHealth(
  input: AgreementExplainabilitySnapshot,
  scorePercent: number,
): (typeof HEALTH)[keyof typeof HEALTH] {
  if (input.status === 'completed') return HEALTH.EXCELLENT
  if (input.status === 'cancelled') return HEALTH.CRITICAL
  if (input.status === 'executing' && scorePercent >= 80) return HEALTH.GOOD
  if (input.status === 'signing' && scorePercent >= 60) return HEALTH.GOOD
  if (input.status === 'review' || input.status === 'signing') {
    return HEALTH.WARNING
  }
  if (input.status === 'executing') return HEALTH.WARNING
  return HEALTH.CRITICAL
}

function statusMessage(status: AgreementStatus): string {
  switch (status) {
    case 'draft':
      return 'Commercial agreement is in draft — terms are being prepared.'
    case 'review':
      return 'Commercial agreement is under review — approval may be required.'
    case 'signing':
      return 'Commercial agreement is in signing — parties must sign to proceed.'
    case 'executing':
      return 'Commercial agreement is executing — deliverables are in progress.'
    case 'completed':
      return 'Commercial agreement completed — all obligations fulfilled.'
    case 'cancelled':
      return 'Commercial agreement cancelled — no further actions apply.'
    default:
      return `Commercial agreement status: ${status}`
  }
}

function buildSummary(
  input: AgreementExplainabilitySnapshot,
  scorePercent: number,
): string {
  if (input.status === 'completed') {
    return 'Commercial agreement completed — all stages fulfilled.'
  }
  if (input.status === 'cancelled') {
    return 'Commercial agreement cancelled — review history for context.'
  }
  if (isDecisionPending(input.decisionStatus)) {
    return 'Commercial approval pending — resolve decision gates to advance.'
  }
  if (
    hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
    && input.status === 'signing'
  ) {
    return 'Signatures pending — all parties must sign before execution.'
  }
  if (input.status === 'review') {
    return 'Review in progress — complete review to move to signing.'
  }
  if (!input.linkedContractId && input.canCreateContract) {
    return 'Agreement ready — create a contract to formalize terms.'
  }
  return `Agreement progress ${Math.round(scorePercent)}% — ${statusMessage(input.status).toLowerCase()}`
}

function buildReasons(
  input: AgreementExplainabilitySnapshot,
  scorePercent: number,
): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = [
    {
      code: AGREEMENT_REASON_CODES.SCORE_SUMMARY,
      message: `Agreement progress ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
      relatedEntityId: input.entityId,
    },
    {
      code: agreementStatusToReasonCode(input.status),
      message: statusMessage(input.status),
      severity:
        input.status === 'cancelled'
          ? EXPLANATION_SEVERITY.CRITICAL
          : input.status === 'completed'
            ? EXPLANATION_SEVERITY.INFO
            : EXPLANATION_SEVERITY.WARNING,
      category: 'status',
      relatedEntityId: input.entityId,
    },
  ]

  if (isDecisionPending(input.decisionStatus)) {
    reasons.push({
      code: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      message: 'Commercial approval decision is pending.',
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: 'commercial',
      relatedEntityId: input.entityId,
    })
  }

  if (isAwardPending(input.awardStatus)) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.AWARD_PENDING,
      message: 'Award decision is pending.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'award',
      relatedEntityId: input.entityId,
    })
  }

  if (
    hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
  ) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      message: `${input.pendingSignatures ?? 'Some'} signature(s) still pending.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'signing',
      relatedEntityId: input.entityId,
    })
  }

  if (
    !input.linkedContractId
    && input.canCreateContract
    && input.status !== 'draft'
    && input.status !== 'cancelled'
  ) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      message: 'No contract linked — create one to formalize the agreement.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'contract',
      relatedEntityId: input.entityId,
    })
  }

  for (const blocker of input.stageBlockers ?? []) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      message: blocker.label,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: blocker.code,
      relatedEntityId: input.entityId,
    })
  }

  if (input.status === 'review') {
    reasons.push({
      code: AGREEMENT_REASON_CODES.REVIEW_INCOMPLETE,
      message: 'Review stage incomplete — complete review to advance.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'review',
      relatedEntityId: input.entityId,
    })
  }

  return reasons
}

function buildBlockers(
  input: AgreementExplainabilitySnapshot,
): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []

  if (isDecisionPending(input.decisionStatus)) {
    blockers.push({
      reasonCode: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Obtain commercial approval before advancing the agreement.',
    })
  }

  if (input.status === 'cancelled') {
    blockers.push({
      reasonCode: AGREEMENT_REASON_CODES.STATUS_CANCELLED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Agreement was cancelled — initiate a new agreement to proceed.',
    })
  }

  for (const gate of input.stageBlockers ?? []) {
    blockers.push({
      reasonCode: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: gate.resolutionHint ?? `Resolve: ${gate.label}`,
    })
  }

  if (
    hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
    && input.status === 'signing'
  ) {
    blockers.push({
      reasonCode: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: 'Collect all required signatures before moving to execution.',
    })
  }

  return blockers
}

function buildStrengths(
  input: AgreementExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []

  if (input.status === 'completed') {
    strengths.push({
      code: AGREEMENT_REASON_CODES.STATUS_COMPLETED,
      label: 'Agreement completed',
      impactPercent: 40,
    })
  }

  if (input.decisionStatus === 'approved') {
    strengths.push({
      code: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      label: 'Commercial approval granted',
      impactPercent: 25,
    })
  }

  if (input.linkedContractId) {
    strengths.push({
      code: AGREEMENT_REASON_CODES.STATUS_EXECUTING,
      label: 'Contract linked',
      impactPercent: 20,
    })
  }

  if (
    input.status === 'signing'
    && !hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
    && (input.totalSignatures ?? 0) > 0
  ) {
    strengths.push({
      code: AGREEMENT_REASON_CODES.STATUS_SIGNING,
      label: 'All signatures collected',
      impactPercent: 25,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: AgreementExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  if (isDecisionPending(input.decisionStatus)) {
    weaknesses.push({
      code: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      label: 'Commercial approval pending',
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.commercialApproval,
    })
  }

  if (isAwardPending(input.awardStatus)) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.AWARD_PENDING,
      label: 'Award decision pending',
      impactPercent: 15,
    })
  }

  if (
    hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
  ) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      label: 'Signatures incomplete',
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.signatures,
    })
  }

  if (!input.linkedContractId && input.canCreateContract) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      label: 'Contract not yet created',
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.contractLinkage,
    })
  }

  for (const blocker of input.stageBlockers ?? []) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      label: blocker.label,
      impactPercent: roundScore(
        AGREEMENT_ADAPTER_SCORE_WEIGHTS.stageProgression /
          Math.max(1, input.stageBlockers?.length ?? 1),
      ),
    })
  }

  return weaknesses
}

function dimensionScore(
  input: AgreementExplainabilitySnapshot,
  dimension: keyof typeof AGREEMENT_ADAPTER_SCORE_WEIGHTS,
): number {
  const weight = AGREEMENT_ADAPTER_SCORE_WEIGHTS[dimension]

  switch (dimension) {
    case 'stageProgression': {
      const base = STAGE_SCORE[input.status] / 100
      return roundScore(base * weight)
    }
    case 'commercialApproval': {
      if (input.decisionStatus === 'approved' || input.decisionStatus === 'not_required') {
        return weight
      }
      if (isDecisionPending(input.decisionStatus)) return 0
      return roundScore(weight * 0.5)
    }
    case 'signatures': {
      if (input.status === 'completed' || input.status === 'executing') {
        return weight
      }
      if (
        hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
      ) {
        const total = input.totalSignatures ?? 1
        const pending = input.pendingSignatures ?? total
        const signed = Math.max(0, total - pending)
        return roundScore((signed / total) * weight)
      }
      if (input.status === 'signing') return roundScore(weight * 0.3)
      return weight
    }
    case 'contractLinkage': {
      if (input.linkedContractId) return weight
      if (input.canCreateContract) return roundScore(weight * 0.4)
      return 0
    }
    default:
      return 0
  }
}

function buildRecommendationsFromSnapshot(
  input: AgreementExplainabilitySnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  const currentScore = computeAgreementProgressScore(input)
  let index = 0

  if (isDecisionPending(input.decisionStatus)) {
    recommendations.push({
      id: `agreement-rec-approval-${index}`,
      label: 'Obtain commercial approval to advance',
      reasonCode: commercialDecisionToReasonCode(),
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.commercialApproval,
      estimatedScore: roundScore(Math.min(100, currentScore + 20)),
      href: agreementStatusToHref(input.entityId, 'review'),
      category: 'commercial',
      severity: EXPLANATION_SEVERITY.CRITICAL,
    })
    index += 1
  }

  if (input.status === 'review') {
    recommendations.push({
      id: `agreement-rec-review-${index}`,
      label: 'Complete review and advance to signing',
      reasonCode: AGREEMENT_REASON_CODES.REVIEW_INCOMPLETE,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.stageProgression,
      estimatedScore: roundScore(Math.min(100, currentScore + 15)),
      href: agreementStatusToHref(input.entityId, 'review'),
      category: 'review',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (
    hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
    && input.status === 'signing'
  ) {
    recommendations.push({
      id: `agreement-rec-sign-${index}`,
      label: 'Collect pending signatures from all parties',
      reasonCode: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.signatures,
      estimatedScore: roundScore(Math.min(100, currentScore + 15)),
      href: agreementStatusToHref(input.entityId, 'signing'),
      category: 'signing',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (
    !input.linkedContractId
    && input.canCreateContract
    && input.status !== 'draft'
    && input.status !== 'cancelled'
    && input.status !== 'completed'
  ) {
    recommendations.push({
      id: `agreement-rec-contract-${index}`,
      label: 'Create contract from commercial agreement',
      reasonCode: AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.contractLinkage,
      estimatedScore: roundScore(Math.min(100, currentScore + 10)),
      href: agreementStatusToHref(input.entityId, 'contract'),
      category: 'contract',
      severity: EXPLANATION_SEVERITY.INFO,
    })
    index += 1
  }

  if (
    input.status === 'signing'
    && !hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
  ) {
    recommendations.push({
      id: `agreement-rec-advance-${index}`,
      label: 'Advance agreement to execution stage',
      reasonCode: AGREEMENT_REASON_CODES.STATUS_EXECUTING,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 20,
      estimatedScore: roundScore(Math.min(100, currentScore + 20)),
      href: agreementStatusToHref(input.entityId),
      category: 'stage',
      severity: EXPLANATION_SEVERITY.INFO,
    })
    index += 1
  }

  if (isAwardPending(input.awardStatus)) {
    recommendations.push({
      id: `agreement-rec-award-${index}`,
      label: 'Complete award decision',
      reasonCode: commercialAwardToReasonCode(),
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 15,
      estimatedScore: roundScore(Math.min(100, currentScore + 10)),
      href: agreementStatusToHref(input.entityId, 'review'),
      category: 'award',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
  }

  for (const blocker of input.stageBlockers ?? []) {
    recommendations.push({
      id: `agreement-rec-gate-${blocker.code}-${index}`,
      label: `Resolve stage gate: ${blocker.label}`,
      reasonCode: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: roundScore(
        AGREEMENT_ADAPTER_SCORE_WEIGHTS.stageProgression /
          Math.max(1, input.stageBlockers?.length ?? 1),
      ),
      estimatedScore: roundScore(Math.min(100, currentScore + 10)),
      href: agreementStatusToHref(input.entityId),
      category: blocker.code,
      severity: EXPLANATION_SEVERITY.CRITICAL,
    })
    index += 1
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: AgreementExplainabilitySnapshot,
): readonly ScoreBreakdownEntry[] {
  return (
    Object.keys(AGREEMENT_ADAPTER_SCORE_WEIGHTS) as Array<
      keyof typeof AGREEMENT_ADAPTER_SCORE_WEIGHTS
    >
  ).map((dimension) => {
    const weight = AGREEMENT_ADAPTER_SCORE_WEIGHTS[dimension]
    const score = dimensionScore(input, dimension)
    const reasonCodes: ReasonCode[] = []

    if (dimension === 'stageProgression') {
      reasonCodes.push(agreementStatusToReasonCode(input.status))
    }
    if (dimension === 'commercialApproval' && isDecisionPending(input.decisionStatus)) {
      reasonCodes.push(COMMERCIAL_REASON_CODES.APPROVAL_PENDING)
    }
    if (
      dimension === 'signatures'
      && hasPendingSignatures(input.pendingSignatures, input.totalSignatures)
    ) {
      reasonCodes.push(AGREEMENT_REASON_CODES.SIGNATURES_PENDING)
    }
    if (dimension === 'contractLinkage' && !input.linkedContractId) {
      reasonCodes.push(AGREEMENT_REASON_CODES.CONTRACT_MISSING)
    }

    return {
      label: AGREEMENT_BREAKDOWN_LABELS[dimension],
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
  if (status === 'blocked' || status === 'failed' || status === 'cancelled') {
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
  input: AgreementExplainabilitySnapshot,
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
      type: 'agreement-created',
      title: 'Agreement created',
      description: 'Commercial agreement draft opened.',
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  for (const transition of input.stageTransitions ?? []) {
    events.push({
      type: `agreement-${transition.stage}`,
      title: `Stage: ${transition.stage}`,
      description: statusMessage(transition.stage),
      timestamp: transition.timestamp,
      status:
        transition.stage === input.status
          ? TIMELINE_EVENT_STATUS.ACTIVE
          : TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (input.status === 'cancelled') {
    events.push({
      type: 'agreement-cancelled',
      title: 'Agreement cancelled',
      description: 'Commercial agreement was cancelled.',
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId,
    })
  }

  if (input.status === 'completed') {
    events.push({
      type: 'agreement-completed',
      title: 'Agreement completed',
      description: 'All agreement obligations fulfilled.',
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (events.length === 0) {
    events.push({
      type: 'agreement-active',
      title: 'Agreement in progress',
      description: statusMessage(input.status),
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId,
    })
  }

  return events
}

export function buildAgreementExplanation(
  input: AgreementExplainabilitySnapshot,
): ExplanationBundle {
  const scorePercent = computeAgreementProgressScore(input)
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.AGREEMENT,
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
      engineVersion: AGREEMENT_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source: 'agreement-adapter',
      tags: [input.status],
      extensions: {
        status: input.status,
        decisionStatus: input.decisionStatus ?? null,
        awardStatus: input.awardStatus ?? null,
        linkedContractId: input.linkedContractId ?? null,
        linkedNegotiationId: input.linkedNegotiationId ?? null,
        pendingSignatures: input.pendingSignatures ?? null,
        canCreateContract: input.canCreateContract ?? false,
      },
    },
  }
}

export const agreementExplainabilityAdapter: ExplainabilityAdapter<AgreementExplainabilitySnapshot> =
  {
    buildExplanation: buildAgreementExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
