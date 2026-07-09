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
  buildPublishReadinessBundles,
  enrichBundle,
  getAggregatedRecommendations,
  bundleToReadinessTooltipLines,
  bundleToMatchTooltipLines,
  recommendationService,
} from './explainability-service.ts'

export type { ExplainabilityLocaleOptions } from './explainability-service.ts'

export * from './snapshot-builders/index.ts'
