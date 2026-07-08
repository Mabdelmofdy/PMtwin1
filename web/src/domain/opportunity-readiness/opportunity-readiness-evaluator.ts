import {
  evaluateReadiness,
  resolveLegacyOpportunityStatus,
  type ReadinessResult,
} from '@pm-twin/collaboration-models'
import type {
  OpportunityReadinessOpportunity,
  OpportunityReadinessResult,
} from '@/domain/opportunity-readiness/types.ts'

export function toOpportunityReadinessResult(
  canonical: ReadinessResult,
): OpportunityReadinessResult {
  return {
    score: canonical.score,
    status: resolveLegacyOpportunityStatus(
      canonical.score,
      canonical.missingRequiredFields.length,
    ),
    missingRequired: canonical.missingRequiredFields,
    missingRecommended: canonical.missingRecommendedFields,
    presentRequired: canonical.completedRequiredFields,
    presentRecommended: canonical.completedRecommendedFields,
  }
}

export function evaluateOpportunityReadinessCanonical(
  opportunity?: OpportunityReadinessOpportunity | null,
): ReadinessResult {
  const formState = opportunity ?? {}
  const subModelKey =
    typeof formState.subModelType === 'string' ? formState.subModelType : undefined
  const contextValues = {
    ...(typeof formState.exchangeMode === 'string'
      ? { exchangeMode: formState.exchangeMode }
      : {}),
    ...(typeof formState.intent === 'string' ? { intent: formState.intent } : {}),
  }
  return evaluateReadiness({ subModelKey, formState, contextValues })
}

export function evaluateOpportunityReadiness(
  opportunity?: OpportunityReadinessOpportunity | null,
): OpportunityReadinessResult {
  return toOpportunityReadinessResult(evaluateOpportunityReadinessCanonical(opportunity))
}
