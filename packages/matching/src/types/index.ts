export type {
  OpportunityPost,
  NormalizedPost,
  NormalizedBudget,
  NormalizedTimeline,
  ValueExchange,
  ValueExchangeNormalized,
} from './opportunity.ts'

export {
  PROFILE_FIT_SNAPSHOT_KIND,
} from './profile-fit.ts'
export type {
  ProfileFitWorkMode,
  ProfileFitGeography,
  ProfileFitAvailability,
  ProfileFitCounterpartPreference,
  ProfileFitSnapshot,
  ProfileFitFactorName,
  ProfileFitFactorExplanation,
  ProfileFitScore,
  ProfileFitTarget,
} from './profile-fit.ts'

export type {
  SkillSynonymsMap,
  LocationCanonicalMap,
  CategoryExpansionTerm,
  CategoryExpansionMap,
  SemanticTermsMap,
  CanonicalData,
} from './canonical.ts'
export { EMPTY_CANONICAL_DATA } from './canonical.ts'

export type { CreatorProfile } from './creator.ts'

export type { SemanticProfile } from './semantic-profile.ts'

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
} from './model-results.ts'

export type {
  MatchEngineInput,
  MatchEngineOptions,
  MatchEngineModelOption,
  ModelRunResult,
} from './engine.ts'

export type {
  MatchingWeights,
  MatchingConfig,
} from './matching-config.ts'

export type {
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
} from './match-result.ts'
