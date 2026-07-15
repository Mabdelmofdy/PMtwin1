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
  ProfileSocialLinks,
  ProfileValidationCode,
  ProfileValidationIssue,
  ProfileValidationResult,
  PublicProfile,
  PublicProfileService,
  SocialPlatform,
} from './types.ts'

export { normalizeLegacyProfile } from './normalize.ts'
export { assertValidProfile, validateProfile } from './validate.ts'
export { toMatchingProfileSnapshot, toPublicProfile } from './projections.ts'
