/**
 * Deprecated shim — thresholds and weights now live in @pm-twin/collaboration-models.
 * Rule evaluation moved to evaluateReadiness (Knowledge Registry).
 */
import type { OpportunityFieldRule } from '@/domain/opportunity-readiness/types.ts'

export {
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@pm-twin/collaboration-models'

export function getOpportunityReadinessRules(): {
  readonly required: readonly OpportunityFieldRule[]
  readonly recommended: readonly OpportunityFieldRule[]
} {
  return { required: [], recommended: [] }
}
