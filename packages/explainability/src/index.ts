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
  KnowledgeAnswer,
  KnowledgeBridge,
  KnowledgeBridgeRequest,
} from './services/knowledge-bridge.ts'

export type {
  RecommendationService,
  RecommendationServiceInput,
} from './services/recommendation-service.ts'

export type { AIExplanationPayload } from './ai/serialization.ts'

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
