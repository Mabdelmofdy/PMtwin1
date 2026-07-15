export {
  PROFILE_SCHEMA_VERSION,
} from './types.ts'

export type {
  CanonicalProfile,
  CanonicalProfileBase,
  CompanyProfile,
  ContactChannel,
  ContactVisibility,
  CredentialStatus,
  EngagementMode,
  IndividualProfile,
  LegacyNormalizationResult,
  LocalizedText,
  MatchingPreferences,
  MatchingProfileSnapshot,
  PortfolioItem,
  ProficiencyLevel,
  ProfileAvailability,
  ProfileContact,
  ProfileCredential,
  ProfileExperience,
  ProfileKind,
  ProfileLocale,
  ProfileLocation,
  ProfileSchemaVersion,
  ProfileService,
  ProfileValidationCode,
  ProfileValidationIssue,
  ProfileValidationResult,
  PublicProfile,
  PublicProfileService,
} from './types.ts'

export { normalizeLegacyProfile } from './normalize.ts'
export { assertValidProfile, validateProfile } from './validate.ts'
export { toMatchingProfileSnapshot, toPublicProfile } from './projections.ts'
