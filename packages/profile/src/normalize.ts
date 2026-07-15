import { validateProfile } from './validate.ts'
import {
  PROFILE_SCHEMA_VERSION,
  type CanonicalProfile,
  type CompanyProfile,
  type ContactVisibility,
  type EngagementMode,
  type IndividualProfile,
  type LegacyNormalizationResult,
  type LocalizedText,
  type MatchingPreferences,
  type PortfolioItem,
  type ProfileAvailability,
  type ProfileCredential,
  type ProfileExperience,
  type ProfileKind,
  type ProfileLocale,
  type ProfileLocation,
  type ProfileService,
} from './types.ts'

type UnknownRecord = Readonly<Record<string, unknown>>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function first(record: UnknownRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key]
  }
  return undefined
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1) return true
  if (value === 'false' || value === 0) return false
  return fallback
}

function strings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return unique(value.split(',').map((item) => item.trim()).filter(Boolean))
  }
  if (!Array.isArray(value)) return []
  return unique(value.map(text).filter((item): item is string => item !== undefined))
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)]
}

function localized(value: unknown): LocalizedText | undefined {
  const scalar = text(value)
  if (scalar) return { en: scalar }
  const record = asRecord(value)
  const ar = text(first(record, ['ar', 'arabic', 'nameAr', 'titleAr']))
  const en = text(first(record, ['en', 'english', 'nameEn', 'titleEn']))
  return ar || en ? { ...(ar ? { ar } : {}), ...(en ? { en } : {}) } : undefined
}

function location(value: unknown): ProfileLocation | undefined {
  const record = asRecord(value)
  const countryCode = text(first(record, ['countryCode', 'country_code', 'country']))?.toUpperCase()
  if (!countryCode) return undefined
  const region = text(first(record, ['region', 'province', 'state']))
  const city = text(record.city)
  return {
    countryCode,
    ...(region ? { region } : {}),
    ...(city ? { city } : {}),
  }
}

function itemId(record: UnknownRecord, prefix: string, index: number): string {
  return text(first(record, ['id', '_id'])) ?? `${prefix}-${index + 1}`
}

function services(value: unknown): readonly ProfileService[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    const record = asRecord(entry)
    const scalar = text(entry)
    const name = localized(first(record, ['name', 'title', 'label'])) ?? (scalar ? { en: scalar } : undefined)
    const category = text(first(record, ['category', 'categoryId', 'type'])) ?? scalar
    if (!name || !category) return []
    const description = localized(first(record, ['description', 'summary']))
    const proficiency = first(record, ['proficiency', 'level'])
    return [{
      id: itemId(record, 'service', index),
      category,
      name,
      ...(description ? { description } : {}),
      skillTags: strings(first(record, ['skillTags', 'skills', 'tags'])),
      ...(proficiency === 'basic' || proficiency === 'intermediate' ||
          proficiency === 'advanced' || proficiency === 'expert'
        ? { proficiency }
        : {}),
    }]
  })
}

function experience(value: unknown): readonly ProfileExperience[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    const record = asRecord(entry)
    const title = localized(first(record, ['title', 'role', 'position']))
    if (!title) return []
    const organization = text(first(record, ['organization', 'company', 'employer']))
    const sector = text(first(record, ['sector', 'industry']))
    const description = localized(first(record, ['description', 'summary']))
    const startedOn = text(first(record, ['startedOn', 'startDate', 'from']))
    const endedOn = text(first(record, ['endedOn', 'endDate', 'to']))
    return [{
      id: itemId(record, 'experience', index),
      title,
      ...(organization ? { organization } : {}),
      ...(sector ? { sector } : {}),
      ...(description ? { description } : {}),
      ...(startedOn ? { startedOn } : {}),
      ...(endedOn ? { endedOn } : {}),
      isCurrent: booleanValue(first(record, ['isCurrent', 'current']), !endedOn),
      skillTags: strings(first(record, ['skillTags', 'skills', 'tags'])),
    }]
  })
}

function portfolio(value: unknown): readonly PortfolioItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    const record = asRecord(entry)
    const title = localized(first(record, ['title', 'name']))
    if (!title) return []
    const description = localized(first(record, ['description', 'summary']))
    const sector = text(first(record, ['sector', 'industry']))
    const completedOn = text(first(record, ['completedOn', 'completionDate', 'date']))
    const url = text(first(record, ['url', 'link']))
    return [{
      id: itemId(record, 'portfolio', index),
      title,
      ...(description ? { description } : {}),
      ...(sector ? { sector } : {}),
      ...(completedOn ? { completedOn } : {}),
      ...(url ? { url } : {}),
      skillTags: strings(first(record, ['skillTags', 'skills', 'tags'])),
    }]
  })
}

