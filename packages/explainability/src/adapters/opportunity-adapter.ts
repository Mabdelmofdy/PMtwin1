import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  opportunityFieldIdToHref,
  opportunityFieldIdToReasonCode,
  opportunityReasonCodeToCanonical,
} from './opportunity-field-map.ts'
import type { OpportunityReadinessSnapshot } from './opportunity-types.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { READINESS_REASON_CODES } from '../reason-codes/readiness.ts'
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

export const OPPORTUNITY_ADAPTER_VERSION = '1.0.0' as const

/** Mirrors OPPORTUNITY_READINESS_SCORE_WEIGHTS — used for breakdown display only. */
export const OPPORTUNITY_ADAPTER_SCORE_WEIGHTS = {
  required: 80,
  recommended: 20,
} as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveGeneratedAt(input: OpportunityReadinessSnapshot): string {
  return input.evaluatedAt ?? input.snapshot.generatedAt ?? new Date().toISOString()
}

function resolveHealth(
  health: OpportunityReadinessSnapshot['health'],
): (typeof HEALTH)[keyof typeof HEALTH] {
  switch (health) {
    case 'excellent':
      return HEALTH.EXCELLENT
    case 'good':
      return HEALTH.GOOD
    case 'warning':
      return HEALTH.WARNING
    case 'critical':
    default:
      return HEALTH.CRITICAL
  }
}

function toCanonicalCode(
  code: string,
  fieldId?: string,
): ReasonCode {
  return opportunityReasonCodeToCanonical(code, fieldId)
}

function mapExplanationSeverity(
  severity: 'info' | 'warning' | 'critical',
): (typeof EXPLANATION_SEVERITY)[keyof typeof EXPLANATION_SEVERITY] {
  if (severity === 'critical') return EXPLANATION_SEVERITY.CRITICAL
  if (severity === 'warning') return EXPLANATION_SEVERITY.WARNING
  return EXPLANATION_SEVERITY.INFO
}

function buildSummary(input: OpportunityReadinessSnapshot): string {
  if (input.publishReady) {
    return 'Opportunity is publish-ready — all required fields are complete.'
  }

  const missingRequired = input.missingRequiredFields.length
  if (missingRequired > 0) {
    return `Opportunity is incomplete — ${missingRequired} required field${missingRequired === 1 ? '' : 's'} still missing.`
  }

  const missingRecommended = input.missingRecommendedFields.length
  if (missingRecommended > 0) {
    return `Opportunity meets publish requirements — ${missingRecommended} recommended field${missingRecommended === 1 ? '' : 's'} can improve visibility.`
  }

  return `Opportunity readiness is ${input.readinessLevel} at ${Math.round(input.score)}%.`
}

