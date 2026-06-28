import {
  getProfileReadinessRules,
  PROFILE_READINESS_SCORE_WEIGHTS,
  PROFILE_READINESS_STATUS_THRESHOLDS,
} from '@/domain/profile-readiness/profile-readiness-rules.ts'
import type {
  ProfileFieldRule,
  ProfileReadinessInput,
  ProfileReadinessProfile,
  ProfileReadinessResult,
  ProfileReadinessStatus,
} from '@/domain/profile-readiness/types.ts'

function evaluateRules(
  profile: ProfileReadinessProfile,
  rules: readonly ProfileFieldRule[],
): { readonly present: number; readonly missing: readonly string[] } {
  const missing: string[] = []
  let present = 0

  for (const rule of rules) {
    if (rule.isPresent(profile)) {
      present += 1
    } else {
      missing.push(rule.label)
    }
  }

  return { present, missing }
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function computeWeightedScore(
  requiredPresent: number,
  requiredTotal: number,
  recommendedPresent: number,
  recommendedTotal: number,
): number {
  const requiredRatio = requiredTotal === 0 ? 1 : requiredPresent / requiredTotal
  const recommendedRatio = recommendedTotal === 0 ? 1 : recommendedPresent / recommendedTotal

  const score =
    requiredRatio * PROFILE_READINESS_SCORE_WEIGHTS.required +
    recommendedRatio * PROFILE_READINESS_SCORE_WEIGHTS.recommended

  return roundScore(score)
}

function isHeavilyMissingRequired(missingRequiredCount: number, requiredTotal: number): boolean {
  if (requiredTotal === 0) return false
  return missingRequiredCount > requiredTotal / 2
}

function resolveStatus(
  score: number,
  missingRequired: readonly string[],
  missingRecommended: readonly string[],
  requiredTotal: number,
): ProfileReadinessStatus {
  if (
    score < PROFILE_READINESS_STATUS_THRESHOLDS.incompleteMax ||
    isHeavilyMissingRequired(missingRequired.length, requiredTotal)
  ) {
    return 'incomplete'
  }

  if (
    missingRequired.length > 0 ||
    missingRecommended.length > 0 ||
    score < PROFILE_READINESS_STATUS_THRESHOLDS.readyMin
  ) {
    return 'needs_review'
  }

  return 'ready_for_matching'
}

export function evaluateProfileReadiness(input: ProfileReadinessInput): ProfileReadinessResult {
  const profile: ProfileReadinessProfile = input.profile ?? {}
  const { required, recommended } = getProfileReadinessRules(input.profileKind)

  const requiredEvaluation = evaluateRules(profile, required)
  const recommendedEvaluation = evaluateRules(profile, recommended)

  const score = computeWeightedScore(
    requiredEvaluation.present,
    required.length,
    recommendedEvaluation.present,
    recommended.length,
  )

  const status = resolveStatus(
    score,
    requiredEvaluation.missing,
    recommendedEvaluation.missing,
    required.length,
  )

  return {
    score,
    status,
    missingRequired: requiredEvaluation.missing,
    missingRecommended: recommendedEvaluation.missing,
  }
}