function credentials(value: unknown): readonly ProfileCredential[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    const record = asRecord(entry)
    const name = localized(first(record, ['name', 'title', 'certificate']))
    if (!name) return []
    const rawStatus = first(record, ['status', 'state'])
    const status = rawStatus === 'expired' || rawStatus === 'pending' || rawStatus === 'revoked'
      ? rawStatus
      : 'active'
    const issuer = text(first(record, ['issuer', 'authority', 'institution']))
    const credentialType = text(first(record, ['credentialType', 'type', 'category']))
    const issuedOn = text(first(record, ['issuedOn', 'issueDate']))
    const expiresOn = text(first(record, ['expiresOn', 'expiryDate']))
    const verificationUrl = text(first(record, ['verificationUrl', 'url']))
    return [{
      id: itemId(record, 'credential', index),
      name,
      ...(issuer ? { issuer } : {}),
      ...(credentialType ? { credentialType } : {}),
      status,
      ...(issuedOn ? { issuedOn } : {}),
      ...(expiresOn ? { expiresOn } : {}),
      ...(verificationUrl ? { verificationUrl } : {}),
    }]
  })
}

function engagementModes(value: unknown): readonly EngagementMode[] {
  return strings(value).filter(
    (mode): mode is EngagementMode => mode === 'onsite' || mode === 'remote' || mode === 'hybrid',
  )
}

function availability(value: unknown): ProfileAvailability {
  const record = asRecord(value)
  const rawStatus = first(record, ['status', 'availabilityStatus'])
  const status = rawStatus === 'limited' || rawStatus === 'unavailable' ? rawStatus : 'available'
  const availableFrom = text(first(record, ['availableFrom', 'startDate']))
  const hoursPerWeek = numberValue(first(record, ['hoursPerWeek', 'weeklyHours', 'capacity']))
  const rawLocations = first(record, ['locations', 'preferredLocations'])
  const locations = Array.isArray(rawLocations)
    ? rawLocations.map(location).filter((item): item is ProfileLocation => item !== undefined)
    : []
  return {
    status,
    ...(availableFrom ? { availableFrom } : {}),
    ...(hoursPerWeek !== undefined ? { hoursPerWeek } : {}),
    engagementModes: engagementModes(first(record, ['engagementModes', 'workModes', 'modes'])),
    locations,
  }
}

function visibility(value: unknown): ContactVisibility {
  const record = asRecord(value)
  return {
    email: booleanValue(first(record, ['email', 'showEmail']), false),
    phone: booleanValue(first(record, ['phone', 'showPhone']), false),
    website: booleanValue(first(record, ['website', 'showWebsite']), false),
    linkedin: booleanValue(first(record, ['linkedin', 'showLinkedin']), false),
  }
}

function preferences(value: unknown): MatchingPreferences {
  const record = asRecord(value)
  const rawLocations = first(record, ['preferredLocations', 'locations'])
  const preferredLocations = Array.isArray(rawLocations)
    ? rawLocations.map(location).filter((item): item is ProfileLocation => item !== undefined)
    : []
  const minimumBudgetSar = numberValue(first(record, ['minimumBudgetSar', 'minBudget', 'minimumBudget']))
  const maximumBudgetSar = numberValue(first(record, ['maximumBudgetSar', 'maxBudget', 'maximumBudget']))
  return {
    enabled: booleanValue(first(record, ['enabled', 'matchingEnabled']), true),
    serviceCategories: strings(first(record, ['serviceCategories', 'categories'])),
    skillTags: strings(first(record, ['skillTags', 'skills'])),
    sectors: strings(first(record, ['sectors', 'industries'])),
    preferredLocations,
    engagementModes: engagementModes(first(record, ['engagementModes', 'workModes'])),
    ...(minimumBudgetSar !== undefined ? { minimumBudgetSar } : {}),
    ...(maximumBudgetSar !== undefined ? { maximumBudgetSar } : {}),
  }
}

function inferKind(record: UnknownRecord): ProfileKind {
  const candidate = text(first(record, ['kind', 'type', 'profileType', 'accountType']))?.toLowerCase()
  if (candidate === 'company' || candidate === 'business' || candidate === 'organization') return 'company'
  if (isRecord(record.company) || text(first(record, ['legalName', 'companyName', 'commercialRegistrationNumber']))) {
    return 'company'
  }
  return 'individual'
}

