import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  profileFieldLabelToHref,
  profileFieldLabelToReasonCode,
} from './profile-field-map.ts'
import type { ProfileReadinessSnapshot } from './profile-types.ts'
import { PROFILE_REASON_CODES } from '../reason-codes/profile.ts'
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

export const PROFILE_ADAPTER_VERSION = '1.0.0' as const

/** Mirrors profile-readiness-rules weights — used for impact estimates only. */
export const PROFILE_ADAPTER_SCORE_WEIGHTS = {
  required: 70,
  recommended: 30,
} as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveGeneratedAt(input: ProfileReadinessSnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

function resolveHealth(
  status: ProfileReadinessSnapshot['status'],
): (typeof HEALTH)[keyof typeof HEALTH] {
  if (status === 'ready_for_matching') {
    return HEALTH.EXCELLENT
  }
  if (status === 'needs_review') {
    return HEALTH.WARNING
  }
  return HEALTH.CRITICAL
}

function countPresent(
  total: number,
  missingCount: number,
): number {
  return Math.max(0, total - missingCount)
}

function requiredImpactPercent(input: ProfileReadinessSnapshot): number {
  if (input.requiredTotal === 0) return 0
  return roundScore(PROFILE_ADAPTER_SCORE_WEIGHTS.required / input.requiredTotal)
}

function recommendedImpactPercent(input: ProfileReadinessSnapshot): number {
  if (input.recommendedTotal === 0) return 0
  return roundScore(
    PROFILE_ADAPTER_SCORE_WEIGHTS.recommended / input.recommendedTotal,
  )
}

function buildSummary(input: ProfileReadinessSnapshot): string {
  if (input.completionLocked) {
    return 'Profile completion is locked — unlock and complete required fields to proceed.'
  }

  if (input.status === 'ready_for_matching') {
    return 'Profile is complete and ready for matching.'
  }

  if (input.status === 'needs_review') {
    const gapCount =
      input.missingRequired.length + input.missingRecommended.length
    return `Profile is partially complete — ${gapCount} field${gapCount === 1 ? '' : 's'} still need attention.`
  }

  return 'Profile is incomplete — complete required fields to improve matching readiness.'
}

function buildReasons(input: ProfileReadinessSnapshot): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = []

  if (input.completionLocked) {
    reasons.push({
      code: PROFILE_REASON_CODES.COMPLETION_LOCKED,
      message: 'Profile completion is locked until verification is finished.',
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: 'verification',
    })
  }

  for (const label of input.missingRequired) {
    reasons.push({
      code: profileFieldLabelToReasonCode(label),
      message: `Required field missing: ${label}.`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: 'required',
      relatedEntityId: input.entityId,
    })
  }

  for (const label of input.missingRecommended) {
    reasons.push({
      code: profileFieldLabelToReasonCode(label),
      message: `Recommended field missing: ${label}.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'recommended',
      relatedEntityId: input.entityId,
    })
  }

  if (reasons.length === 0) {
    reasons.push({
      code: PROFILE_REASON_CODES.COMPLETE,
      message: 'All profile fields are complete.',
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
    })
  }

  return reasons
}

function buildBlockers(input: ProfileReadinessSnapshot): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []

  if (input.completionLocked) {
    blockers.push({
      reasonCode: PROFILE_REASON_CODES.COMPLETION_LOCKED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: 'Complete identity verification to unlock profile editing.',
    })
    return blockers
  }

  for (const label of input.missingRequired) {
    blockers.push({
      reasonCode: profileFieldLabelToReasonCode(label),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: `Add ${label} to meet matching readiness requirements.`,
    })
  }

  return blockers
}

function buildStrengths(
  input: ProfileReadinessSnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []
  const requiredPresent = countPresent(
    input.requiredTotal,
    input.missingRequired.length,
  )

  if (requiredPresent === input.requiredTotal && input.requiredTotal > 0) {
    strengths.push({
      code: PROFILE_REASON_CODES.REQUIRED_COMPLETE,
      label: 'All required fields complete',
      impactPercent: PROFILE_ADAPTER_SCORE_WEIGHTS.required,
    })
  }

  const recommendedPresent = countPresent(
    input.recommendedTotal,
    input.missingRecommended.length,
  )

  if (
    recommendedPresent === input.recommendedTotal &&
    input.recommendedTotal > 0
  ) {
    strengths.push({
      code: PROFILE_REASON_CODES.RECOMMENDED_COMPLETE,
      label: 'All recommended fields complete',
      impactPercent: PROFILE_ADAPTER_SCORE_WEIGHTS.recommended,
    })
  }

  if (input.status === 'ready_for_matching') {
    strengths.push({
      code: PROFILE_REASON_CODES.COMPLETE,
      label: 'Profile ready for matching',
      impactPercent: 100,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: ProfileReadinessSnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  for (const label of input.missingRequired) {
    weaknesses.push({
      code: profileFieldLabelToReasonCode(label),
      label,
      impactPercent: requiredImpactPercent(input),
    })
  }

  for (const label of input.missingRecommended) {
    weaknesses.push({
      code: profileFieldLabelToReasonCode(label),
      label,
      impactPercent: recommendedImpactPercent(input),
    })
  }

  return weaknesses
}

function recommendationPriority(
  isRequired: boolean,
  status: ProfileReadinessSnapshot['status'],
): (typeof RECOMMENDATION_PRIORITY)[keyof typeof RECOMMENDATION_PRIORITY] {
  if (isRequired) {
    return status === 'incomplete'
      ? RECOMMENDATION_PRIORITY.CRITICAL
      : RECOMMENDATION_PRIORITY.HIGH
  }
  return RECOMMENDATION_PRIORITY.MEDIUM
}

function buildRecommendationEntry(
  input: ProfileReadinessSnapshot,
  label: string,
  isRequired: boolean,
  index: number,
): Recommendation {
  const impactPercent = isRequired
    ? requiredImpactPercent(input)
    : recommendedImpactPercent(input)
  const reasonCode = profileFieldLabelToReasonCode(label)
  const slug = reasonCode.replace('PROFILE_MISSING_', '').toLowerCase()

  return {
    id: `profile-rec-${slug}-${index}`,
    label: `Complete ${label}`,
    reasonCode,
    priority: recommendationPriority(isRequired, input.status),
    impactPercent,
    estimatedScore: roundScore(Math.min(100, input.score + impactPercent)),
    href: profileFieldLabelToHref(label),
    category: isRequired ? 'required' : 'recommended',
    severity: isRequired
      ? EXPLANATION_SEVERITY.CRITICAL
      : EXPLANATION_SEVERITY.WARNING,
  }
}

function buildRecommendationsFromSnapshot(
  input: ProfileReadinessSnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  let index = 0

  for (const label of input.missingRequired) {
    recommendations.push(buildRecommendationEntry(input, label, true, index))
    index += 1
  }

  for (const label of input.missingRecommended) {
    recommendations.push(buildRecommendationEntry(input, label, false, index))
    index += 1
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: ProfileReadinessSnapshot,
): readonly ScoreBreakdownEntry[] {
  const requiredPresent = countPresent(
    input.requiredTotal,
    input.missingRequired.length,
  )
  const recommendedPresent = countPresent(
    input.recommendedTotal,
    input.missingRecommended.length,
  )

  const requiredRatio =
    input.requiredTotal === 0 ? 1 : requiredPresent / input.requiredTotal
  const recommendedRatio =
    input.recommendedTotal === 0 ? 1 : recommendedPresent / input.recommendedTotal

  return [
    {
      label: 'Required fields',
      weight: PROFILE_ADAPTER_SCORE_WEIGHTS.required,
      score: roundScore(requiredRatio * PROFILE_ADAPTER_SCORE_WEIGHTS.required),
      maxScore: PROFILE_ADAPTER_SCORE_WEIGHTS.required,
      reasonCodes: input.missingRequired.map(profileFieldLabelToReasonCode),
    },
    {
      label: 'Recommended fields',
      weight: PROFILE_ADAPTER_SCORE_WEIGHTS.recommended,
      score: roundScore(
        recommendedRatio * PROFILE_ADAPTER_SCORE_WEIGHTS.recommended,
      ),
      maxScore: PROFILE_ADAPTER_SCORE_WEIGHTS.recommended,
      reasonCodes: input.missingRecommended.map(profileFieldLabelToReasonCode),
    },
  ]
}

function buildTimelineFromSnapshot(
  input: ProfileReadinessSnapshot,
): readonly TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (input.createdAt) {
    events.push({
      type: 'profile-created',
      title: 'Profile created',
      description: `${input.profileKind === 'company' ? 'Company' : 'Individual'} profile record created.`,
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  events.push({
    type: 'profile-evaluated',
    title: 'Profile readiness evaluated',
    description: buildSummary(input),
    timestamp: resolveGeneratedAt(input),
    status:
      input.status === 'ready_for_matching'
        ? TIMELINE_EVENT_STATUS.COMPLETED
        : input.status === 'needs_review'
          ? TIMELINE_EVENT_STATUS.ACTIVE
          : TIMELINE_EVENT_STATUS.BLOCKED,
    relatedEntity: input.entityId,
  })

  return events
}

export function buildProfileExplanation(
  input: ProfileReadinessSnapshot,
): ExplanationBundle {
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.PROFILE,
    entityId: input.entityId,
    score: input.score,
    health: resolveHealth(input.status),
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
      engineVersion: PROFILE_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source: 'profile-readiness-adapter',
      tags: [input.profileKind, input.status],
      extensions: {
        profileKind: input.profileKind,
        readinessStatus: input.status,
        completionLocked: input.completionLocked ?? false,
      },
    },
  }
}

export const profileExplainabilityAdapter: ExplainabilityAdapter<ProfileReadinessSnapshot> =
  {
    buildExplanation: buildProfileExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
