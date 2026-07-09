export {
  buildProfileExplanation,
  buildProfileExplanationFromEvaluation,
  buildVettingExplanation,
  buildOpportunityExplanation,
  buildOpportunityExplanationFromForm,
  buildMatchExplanation,
  buildAgreementExplanation,
  buildContractExplanation,
  buildNegotiationExplanation,
  buildDashboardExplanation,
  buildAnalyticsExplanation,
  buildPublishReadinessBundles,
  enrichBundle,
  getAggregatedRecommendations,
  bundleToReadinessTooltipLines,
  bundleToMatchTooltipLines,
  recommendationService,
} from './explainability-service.ts'

export type {
  ExplainabilityBuildResult,
  ExplainabilityLocaleOptions,
} from './explainability-service.ts'

export {
  aiExplanationGateway,
  buildAgentExplainabilityContext,
  exportExplanationBatch,
  exportExplanationPayload,
  importExplanationPayload,
  serializeBundleForAi,
} from './ai-gateway-service.ts'

export * from './snapshot-builders/index.ts'
