export type {
  BlockingFactor,
  EngineId,
  ExplanationBundle,
  ExplanationMetadata,
  ExplanationReason,
  ExplanationSeverity,
  Health,
  Recommendation,
  RecommendationPriority,
  ScoreBreakdownEntry,
  StrengthWeaknessEntry,
  TimelineEvent,
  TimelineEventStatus,
} from './types/index.ts'

export {
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
} from './types/index.ts'

export type {
  AgreementReasonCode,
  AnalyticsReasonCode,
  CommercialReasonCode,
  ContractReasonCode,
  DashboardReasonCode,
  DocumentReasonCode,
  KnowledgeReasonCode,
  MatchReasonCode,
  NegotiationReasonCode,
  ProfileReasonCode,
  ReadinessReasonCode,
  ReasonCode,
  ReasonCodePrefix,
  VettingReasonCode,
} from './reason-codes/index.ts'

export {
  AGREEMENT_REASON_CODES,
  ALL_REASON_CODES,
  ANALYTICS_REASON_CODES,
  COMMERCIAL_REASON_CODES,
  CONTRACT_REASON_CODES,
  DASHBOARD_REASON_CODES,
  DOCUMENT_REASON_CODES,
  KNOWLEDGE_REASON_CODES,
  MATCH_REASON_CODES,
  NEGOTIATION_REASON_CODES,
  PROFILE_REASON_CODES,
  READINESS_REASON_CODES,
  REASON_CODE_PREFIX,
  VETTING_REASON_CODES,
  assertReasonCode,
  isReasonCode,
} from './reason-codes/index.ts'

export type { ExplainabilityAdapter } from './adapters/explainability-adapter.ts'

export type {
  ProfileKind,
  ProfileReadinessSnapshot,
  ProfileReadinessStatus,
} from './adapters/profile-types.ts'

export {
  PROFILE_FIELD_LABEL_TO_REASON_CODE,
  profileFieldLabelToHref,
  profileFieldLabelToReasonCode,
} from './adapters/profile-field-map.ts'

export {
  PROFILE_ADAPTER_SCORE_WEIGHTS,
  PROFILE_ADAPTER_VERSION,
  buildProfileExplanation,
  profileExplainabilityAdapter,
} from './adapters/profile-adapter.ts'

export type {
  VettingDocumentEntry,
  VettingDocumentStatus,
  VettingReadinessSnapshot,
  VettingReadinessStatus,
  VettingReviewProgress,
} from './adapters/vetting-types.ts'

export {
  VETTING_DOCUMENT_LABEL_TO_REASON_CODE,
  VETTING_REVIEW_GAP_LABEL_TO_REASON_CODE,
  VETTING_REVIEW_PROGRESS_TO_REASON_CODE,
  vettingDocumentLabelToHref,
  vettingDocumentLabelToReasonCode,
  vettingDocumentTypeToHref,
  vettingDocumentTypeToReasonCode,
  vettingReviewGapLabelToHref,
  vettingReviewGapLabelToReasonCode,
  vettingReviewProgressToReasonCode,
} from './adapters/vetting-field-map.ts'

export {
  VETTING_ADAPTER_SCORE_WEIGHTS,
  VETTING_ADAPTER_VERSION,
  buildVettingExplanation,
  vettingExplainabilityAdapter,
} from './adapters/vetting-adapter.ts'

export type {
  OpportunityAction,
  OpportunityBlockingReason,
  OpportunityExplainabilitySeverity,
  OpportunityExplanation,
  OpportunityFieldContribution,
  OpportunityReadinessCategory,
  OpportunityReadinessHealth,
  OpportunityReadinessLevel,
  OpportunityReadinessReasonCode,
  OpportunityReadinessSnapshot,
  OpportunityReadinessSnapshotMeta,
} from './adapters/opportunity-types.ts'

export {
  OPPORTUNITY_FIELD_ID_TO_REASON_CODE,
  opportunityFieldIdToHref,
  opportunityFieldIdToReasonCode,
  opportunityReasonCodeToCanonical,
} from './adapters/opportunity-field-map.ts'

export {
  OPPORTUNITY_ADAPTER_SCORE_WEIGHTS,
  OPPORTUNITY_ADAPTER_VERSION,
  buildOpportunityExplanation,
  buildReadinessExplanation,
  opportunityExplainabilityAdapter,
  readinessExplainabilityAdapter,
} from './adapters/opportunity-adapter.ts'

export type {
  MatchBreakdownSnapshot,
  MatchExplainabilitySnapshot,
  MatchHardGateFailure,
  MatchLabelsSnapshot,
  MatchRecommendationSnapshot,
  MatchRecommendationTier,
  MatchScoreLabel,
  MatchTopology,
} from './adapters/matching-types.ts'

export {
  MATCH_ADAPTER_SCORE_WEIGHTS,
  MATCH_DIMENSION_LABELS,
  MATCH_DIMENSION_THRESHOLDS,
  MATCH_DIMENSION_TO_REASON_CODE,
  dimensionImprovementHint,
  isLowDimensionScore,
  labelFromDimensionScore,
  matchDimensionToReasonCode,
  matchHardGateCodeToReasonCode,
  matchTierToReasonCode,
  matchTopologyToReasonCode,
} from './adapters/matching-field-map.ts'

export {
  MATCHING_ADAPTER_VERSION,
  buildMatchingExplanation,
  matchingExplainabilityAdapter,
} from './adapters/matching-adapter.ts'

export type {
  CommercialTermsGap,
  NegotiationExplainabilitySnapshot,
  NegotiationOfferSnapshot,
  NegotiationStatus,
  NegotiationTimelineEventSnapshot,
} from './adapters/negotiation-types.ts'

