import {
  PROFILE_SCHEMA_VERSION,
  type CanonicalProfile,
  type LocalizedText,
  type ProfileLocation,
  type ProfileValidationIssue,
  type ProfileValidationResult,
} from './types.ts'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COUNTRY_CODE = /^[A-Z]{2}$/

function issue(
  issues: ProfileValidationIssue[],
  code: ProfileValidationIssue['code'],
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

function requiredString(
  issues: ProfileValidationIssue[],
  value: string,
  path: string,
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issue(issues, 'required', path, 'Must be a non-empty string')
  }
}

function optionalDate(
  issues: ProfileValidationIssue[],
  value: string | undefined,
  path: string,
): void {
  if (value !== undefined && (!ISO_DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) {
    issue(issues, 'invalid_format', path, 'Must be a valid ISO date (YYYY-MM-DD)')
  }
}

function optionalUrl(
  issues: ProfileValidationIssue[],
  value: string | undefined,
  path: string,
): void {
  if (value === undefined) return
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('invalid protocol')
  } catch {
    issue(issues, 'invalid_format', path, 'Must be an HTTP or HTTPS URL')
  }
}

function validateLocalized(
  issues: ProfileValidationIssue[],
  value: LocalizedText | undefined,
  path: string,
  required = false,
): void {
  if (!value) {
    if (required) issue(issues, 'required', path, 'At least one localized value is required')
    return
  }
  const ar = value.ar?.trim()
  const en = value.en?.trim()
  if (!ar && !en) issue(issues, 'required', path, 'At least one localized value is required')
}

function validateLocation(
  issues: ProfileValidationIssue[],
  value: ProfileLocation | undefined,
  path: string,
): void {
  if (!value) return
  if (!COUNTRY_CODE.test(value.countryCode)) {
    issue(issues, 'invalid_format', `${path}.countryCode`, 'Must be a two-letter uppercase country code')
  }
}

function validateUnique(
  issues: ProfileValidationIssue[],
  values: readonly string[],
  path: string,
): void {
  const seen = new Set<string>()
  values.forEach((value, index) => {
    requiredString(issues, value, `${path}[${index}]`)
    const key = value.trim().toLowerCase()
    if (seen.has(key)) issue(issues, 'duplicate', `${path}[${index}]`, 'Duplicate value')
    seen.add(key)
  })
}

