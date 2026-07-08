import {
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '../knowledge/opportunity-core-readiness.ts'
import type { ReadinessHealth, ReadinessLevel } from './types.ts'

export function roundReadinessScore(value: number): number {
  return Math.round(value * 100) / 100
}

export function resolveReadinessLevel(
  score: number,
  publishReady: boolean,
  missingRecommendedCount: number,
): ReadinessLevel {
  if (score === 0) return 'draft'
  if (score > 0 && score < 40) return 'basic'
  if (!publishReady) return 'partial'
  if (publishReady && missingRecommendedCount > 0) return 'ready'
  return 'excellent'
}

export function resolveReadinessHealth(
  score: number,
  publishReady: boolean,
  missingRequiredCount: number,
  missingRecommendedCount: number,
): ReadinessHealth {
  if (missingRequiredCount > 0 || (!publishReady && score < 40)) return 'critical'
  if (!publishReady && score >= 40) return 'warning'
  if (publishReady && missingRecommendedCount > 3) return 'warning'
  if (publishReady && missingRecommendedCount > 0) return 'good'
  return 'excellent'
}

export function resolveLegacyOpportunityStatus(
  score: number,
  missingRequiredCount: number,
): 'incomplete' | 'needs_review' | 'ready_for_matching' {
  if (score < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.incompleteMax) {
    return 'incomplete'
  }
  if (
    missingRequiredCount > 0 ||
    score < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin
  ) {
    return 'needs_review'
  }
  return 'ready_for_matching'
}
