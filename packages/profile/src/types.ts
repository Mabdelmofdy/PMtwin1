export const PROFILE_SCHEMA_VERSION = 1 as const

export type ProfileSchemaVersion = typeof PROFILE_SCHEMA_VERSION
export type ProfileKind = 'individual' | 'company'
export type ProfileLocale = 'ar-SA' | 'en-SA'
export type ProficiencyLevel = 'basic' | 'intermediate' | 'advanced' | 'expert'
export type CredentialStatus = 'active' | 'expired' | 'pending' | 'revoked'
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable'
export type EngagementMode = 'onsite' | 'remote' | 'hybrid'
export type ContactChannel = 'email' | 'phone' | 'website' | 'linkedin'

export type LocalizedText = {
  readonly ar?: string
  readonly en?: string
}

export type ProfileLocation = {
  readonly countryCode: string
  readonly region?: string
  readonly city?: string
}

export type ProfileService = {
  readonly id: string
  readonly category: string
  readonly name: LocalizedText
  readonly description?: LocalizedText
  readonly skillTags: readonly string[]
  readonly proficiency?: ProficiencyLevel
}

export type ProfileExperience = {
  readonly id: string
  readonly title: LocalizedText
  readonly organization?: string
  readonly sector?: string
  readonly description?: LocalizedText
  readonly startedOn?: string
  readonly endedOn?: string
  readonly isCurrent: boolean
  readonly skillTags: readonly string[]
}

export type PortfolioItem = {
  readonly id: string
  readonly title: LocalizedText
  readonly description?: LocalizedText
  readonly sector?: string
  readonly completedOn?: string
  readonly url?: string
  readonly skillTags: readonly string[]
}

export type ProfileCredential = {
  readonly id: string
  readonly name: LocalizedText
  readonly issuer?: string
  readonly credentialType?: string
  readonly status: CredentialStatus
  readonly issuedOn?: string
  readonly expiresOn?: string
  readonly verificationUrl?: string
}

export type ProfileAvailability = {
  readonly status: AvailabilityStatus
  readonly availableFrom?: string
  readonly hoursPerWeek?: number
  readonly engagementModes: readonly EngagementMode[]
  readonly locations: readonly ProfileLocation[]
}

export type ProfileContact = {
  readonly email?: string
  readonly phone?: string
  readonly website?: string
  readonly linkedin?: string
}

export type ContactVisibility = {
  readonly email: boolean
  readonly phone: boolean
  readonly website: boolean
  readonly linkedin: boolean
}

export type MatchingPreferences = {
  readonly enabled: boolean
  readonly serviceCategories: readonly string[]
  readonly skillTags: readonly string[]
  readonly sectors: readonly string[]
  readonly preferredLocations: readonly ProfileLocation[]
  readonly engagementModes: readonly EngagementMode[]
  readonly minimumBudgetSar?: number
  readonly maximumBudgetSar?: number
}

export type CanonicalProfileBase = {
  readonly schemaVersion: ProfileSchemaVersion
  readonly id: string
  readonly partyId: string
  readonly kind: ProfileKind
  readonly displayName: string
  readonly headline?: LocalizedText
  readonly summary?: LocalizedText
  readonly locale: ProfileLocale
  readonly location?: ProfileLocation
  readonly services: readonly ProfileService[]
  readonly experience: readonly ProfileExperience[]
  readonly portfolio: readonly PortfolioItem[]
  readonly credentials: readonly ProfileCredential[]
  readonly availability: ProfileAvailability
  readonly contact: ProfileContact
  readonly contactVisibility: ContactVisibility
  readonly matchingPreferences: MatchingPreferences
}

export type IndividualProfile = CanonicalProfileBase & {
  readonly kind: 'individual'
  readonly individual: {
    readonly fullName: string
    readonly professionalTitle?: string
    readonly yearsOfExperience?: number
    readonly languages: readonly string[]
  }
}

export type CompanyProfile = CanonicalProfileBase & {
  readonly kind: 'company'
  readonly company: {
    readonly legalName: string
    readonly commercialRegistrationNumber?: string
    readonly organizationType?: string
    readonly foundedYear?: number
    readonly employeeCountRange?: string
    readonly sectors: readonly string[]
  }
}

export type CanonicalProfile = IndividualProfile | CompanyProfile

export type ProfileValidationCode =
  | 'invalid_type'
  | 'required'
  | 'invalid_value'
  | 'invalid_format'
  | 'out_of_range'
  | 'duplicate'
  | 'inconsistent'
  | 'unsupported_schema_version'

export type ProfileValidationIssue = {
  readonly code: ProfileValidationCode
  readonly path: string
  readonly message: string
}

export type ProfileValidationResult = {
  readonly valid: boolean
  readonly issues: readonly ProfileValidationIssue[]
}

export type LegacyNormalizationResult = {
  readonly profile: CanonicalProfile
  readonly issues: readonly ProfileValidationIssue[]
}

export type PublicProfileService = Pick<
  ProfileService,
  'id' | 'category' | 'name' | 'description' | 'skillTags' | 'proficiency'
>

export type PublicProfile = {
  readonly schemaVersion: ProfileSchemaVersion
  readonly id: string
  readonly partyId: string
  readonly kind: ProfileKind
  readonly displayName: string
  readonly headline?: LocalizedText
  readonly summary?: LocalizedText
  readonly locale: ProfileLocale
  readonly location?: ProfileLocation
  readonly services: readonly PublicProfileService[]
  readonly experience: readonly ProfileExperience[]
  readonly portfolio: readonly PortfolioItem[]
  readonly credentials: readonly ProfileCredential[]
  readonly availability: ProfileAvailability
  readonly contact: Partial<Readonly<Record<ContactChannel, string>>>
  readonly individual?: IndividualProfile['individual']
  readonly company?: Omit<CompanyProfile['company'], 'commercialRegistrationNumber'>
}

export type MatchingProfileSnapshot = {
  readonly schemaVersion: ProfileSchemaVersion
  readonly kind: ProfileKind
  readonly serviceCategories: readonly string[]
  readonly skillTags: readonly string[]
  readonly sectors: readonly string[]
  readonly credentialTypes: readonly string[]
  readonly yearsOfExperience?: number
  readonly availabilityStatus: AvailabilityStatus
  readonly hoursPerWeek?: number
  readonly engagementModes: readonly EngagementMode[]
  readonly locationCountryCode?: string
  readonly locationRegion?: string
  readonly matchingPreferences: MatchingPreferences
}