export function validateProfile(profile: CanonicalProfile): ProfileValidationResult {
  const issues: ProfileValidationIssue[] = []
  if (profile.schemaVersion !== PROFILE_SCHEMA_VERSION) {
    issue(issues, 'unsupported_schema_version', 'schemaVersion', `Must equal ${PROFILE_SCHEMA_VERSION}`)
  }
  requiredString(issues, profile.id, 'id')
  requiredString(issues, profile.partyId, 'partyId')
  requiredString(issues, profile.displayName, 'displayName')
  validateLocalized(issues, profile.headline, 'headline')
  validateLocalized(issues, profile.summary, 'summary')
  validateLocation(issues, profile.location, 'location')

  const ids: string[] = []
  profile.services.forEach((service, index) => {
    const path = `services[${index}]`
    requiredString(issues, service.id, `${path}.id`)
    ids.push(service.id)
    requiredString(issues, service.category, `${path}.category`)
    validateLocalized(issues, service.name, `${path}.name`, true)
    validateLocalized(issues, service.description, `${path}.description`)
    validateUnique(issues, service.skillTags, `${path}.skillTags`)
  })
  validateIds(issues, ids, 'services')

  ids.length = 0
  profile.experience.forEach((entry, index) => {
    const path = `experience[${index}]`
    requiredString(issues, entry.id, `${path}.id`)
    ids.push(entry.id)
    validateLocalized(issues, entry.title, `${path}.title`, true)
    validateLocalized(issues, entry.description, `${path}.description`)
    optionalDate(issues, entry.startedOn, `${path}.startedOn`)
    optionalDate(issues, entry.endedOn, `${path}.endedOn`)
    if (entry.startedOn && entry.endedOn && entry.startedOn > entry.endedOn) {
      issue(issues, 'inconsistent', `${path}.endedOn`, 'Must not precede startedOn')
    }
    if (entry.isCurrent && entry.endedOn) {
      issue(issues, 'inconsistent', `${path}.isCurrent`, 'Current experience cannot have endedOn')
    }
    validateUnique(issues, entry.skillTags, `${path}.skillTags`)
  })
  validateIds(issues, ids, 'experience')

  ids.length = 0
  profile.portfolio.forEach((entry, index) => {
    const path = `portfolio[${index}]`
    requiredString(issues, entry.id, `${path}.id`)
    ids.push(entry.id)
    validateLocalized(issues, entry.title, `${path}.title`, true)
    validateLocalized(issues, entry.description, `${path}.description`)
    optionalDate(issues, entry.completedOn, `${path}.completedOn`)
    optionalUrl(issues, entry.url, `${path}.url`)
    validateUnique(issues, entry.skillTags, `${path}.skillTags`)
  })
  validateIds(issues, ids, 'portfolio')

  ids.length = 0
  profile.credentials.forEach((entry, index) => {
    const path = `credentials[${index}]`
    requiredString(issues, entry.id, `${path}.id`)
    ids.push(entry.id)
    validateLocalized(issues, entry.name, `${path}.name`, true)
    optionalDate(issues, entry.issuedOn, `${path}.issuedOn`)
    optionalDate(issues, entry.expiresOn, `${path}.expiresOn`)
    if (entry.issuedOn && entry.expiresOn && entry.issuedOn > entry.expiresOn) {
      issue(issues, 'inconsistent', `${path}.expiresOn`, 'Must not precede issuedOn')
    }
    optionalUrl(issues, entry.verificationUrl, `${path}.verificationUrl`)
  })
  validateIds(issues, ids, 'credentials')

  optionalDate(issues, profile.availability.availableFrom, 'availability.availableFrom')
  if (profile.availability.hoursPerWeek !== undefined &&
      (profile.availability.hoursPerWeek < 0 || profile.availability.hoursPerWeek > 168)) {
    issue(issues, 'out_of_range', 'availability.hoursPerWeek', 'Must be between 0 and 168')
  }
  profile.availability.locations.forEach((entry, index) => {
    validateLocation(issues, entry, `availability.locations[${index}]`)
  })
  validateUnique(issues, profile.availability.engagementModes, 'availability.engagementModes')

  if (profile.contact.email !== undefined && !EMAIL.test(profile.contact.email)) {
    issue(issues, 'invalid_format', 'contact.email', 'Must be a valid email address')
  }
  optionalUrl(issues, profile.contact.website, 'contact.website')
  optionalUrl(issues, profile.contact.linkedin, 'contact.linkedin')
  if (profile.socialLinks) {
    for (const [platform, url] of Object.entries(profile.socialLinks)) {
      optionalUrl(issues, url, `socialLinks.${platform}`)
    }
  }

  const preferences = profile.matchingPreferences
  validateUnique(issues, preferences.serviceCategories, 'matchingPreferences.serviceCategories')
  validateUnique(issues, preferences.skillTags, 'matchingPreferences.skillTags')
  validateUnique(issues, preferences.sectors, 'matchingPreferences.sectors')
  validateUnique(issues, preferences.engagementModes, 'matchingPreferences.engagementModes')
  preferences.preferredLocations.forEach((entry, index) => {
    validateLocation(issues, entry, `matchingPreferences.preferredLocations[${index}]`)
  })
  if (preferences.minimumBudgetSar !== undefined && preferences.minimumBudgetSar < 0) {
    issue(issues, 'out_of_range', 'matchingPreferences.minimumBudgetSar', 'Must not be negative')
  }
  if (preferences.maximumBudgetSar !== undefined && preferences.maximumBudgetSar < 0) {
    issue(issues, 'out_of_range', 'matchingPreferences.maximumBudgetSar', 'Must not be negative')
  }
  if (preferences.minimumBudgetSar !== undefined && preferences.maximumBudgetSar !== undefined &&
      preferences.minimumBudgetSar > preferences.maximumBudgetSar) {
    issue(
      issues,
      'inconsistent',
      'matchingPreferences.maximumBudgetSar',
      'Must be greater than or equal to minimumBudgetSar',
    )
  }

  if (profile.kind === 'individual') {
    requiredString(issues, profile.individual.fullName, 'individual.fullName')
    if (profile.individual.yearsOfExperience !== undefined &&
        (profile.individual.yearsOfExperience < 0 || profile.individual.yearsOfExperience > 100)) {
      issue(issues, 'out_of_range', 'individual.yearsOfExperience', 'Must be between 0 and 100')
    }
    validateUnique(issues, profile.individual.languages, 'individual.languages')
  } else {
    requiredString(issues, profile.company.legalName, 'company.legalName')
    optionalDate(
      issues,
      profile.company.commercialRegistrationExpiresOn,
      'company.commercialRegistrationExpiresOn',
    )
    if (profile.company.foundedYear !== undefined &&
        (!Number.isInteger(profile.company.foundedYear) ||
         profile.company.foundedYear < 1800 ||
         profile.company.foundedYear > 9999)) {
      issue(issues, 'out_of_range', 'company.foundedYear', 'Must be an integer between 1800 and 9999')
    }
    validateUnique(issues, profile.company.sectors, 'company.sectors')
  }

  return { valid: issues.length === 0, issues }
}

function validateIds(
  issues: ProfileValidationIssue[],
  values: readonly string[],
  section: string,
): void {
  const seen = new Set<string>()
  values.forEach((value, index) => {
    if (seen.has(value)) issue(issues, 'duplicate', `${section}[${index}].id`, 'Duplicate id in section')
    seen.add(value)
  })
}

export function assertValidProfile(profile: CanonicalProfile): CanonicalProfile {
  const result = validateProfile(profile)
  if (!result.valid) {
    const detail = result.issues.map((entry) => `${entry.path}: ${entry.message}`).join('; ')
    throw new TypeError(`Invalid canonical profile: ${detail}`)
  }
  return profile
}
