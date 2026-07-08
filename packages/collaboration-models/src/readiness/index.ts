export type {
  ExplainabilitySeverity,
  OpportunityCoreReadinessDefinition,
  OpportunityCoreReadinessField,
  ReadinessAction,
  ReadinessBlockingReason,
  ReadinessBreakdown,
  ReadinessBreakdownEntry,
  ReadinessCategory,
  ReadinessEvaluateInput,
  ReadinessExplanation,
  ReadinessFieldContribution,
  ReadinessHealth,
  ReadinessLevel,
  ReadinessReasonCode,
  ReadinessResult,
  ReadinessSnapshot,
  ReadinessSummary,
  ReadinessTimelinePoint,
} from './types.ts'

export { READINESS_ENGINE_VERSION } from './types.ts'

export {
  evaluateReadiness,
  clearReadinessCaches,
} from './readiness-engine.ts'

export {
  resolveReadinessLevel,
  resolveReadinessHealth,
  resolveLegacyOpportunityStatus,
  roundReadinessScore,
} from './readiness-levels.ts'

export {
  isCoreFieldPresent,
  isEmptyReadinessValue,
  fieldIdToReasonCode,
  resolveIntent,
} from './field-presence.ts'

export {
  buildExplanations,
  buildBlockingReasons,
  buildNextBestActions,
  buildReadinessSummary,
  buildReadinessBreakdown,
  buildReadinessTimeline,
  getMissingRequiredFields,
  getMissingRecommendedFields,
  getNextBestActions,
  getBlockingReasons,
} from './explainability/index.ts'

export {
  OPPORTUNITY_CORE_READINESS,
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '../knowledge/opportunity-core-readiness.ts'

export { getValueExchangeReadinessFields } from '../knowledge/value-exchange-readiness.ts'