export {
  NEGOTIATION_ADAPTER_SCORE_WEIGHTS,
  NEGOTIATION_BREAKDOWN_LABELS,
  NEGOTIATION_LARGE_PRICE_GAP_PERCENT,
  NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD,
  NEGOTIATION_STATUS_TO_REASON_CODE,
  isLargePriceGap,
  isResponseDelayed,
  negotiationGapToReasonCode,
  negotiationStatusToHref,
  negotiationStatusToReasonCode,
  negotiationTermsFieldToHref,
} from './adapters/negotiation-field-map.ts'

export {
  NEGOTIATION_ADAPTER_VERSION,
  buildNegotiationExplanation,
  computeNegotiationProgressScore,
  negotiationExplainabilityAdapter,
} from './adapters/negotiation-adapter.ts'

export type {
  AgreementDecisionStatus,
  AgreementAwardStatus,
  AgreementExplainabilitySnapshot,
  AgreementStageBlocker,
  AgreementStageTransition,
  AgreementStatus,
  AgreementTimelineEventSnapshot,
} from './adapters/agreement-types.ts'

export {
  AGREEMENT_ADAPTER_SCORE_WEIGHTS,
  AGREEMENT_BREAKDOWN_LABELS,
  AGREEMENT_STATUS_TO_REASON_CODE,
  agreementStatusToHref,
  agreementStatusToReasonCode,
  commercialAwardToReasonCode,
  commercialDecisionToReasonCode,
  hasPendingSignatures,
  isAwardPending,
  isDecisionPending,
} from './adapters/agreement-field-map.ts'

export {
  AGREEMENT_ADAPTER_VERSION,
  buildAgreementExplanation,
  computeAgreementProgressScore,
  agreementExplainabilityAdapter,
} from './adapters/agreement-adapter.ts'

export type {
  ContractExplainabilitySnapshot,
  ContractMilestoneSnapshot,
  ContractPartySignatureSnapshot,
  ContractStatus,
  ContractTimelineEventSnapshot,
} from './adapters/contract-types.ts'

export {
  CONTRACT_ADAPTER_SCORE_WEIGHTS,
  CONTRACT_BREAKDOWN_LABELS,
  CONTRACT_STATUS_TO_REASON_CODE,
  contractStatusToHref,
  contractStatusToReasonCode,
  hasBlockedMilestones,
  hasUnsignedParties,
  resolvePartiesSigned,
  resolveTotalParties,
} from './adapters/contract-field-map.ts'

export {
  CONTRACT_ADAPTER_VERSION,
  buildContractExplanation,
  computeContractProgressScore,
  contractExplainabilityAdapter,
} from './adapters/contract-adapter.ts'

export type {
  DashboardExplainabilitySnapshot,
  DashboardHeroMetric,
} from './adapters/dashboard-types.ts'

export {
  DASHBOARD_ADAPTER_SCORE_WEIGHTS,
  DASHBOARD_ADAPTER_VERSION,
  buildDashboardExplanation,
  dashboardExplainabilityAdapter,
} from './adapters/dashboard-adapter.ts'

export type {
  AnalyticsExplainabilitySnapshot,
  AnalyticsMatchingQualitySummary,
  AnalyticsReadinessSummary,
  AnalyticsRiskBlocker,
} from './adapters/analytics-types.ts'

export {
  ANALYTICS_ADAPTER_SCORE_WEIGHTS,
  ANALYTICS_ADAPTER_VERSION,
  buildAnalyticsExplanation,
  analyticsExplainabilityAdapter,
} from './adapters/analytics-adapter.ts'

export type {
  KnowledgeAnswer,
  KnowledgeBridge,
  KnowledgeBridgeRequest,
} from './services/knowledge-bridge.ts'

export { createKnowledgeBridge } from './services/knowledge-bridge-impl.ts'

export type {
  EnrichmentOptions,
  KnowledgeExtension,
} from './services/enrichment.ts'

export { enrichExplanationBundle } from './services/enrichment.ts'

export type {
  ExplainabilityLocale,
  LocalizedKnowledgeContent,
} from './services/locale.ts'

export {
  normalizeExplainabilityLocale,
  resolveLocalizedKnowledge,
} from './services/locale.ts'

export type {
  RecommendationService,
  RecommendationServiceInput,
} from './services/recommendation-service.ts'

export type { AggregateRecommendationsOptions } from './services/recommendation-service-impl.ts'

export {
  DEFAULT_AGGREGATE_RECOMMENDATION_LIMIT,
  aggregateRecommendations,
  createRecommendationService,
} from './services/recommendation-service-impl.ts'

export type { AIExplanationPayload } from './ai/serialization.ts'

export type { AgentExplainabilityContext } from './ai/agent-context.ts'

export type { AIExplanationGateway } from './ai/gateway.ts'

export {
  createAIExplanationGateway,
  importPayloadFromJson,
  serializeAgentContext,
} from './ai/gateway.ts'

export type {
  ExplainabilityTrace,
  ExplainabilityTraceResult,
} from './observability/trace.ts'

export { traceExplainabilityBuild } from './observability/trace.ts'

export {
  AI_EXPLANATION_PAYLOAD_VERSION,
  deserializeAIExplanationPayload,
  deserializeExplanationBundle,
  fromAIExplanationPayload,
  serializeAIExplanationPayload,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from './ai/serialization.ts'

export {
  EXPLANATION_BUNDLE_KEYS,
  isExplanationBundle,
} from './validation/bundle-shape.ts'
