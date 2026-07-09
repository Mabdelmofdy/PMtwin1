import { PROFILE_REASON_CODES, type ProfileReasonCode } from '../reason-codes/profile.ts'

/** Human labels from profile-readiness-rules.ts → canonical PROFILE_* reason codes. */
export const PROFILE_FIELD_LABEL_TO_REASON_CODE: Readonly<
  Record<string, ProfileReasonCode>
> = {
  'Full Name': PROFILE_REASON_CODES.MISSING_FULL_NAME,
  Role: PROFILE_REASON_CODES.MISSING_ROLE,
  Skills: PROFILE_REASON_CODES.MISSING_SKILLS,
  Services: PROFILE_REASON_CODES.MISSING_SERVICES,
  Location: PROFILE_REASON_CODES.MISSING_LOCATION,
  Availability: PROFILE_REASON_CODES.MISSING_AVAILABILITY,
  Portfolio: PROFILE_REASON_CODES.MISSING_PORTFOLIO,
  Experience: PROFILE_REASON_CODES.MISSING_EXPERIENCE,
  Certifications: PROFILE_REASON_CODES.MISSING_CERTIFICATIONS,
  'Previous Projects': PROFILE_REASON_CODES.MISSING_PREVIOUS_PROJECTS,
  'Company Name': PROFILE_REASON_CODES.MISSING_COMPANY_NAME,
  'Business Category': PROFILE_REASON_CODES.MISSING_BUSINESS_CATEGORY,
  'Project Categories': PROFILE_REASON_CODES.MISSING_PROJECT_CATEGORIES,
  'Contact Person': PROFILE_REASON_CODES.MISSING_CONTACT_PERSON,
  'Team Size': PROFILE_REASON_CODES.MISSING_TEAM_SIZE,
  'Coverage Areas': PROFILE_REASON_CODES.MISSING_COVERAGE_AREAS,
  'Financial Capacity': PROFILE_REASON_CODES.MISSING_FINANCIAL_CAPACITY,
}

const PROFILE_FIELD_HREF_SLUG: Readonly<Record<string, string>> = {
  'Full Name': 'fullName',
  Role: 'role',
  Skills: 'skills',
  Services: 'services',
  Location: 'location',
  Availability: 'availability',
  Portfolio: 'portfolio',
  Experience: 'experience',
  Certifications: 'certifications',
  'Previous Projects': 'previousProjects',
  'Company Name': 'companyName',
  'Business Category': 'businessCategory',
  'Project Categories': 'projectCategories',
  'Contact Person': 'contactPerson',
  'Team Size': 'teamSize',
  'Coverage Areas': 'coverageAreas',
  'Financial Capacity': 'financialCapacity',
}

function toParameterizedCode(label: string): ProfileReasonCode {
  const slug = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return `PROFILE_MISSING_${slug}` as ProfileReasonCode
}

export function profileFieldLabelToReasonCode(label: string): ProfileReasonCode {
  return PROFILE_FIELD_LABEL_TO_REASON_CODE[label] ?? toParameterizedCode(label)
}

export function profileFieldLabelToHref(label: string): string {
  const slug = PROFILE_FIELD_HREF_SLUG[label] ?? label.toLowerCase().replace(/\s+/g, '-')
  return `/profile/edit#${slug}`
}
