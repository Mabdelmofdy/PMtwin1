import type { ProfileFieldRule, ProfileKind } from '@/domain/profile-readiness/types.ts'

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

function hasPresentNumber(value: unknown): boolean {
  if (value == null || value === '') return false
  const numeric = Number(value)
  return Number.isFinite(numeric)
}

function hasAnyString(profile: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.some((key) => hasNonEmptyString(profile[key]))
}

function hasAnyArray(profile: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.some((key) => hasNonEmptyArray(profile[key]))
}

function hasAvailability(profile: Record<string, unknown>): boolean {
  const availability = profile.availability
  if (hasNonEmptyString(availability)) return true
  if (availability !== null && typeof availability === 'object' && !Array.isArray(availability)) {
    const record = availability as Record<string, unknown>
    return hasNonEmptyString(record.start) || hasNonEmptyString(record.end) || hasNonEmptyString(record.status)
  }
  return hasAnyString(profile, ['preferredWorkMode', 'availabilityDate', 'availableFrom', 'availableTo'])
}

function hasContactPerson(profile: Record<string, unknown>): boolean {
  if (hasAnyString(profile, ['contactPerson', 'contactName', 'representativeName', 'primaryContact'])) {
    return true
  }
  const contact = profile.contactPerson
  if (contact !== null && typeof contact === 'object' && !Array.isArray(contact)) {
    const record = contact as Record<string, unknown>
    return hasNonEmptyString(record.name) || hasNonEmptyString(record.fullName)
  }
  return hasAnyString(profile, ['companyRole']) && hasAnyString(profile, ['phone', 'contactPhone', 'email'])
}

const INDIVIDUAL_REQUIRED_RULES: readonly ProfileFieldRule[] = [
  {
    label: 'Full Name',
    isPresent: (profile) => hasAnyString(profile, ['fullName', 'name']),
  },
  {
    label: 'Role',
    isPresent: (profile) => hasAnyString(profile, ['role', 'title', 'headline', 'type']),
  },
  {
    label: 'Skills',
    isPresent: (profile) => hasAnyArray(profile, ['skills', 'specializations', 'coreSkills']),
  },
  {
    label: 'Services',
    isPresent: (profile) => hasAnyArray(profile, ['services', 'offeredServices']),
  },
  {
    label: 'Location',
    isPresent: (profile) => hasAnyString(profile, ['location', 'locationCity', 'address', 'city']),
  },
  {
    label: 'Availability',
    isPresent: hasAvailability,
  },
]

const INDIVIDUAL_RECOMMENDED_RULES: readonly ProfileFieldRule[] = [
  {
    label: 'Portfolio',
    isPresent: (profile) => hasAnyArray(profile, ['portfolio', 'caseStudies']),
  },
  {
    label: 'Experience',
    isPresent: (profile) =>
      hasPresentNumber(profile.yearsExperience) ||
      hasNonEmptyString(profile.experience) ||
      hasAnyArray(profile, ['experienceEntries', 'workHistory']),
  },
  {
    label: 'Certifications',
    isPresent: (profile) => hasAnyArray(profile, ['certifications']),
  },
  {
    label: 'Previous Projects',
    isPresent: (profile) =>
      hasAnyArray(profile, ['previousProjects', 'projects', 'caseStudies', 'portfolio']),
  },
]

const COMPANY_REQUIRED_RULES: readonly ProfileFieldRule[] = [
  {
    label: 'Company Name',
    isPresent: (profile) => hasAnyString(profile, ['companyName', 'name']),
  },
  {
    label: 'Business Category',
    isPresent: (profile) =>
      hasAnyString(profile, ['businessCategory', 'primaryDomain', 'companyType']) ||
      hasAnyArray(profile, ['sectors', 'industry', 'classifications']),
  },
  {
    label: 'Services',
    isPresent: (profile) => hasAnyArray(profile, ['services', 'offeredServices']),
  },
  {
    label: 'Project Categories',
    isPresent: (profile) =>
      hasAnyArray(profile, ['projectCategories', 'interests', 'sectors', 'classifications']),
  },
  {
    label: 'Location',
    isPresent: (profile) => hasAnyString(profile, ['location', 'address', 'locationCity', 'city']),
  },
  {
    label: 'Contact Person',
    isPresent: hasContactPerson,
  },
]

const COMPANY_RECOMMENDED_RULES: readonly ProfileFieldRule[] = [
  {
    label: 'Portfolio',
    isPresent: (profile) => hasAnyArray(profile, ['portfolio', 'caseStudies']),
  },
  {
    label: 'Team Size',
    isPresent: (profile) =>
      hasPresentNumber(profile.teamSize) ||
      hasNonEmptyString(profile.teamSize) ||
      hasNonEmptyString(profile.employeeCount),
  },
  {
    label: 'Coverage Areas',
    isPresent: (profile) => hasAnyArray(profile, ['coverageAreas', 'serviceAreas', 'operatingRegions']),
  },
  {
    label: 'Certifications',
    isPresent: (profile) => hasAnyArray(profile, ['certifications']),
  },
  {
    label: 'Financial Capacity',
    isPresent: (profile) => hasPresentNumber(profile.financialCapacity),
  },
]

export const PROFILE_READINESS_SCORE_WEIGHTS = {
  required: 70,
  recommended: 30,
} as const

export const PROFILE_READINESS_STATUS_THRESHOLDS = {
  incompleteMax: 60,
  readyMin: 80,
} as const

export function getProfileReadinessRules(profileKind: ProfileKind): {
  readonly required: readonly ProfileFieldRule[]
  readonly recommended: readonly ProfileFieldRule[]
} {
  if (profileKind === 'company') {
    return {
      required: COMPANY_REQUIRED_RULES,
      recommended: COMPANY_RECOMMENDED_RULES,
    }
  }
  return {
    required: INDIVIDUAL_REQUIRED_RULES,
    recommended: INDIVIDUAL_RECOMMENDED_RULES,
  }
}
