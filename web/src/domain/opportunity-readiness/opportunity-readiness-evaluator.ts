import {
  getOpportunityReadinessRules,
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@/domain/opportunity-readiness/opportunity-readiness-rules.ts'
import type {
  OpportunityFieldRule,
  OpportunityReadinessOpportunity,
  OpportunityReadinessResult,
  OpportunityReadinessStatus,
} from '@/domain/opportunity-readiness/types.ts'

function evaluateRules(
  opportunity: OpportunityReadinessOpportunity,
  rules: readonly OpportunityFieldRule[],
): {
  readonly present: number
  readonly presentLabels: readonly string[]
  readonly missing: readonly string[]
} {
  const presentLabels: string[] = []
  const missing: string[] = []
  let present = 0

  for (const rule of rules) {
    if (rule.isPresent(opportunity)) {
      present += 1
      presentLabels.push(rule.label)
    } else {
      missing.push(rule.label)
    }
  }

  return { present, presentLabels, missing }
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
    requiredRatio * OPPORTUNITY_READINESS_SCORE_WEIGHTS.required +
    recommendedRatio * OPPORTUNITY_READINESS_SCORE_WEIGHTS.recommended

  return roundScore(score)
}

function resolveStatus(
  score: number,
  missingRequired: readonly string[],
  missingRecommended: readonly string[],
): OpportunityReadinessStatus {
  if (score < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.incompleteMax) {
    return 'incomplete'
  }

  if (
    missingRequired.length > 0 ||
    missingRecommended.length > 0 ||
    score < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin
  ) {
    return 'needs_review'
  }

  return 'ready_for_matching'
}

export function evaluateOpportunityReadiness(
  opportunity?: OpportunityReadinessOpportunity | null,
): OpportunityReadinessResult {
  const record: OpportunityReadinessOpportunity = opportunity ?? {}
  const { required, recommended } = getOpportunityReadinessRules()

  const requiredEvaluation = evaluateRules(record, required)
  const recommendedEvaluation = evaluateRules(record, recommended)

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
  )

  return {
    score,
    status,
    missingRequired: requiredEvaluation.missing,
    missingRecommended: recommendedEvaluation.missing,
    presentRequired: requiredEvaluation.presentLabels,
    presentRecommended: recommendedEvaluation.presentLabels,
  }
}
