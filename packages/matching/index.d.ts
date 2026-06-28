export type {
  OpportunityPost,
  NormalizedPost,
  NormalizedBudget,
  NormalizedTimeline,
  ValueExchange,
  ValueExchangeNormalized,
  MatchingWeights,
  MatchingConfig,
  HardConstraintResult,
  HardConstraintContext,
  ScoreLabel,
  ScoreFactorResult,
  ScoreBreakdown,
  ScoreLabels,
  ScorePairResult,
  RankedMatch,
  MatchRecommendation,
  MatchingModelName,
  SkillSynonymsMap,
  LocationCanonicalMap,
  CategoryExpansionTerm,
  CategoryExpansionMap,
  SemanticTermsMap,
  CanonicalData,
  CreatorProfile,
  SemanticProfile,
} from './dist-types/types/index'

export { EMPTY_CANONICAL_DATA } from './dist-types/types/canonical'

export {
  DEFAULT_WEIGHTS,
  DEFAULT_MATCHING_CONFIG,
  resolveWeights,
  withMatchingDefaults,
} from './dist-types/config/defaults'

export {
  ROLE_COMPATIBILITY,
  ROLE_ALIASES,
} from './dist-types/constraints/role-matrix'

export {
  normalizeRoleLabel,
  getNeedRole,
  getOfferRole,
  rolesCompatible,
  serviceOverlapScore,
  passesCoreSkills,
  passesServiceOverlap,
  passesPair,
} from './dist-types/constraints/hard-constraints'

export {
  budgetCompatible,
  locationCompatible,
  timelineOverlap,
  categoryOverlap,
  getCandidates,
  getCandidatesForOffer,
} from './dist-types/candidates/candidate-generator'
export type { CandidateGeneratorOptions } from './dist-types/candidates/candidate-generator'

export {
  labelFromScore,
  attributeOverlap,
  exchangeCompatibilityFactor,
  valueCompatibilityFactor,
  budgetFit,
  timelineFit,
  locationFit,
  reputationScore,
  scorePair,
} from './dist-types/scoring/post-to-post-scoring'
export { LABEL_PARTIAL } from './dist-types/scoring/label-from-score'

export {
  getNormalized,
  exchangeCompatibility,
  valueCompatibility,
  oneWayValueFit,
  barterValueEquivalence,
} from './dist-types/value/value-compatibility'
export type {
  OneWayValueFit,
  BarterValueEquivalence,
} from './dist-types/value/value-compatibility'

export { detectMatchingModel } from './dist-types/routing/detect-model'
export { rankMatches } from './dist-types/routing/rank-matches'
export { runMatchingForPost } from './dist-types/engine/run-matching-for-post'

export {
  normalizeSkill,
  toSkillString,
  normalizeLocation,
  normalizeCategory,
  extractBudget,
  extractTimeline,
  extractAndNormalize,
  expandTerm,
  buildSemanticProfile,
} from './dist-types/normalize'
export type { ExtractNormalizeOptions } from './dist-types/normalize/extract'

export {
  resolveThreshold,
  resolveMaxCandidates,
  resolveNormalized,
  passHardGate,
  withRunnerConfig,
  parseRoleDefinitions,
  buildRoleServices,
  buildSyntheticNeedForRole,
  estimateValueSar,
  valueEquivalenceText,
  barterSidePost,
  findOffersForNeedPure,
  findNeedsForOfferPure,
  findBarterMatchesPure,
  findConsortiumMatchesPure,
  normalizeCycleRing,
  buildCircularLinkScores,
  findCircularExchangesPure,
} from './dist-types/models'
export type {
  RoleDefinition,
  CircularEdgeDetail,
  CircularEdgeMap,
} from './dist-types/models/shared'
export type {
  SuggestedPartner,
  ScoredMatch,
  CircularLinkScore,
  ModelRunResultBase,
  OneWayMatchResult,
  TwoWayMatchResult,
  ConsortiumRoleResult,
  ConsortiumMatchResult,
  CircularMatchResult,
  ModelRunnerOptions,
} from './dist-types/types/model-results'
export type {
  MatchEngineInput,
  MatchEngineOptions,
  MatchEngineModelOption,
  ModelRunResult,
} from './dist-types/types/engine'
