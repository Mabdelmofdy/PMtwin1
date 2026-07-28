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
  ProfileFitWorkMode,
  ProfileFitGeography,
  ProfileFitAvailability,
  ProfileFitCounterpartPreference,
  ProfileFitSnapshot,
  ProfileFitFactorName,
  ProfileFitFactorExplanation,
  ProfileFitScore,
  ProfileFitTarget,
} from './types/index.ts'

export {
  EMPTY_CANONICAL_DATA,
  PROFILE_FIT_SNAPSHOT_KIND,
} from './types/index.ts'

export {
  DEFAULT_WEIGHTS,
  DEFAULT_MATCHING_CONFIG,
  resolveWeights,
  withMatchingDefaults,
} from './config/defaults.ts'

export {
  ROLE_COMPATIBILITY,
  ROLE_ALIASES,
} from './constraints/role-matrix.ts'

export {
  normalizeRoleLabel,
  getNeedRole,
  getOfferRole,
  rolesCompatible,
  serviceOverlapScore,
  passesCoreSkills,
  passesServiceOverlap,
  passesPair,
} from './constraints/hard-constraints.ts'

export {
  budgetCompatible,
  locationCompatible,
  timelineOverlap,
  categoryOverlap,
  getCandidates,
  getCandidatesForOffer,
} from './candidates/candidate-generator.ts'
export type { CandidateGeneratorOptions } from './candidates/candidate-generator.ts'

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
} from './scoring/post-to-post-scoring.ts'
export { LABEL_PARTIAL } from './scoring/label-from-score.ts'
export {
  isProfileFitSnapshot,
  scoreProfileFit,
} from './scoring/profile-fit-scoring.ts'

export {
  getNormalized,
  exchangeCompatibility,
  valueCompatibility,
  oneWayValueFit,
  barterValueEquivalence,
} from './value/value-compatibility.ts'
export type {
  OneWayValueFit,
  BarterValueEquivalence,
} from './value/value-compatibility.ts'

export { detectMatchingModel } from './routing/detect-model.ts'
export { rankMatches } from './routing/rank-matches.ts'

export { runMatchingForPost } from './engine/index.ts'

export {
  normalizeSkill,
  toSkillString,
  normalizeLocation,
  resolveLocationCountry,
  resolveCoverage,
  evaluateLocationCoverage,
  extractCoverageScopes,
  normalizeCategory,
  extractBudget,
  extractTimeline,
  extractAndNormalize,
  expandTerm,
  buildSemanticProfile,
} from './normalize/index.ts'
export type {
  ExtractNormalizeOptions,
  LocationCountryCode,
  LocationCoverageTier,
  LocationCoverageResult,
  ResolvedCoverage,
} from './normalize/index.ts'

export {
  resolveThreshold,
  resolveMaxCandidates,
  resolveNormalized,
  passHardGate,
  withRunnerConfig,
  parseRoleDefinitions,
  buildRoleServices,
  buildRoleSkillHints,
  buildSyntheticNeedForRole,
  estimateValueSar,
  valueEquivalenceText,
  barterSidePost,
  findOffersForNeedPure,
  findNeedsForOfferPure,
  findBarterMatchesPure,
  averageScoreBreakdown,
  findConsortiumMatchesPure,
  normalizeCycleRing,
  buildCircularLinkScores,
  findCircularExchangesPure,
} from './models/index.ts'
export type {
  RoleDefinition,
  CircularEdgeDetail,
  CircularEdgeMap,
} from './models/index.ts'
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
} from './types/index.ts'
export type {
  MatchEngineInput,
  MatchEngineOptions,
  MatchEngineModelOption,
  ModelRunResult,
} from './types/index.ts'

export {
  MATCHING_REJECT_REASONS,
  buildMatchedDiagnostic,
  buildRejectedDiagnostic,
  summarizeDiagnostics,
  diagnosticCheck,
  rejectReasonFromHardGate,
} from './diagnostics/matching-diagnostics.ts'
export type {
  MatchingDiagnosticCheckId,
  MatchingDiagnosticCheckStatus,
  MatchingDiagnosticCheck,
  MatchingCandidateDiagnostic,
  MatchingRunDiagnostic,
  MatchingRejectReason,
} from './diagnostics/matching-diagnostics.ts'