export function normalizeLegacyProfile(input: unknown): LegacyNormalizationResult {
  const root = asRecord(input)
  const nested = asRecord(first(root, ['profile', 'profileData', 'details']))
  const source: UnknownRecord = { ...root, ...nested }
  const kind = inferKind(source)
  const id = text(first(source, ['id', 'profileId', '_id'])) ?? 'legacy-profile'
  const partyId = text(first(source, ['partyId', 'ownerPartyId', 'userId', 'companyId'])) ?? `party-${id}`
  const displayName = text(first(source, ['displayName', 'name', 'fullName', 'companyName', 'legalName'])) ??
    'Unnamed profile'
  const localeValue = first(source, ['locale', 'language'])
  const locale: ProfileLocale = localeValue === 'ar-SA' || localeValue === 'ar' ? 'ar-SA' : 'en-SA'
  const headline = localized(first(source, ['headline', 'title', 'tagline']))
  const summary = localized(first(source, ['summary', 'bio', 'about', 'description']))
  const sourceLocation = location(first(source, ['location', 'address']))
  const contactRecord = asRecord(first(source, ['contact', 'contactInfo']))
  const email = text(first(contactRecord, ['email', 'emailAddress'])) ??
    text(first(source, ['email', 'emailAddress']))
  const phone = text(first(contactRecord, ['phone', 'phoneNumber', 'mobile'])) ??
    text(first(source, ['phone', 'phoneNumber', 'mobile']))
  const website = text(first(contactRecord, ['website', 'websiteUrl'])) ?? text(source.website)
  const linkedin = text(first(contactRecord, ['linkedin', 'linkedinUrl'])) ?? text(source.linkedin)

  const base = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    id,
    partyId,
    kind,
    displayName,
    ...(headline ? { headline } : {}),
    ...(summary ? { summary } : {}),
    locale,
    ...(sourceLocation ? { location: sourceLocation } : {}),
    services: services(first(source, ['services', 'serviceOfferings', 'offerings'])),
    experience: experience(first(source, ['experience', 'experiences', 'workExperience'])),
    portfolio: portfolio(first(source, ['portfolio', 'projects', 'portfolioItems'])),
    credentials: credentials(first(source, ['credentials', 'certifications', 'licenses'])),
    availability: availability(first(source, ['availability', 'capacity'])),
    contact: {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(website ? { website } : {}),
      ...(linkedin ? { linkedin } : {}),
    },
    contactVisibility: visibility(first(source, ['contactVisibility', 'visibility', 'privacy'])),
    matchingPreferences: preferences(first(source, ['matchingPreferences', 'matchPreferences', 'preferences'])),
  } as const

  const profile: CanonicalProfile = kind === 'company'
    ? ({
        ...base,
        kind: 'company',
        company: normalizeCompany(source, displayName),
      } satisfies CompanyProfile)
    : ({
        ...base,
        kind: 'individual',
        individual: normalizeIndividual(source, displayName),
      } satisfies IndividualProfile)

  return { profile, issues: validateProfile(profile).issues }
}

function normalizeIndividual(source: UnknownRecord, displayName: string): IndividualProfile['individual'] {
  const record = { ...source, ...asRecord(source.individual) }
  const professionalTitle = text(first(record, ['professionalTitle', 'jobTitle', 'title']))
  const yearsOfExperience = numberValue(first(record, ['yearsOfExperience', 'experienceYears']))
  return {
    fullName: text(first(record, ['fullName', 'name'])) ?? displayName,
    ...(professionalTitle ? { professionalTitle } : {}),
    ...(yearsOfExperience !== undefined ? { yearsOfExperience } : {}),
    languages: strings(first(record, ['languages', 'spokenLanguages'])),
  }
}

function normalizeCompany(source: UnknownRecord, displayName: string): CompanyProfile['company'] {
  const record = { ...source, ...asRecord(source.company) }
  const commercialRegistrationNumber = text(
    first(record, ['commercialRegistrationNumber', 'crNumber', 'registrationNumber']),
  )
  const organizationType = text(first(record, ['organizationType', 'companyType', 'businessType']))
  const foundedYear = numberValue(first(record, ['foundedYear', 'yearFounded']))
  const employeeCountRange = text(first(record, ['employeeCountRange', 'companySize', 'employees']))
  return {
    legalName: text(first(record, ['legalName', 'companyName', 'name'])) ?? displayName,
    ...(commercialRegistrationNumber ? { commercialRegistrationNumber } : {}),
    ...(organizationType ? { organizationType } : {}),
    ...(foundedYear !== undefined ? { foundedYear } : {}),
    ...(employeeCountRange ? { employeeCountRange } : {}),
    sectors: strings(first(record, ['sectors', 'industries', 'industry'])),
  }
}
