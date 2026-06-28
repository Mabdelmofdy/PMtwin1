export { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
export {
  getOpportunityReadinessRules,
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@/domain/opportunity-readiness/opportunity-readiness-rules.ts'
export type {
  OpportunityFieldRule,
  OpportunityReadinessOpportunity,
  OpportunityReadinessResult,
  OpportunityReadinessStatus,
} from '@/domain/opportunity-readiness/types.ts'