function buildReasons(input: OpportunityReadinessSnapshot): readonly ExplanationReason[] {
  if (input.explanations.length > 0) {
    return input.explanations.map((explanation) => ({
      code: toCanonicalCode(explanation.code, explanation.fieldId),
      message: explanation.message,
      severity: mapExplanationSeverity(explanation.severity),
      category: explanation.category ?? (explanation.fieldId ? 'field' : 'summary'),
      relatedEntityId: input.entityId,
    }))
  }

  const reasons: ExplanationReason[] = [
    {
      code: READINESS_REASON_CODES.SCORE_SUMMARY,
      message: `Readiness ${Math.round(input.score)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
    },
  ]

  for (const fieldId of input.missingRequiredFields) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId)
    reasons.push({
      code: opportunityFieldIdToReasonCode(fieldId),
      message: `Missing required: ${contribution?.label ?? fieldId}`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: contribution?.category ?? 'required',
      relatedEntityId: input.entityId,
    })
  }

  if (input.missingRecommendedFields.length > 0) {
    reasons.push({
      code: READINESS_REASON_CODES.RECOMMENDED_GAPS,
      message: `${input.missingRecommendedFields.length} recommended field(s) remaining`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'recommended',
    })
  }

  return reasons
}

function buildBlockers(input: OpportunityReadinessSnapshot): readonly BlockingFactor[] {
  if (input.blockingReasons.length > 0) {
    return input.blockingReasons.map((blocker) => ({
      reasonCode: toCanonicalCode(blocker.code, blocker.fieldId),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: blocker.message,
    }))
  }

  if (!input.publishReady) {
    return input.missingRequiredFields.map((fieldId) => {
      const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId)
      return {
        reasonCode: opportunityFieldIdToReasonCode(fieldId),
        severity: EXPLANATION_SEVERITY.CRITICAL,
        blockingEntity: input.entityId,
        resolutionHint: `Complete ${contribution?.label ?? fieldId} to publish.`,
      }
    })
  }

  return []
}

function fieldImpactPercent(
  contribution: OpportunityReadinessSnapshot['fieldContributions'][number],
  input: OpportunityReadinessSnapshot,
): number {
  if (contribution.requiredWeight > 0) {
    const totalRequired = input.fieldContributions.reduce(
      (sum, entry) => sum + entry.requiredWeight,
      0,
    )
    if (totalRequired === 0) return 0
    return roundScore(
      (contribution.requiredWeight / totalRequired) *
        OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
    )
  }

  const totalRecommended = input.fieldContributions.reduce(
    (sum, entry) => sum + entry.recommendedWeight,
    0,
  )
  if (totalRecommended === 0) return 0
  return roundScore(
    (contribution.recommendedWeight / totalRecommended) *
      OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
  )
}

function buildStrengths(
  input: OpportunityReadinessSnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []

  const completedRequired =
    input.completedRequiredFields ??
    input.fieldContributions
      .filter((entry) => entry.requiredWeight > 0 && entry.present)
      .map((entry) => entry.fieldId)

  const completedRecommended =
    input.completedRecommendedFields ??
    input.fieldContributions
      .filter((entry) => entry.recommendedWeight > 0 && entry.present)
      .map((entry) => entry.fieldId)

  const totalRequired = input.fieldContributions.filter(
    (entry) => entry.requiredWeight > 0,
  ).length
  const totalRecommended = input.fieldContributions.filter(
    (entry) => entry.recommendedWeight > 0,
  ).length

  if (completedRequired.length === totalRequired && totalRequired > 0) {
    strengths.push({
      code: READINESS_REASON_CODES.REQUIRED_COMPLETE,
      label: 'All required fields complete',
      impactPercent: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
    })
  }

  if (completedRecommended.length === totalRecommended && totalRecommended > 0) {
    strengths.push({
      code: READINESS_REASON_CODES.RECOMMENDED_COMPLETE,
      label: 'All recommended fields complete',
      impactPercent: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
    })
  }

  for (const fieldId of completedRequired) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId)
    if (!contribution) continue
    strengths.push({
      code: `READINESS_COMPLETE_${fieldId
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()}` as ReasonCode,
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input),
    })
  }

  for (const fieldId of completedRecommended) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId)
    if (!contribution) continue
    strengths.push({
      code: `READINESS_COMPLETE_${fieldId
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()}` as ReasonCode,
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input),
    })
  }

  if (input.publishReady) {
    strengths.push({
      code: READINESS_REASON_CODES.PUBLISH_READY,
      label: 'Publish-ready opportunity',
      impactPercent: 100,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: OpportunityReadinessSnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  for (const fieldId of input.missingRequiredFields) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId)
    if (!contribution) {
      weaknesses.push({
        code: opportunityFieldIdToReasonCode(fieldId),
        label: fieldId,
        impactPercent: 0,
      })
      continue
    }
    weaknesses.push({
      code: opportunityFieldIdToReasonCode(fieldId),
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input),
    })
  }

  for (const fieldId of input.missingRecommendedFields) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId)
    if (!contribution) {
      weaknesses.push({
        code: opportunityFieldIdToReasonCode(fieldId),
        label: fieldId,
        impactPercent: 0,
      })
      continue
    }
    weaknesses.push({
      code: opportunityFieldIdToReasonCode(fieldId),
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input),
    })
  }

  return weaknesses
}

function recommendationPriority(
  priority: 'required' | 'recommended',
): (typeof RECOMMENDATION_PRIORITY)[keyof typeof RECOMMENDATION_PRIORITY] {
  return priority === 'required'
    ? RECOMMENDATION_PRIORITY.CRITICAL
    : RECOMMENDATION_PRIORITY.MEDIUM
}

function buildRecommendationsFromSnapshot(
  input: OpportunityReadinessSnapshot,
): readonly Recommendation[] {
  return input.nextBestActions.map((action, index) => {
    const reasonCode = toCanonicalCode(action.reasonCode, action.fieldId)
    const slug = action.fieldId.replace(/([A-Z])/g, '-$1').toLowerCase()

    return {
      id: `opportunity-rec-${slug}-${index}`,
      label: `Complete ${action.label}`,
      reasonCode,
      priority: recommendationPriority(action.priority),
      impactPercent: action.impactPercent,
      estimatedScore: action.estimatedScore,
      href: opportunityFieldIdToHref(action.fieldId, input.subModelKey),
      category: action.priority,
      severity:
        action.priority === 'required'
          ? EXPLANATION_SEVERITY.CRITICAL
          : EXPLANATION_SEVERITY.WARNING,
    }
  })
}

function buildBreakdownFromSnapshot(
  input: OpportunityReadinessSnapshot,
): readonly ScoreBreakdownEntry[] {
  const requiredReasonCodes = input.missingRequiredFields.map(opportunityFieldIdToReasonCode)
  const recommendedReasonCodes = input.missingRecommendedFields.map(
    opportunityFieldIdToReasonCode,
  )

  return [
    {
      label: 'Required fields',
      weight: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
      score: roundScore(
        (input.requiredScore / 100) * OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
      ),
      maxScore: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
      reasonCodes: requiredReasonCodes,
    },
    {
      label: 'Recommended fields',
      weight: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
      score: roundScore(
        (input.recommendedScore / 100) * OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
      ),
      maxScore: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
      reasonCodes: recommendedReasonCodes,
    },
  ]
}

function buildTimelineFromSnapshot(
  input: OpportunityReadinessSnapshot,
): readonly TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (input.createdAt) {
    events.push({
      type: 'opportunity-created',
      title: 'Opportunity created',
      description: 'Opportunity draft record created.',
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  events.push({
    type: 'opportunity-evaluated',
    title: 'Opportunity readiness evaluated',
    description: buildSummary(input),
    timestamp: resolveGeneratedAt(input),
    status: input.publishReady
      ? TIMELINE_EVENT_STATUS.COMPLETED
      : input.missingRequiredFields.length > 0
        ? TIMELINE_EVENT_STATUS.BLOCKED
        : TIMELINE_EVENT_STATUS.ACTIVE,
    relatedEntity: input.entityId,
  })

  if (input.publishReady) {
    events.push({
      type: 'opportunity-publish-ready',
      title: 'Publish-ready milestone reached',
      description: 'All required opportunity fields are complete.',
      timestamp: resolveGeneratedAt(input),
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  return events
}

function buildOpportunityBundle(
  input: OpportunityReadinessSnapshot,
  engine: (typeof ENGINE_ID)[keyof typeof ENGINE_ID],
): ExplanationBundle {
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine,
    entityId: input.entityId,
    score: input.score,
    health: resolveHealth(input.health),
    summary: buildSummary(input),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: input.snapshot.engineVersion ?? OPPORTUNITY_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source:
        engine === ENGINE_ID.READINESS
          ? 'readiness-adapter'
          : 'opportunity-readiness-adapter',
      tags: [input.readinessLevel, input.health, input.publishReady ? 'publish-ready' : 'draft'],
      extensions: {
        subModelKey: input.subModelKey ?? null,
        readinessLevel: input.readinessLevel,
        publishReady: input.publishReady,
        requiredScore: input.requiredScore,
        recommendedScore: input.recommendedScore,
        knowledgeVersion: input.snapshot.knowledgeVersion,
        formVersion: input.snapshot.formVersion,
      },
    },
  }
}

export function buildOpportunityExplanation(
  input: OpportunityReadinessSnapshot,
): ExplanationBundle {
  return buildOpportunityBundle(input, ENGINE_ID.OPPORTUNITY)
}

export function buildReadinessExplanation(
  input: OpportunityReadinessSnapshot,
): ExplanationBundle {
  return buildOpportunityBundle(input, ENGINE_ID.READINESS)
}

export const opportunityExplainabilityAdapter: ExplainabilityAdapter<OpportunityReadinessSnapshot> =
  {
    buildExplanation: buildOpportunityExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }

/** Alias adapter — same snapshot input, `engine: readiness` on the bundle. */
export const readinessExplainabilityAdapter: ExplainabilityAdapter<OpportunityReadinessSnapshot> =
  {
    buildExplanation: buildReadinessExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
