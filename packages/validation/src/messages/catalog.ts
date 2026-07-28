import { VAL_CODES } from '../rules/codes.ts'

const MESSAGES: Readonly<Record<string, string>> = {
  [VAL_CODES.FIELD_TITLE_REQUIRED]: 'A title is required.',
  [VAL_CODES.FIELD_TITLE_TOO_LONG]: 'Title is too long.',
  [VAL_CODES.FIELD_DESCRIPTION_TOO_LONG]: 'Description is too long.',
  [VAL_CODES.FIELD_TARGET_ROLE_REQUIRED]:
    'Target role is required before publishing.',
  [VAL_CODES.FIELD_POSITIVE_NUMBER]: 'Value must be a positive number.',
  [VAL_CODES.FIELD_PERCENT_RANGE]: 'Percentage must be between 0 and 100.',
  [VAL_CODES.FIELD_ARRAY_EMPTY]: 'At least one item is required.',

  [VAL_CODES.DATE_START_IN_PAST]: 'Start date cannot be in the past.',
  [VAL_CODES.DATE_END_BEFORE_START]: 'End date cannot be before start date.',
  [VAL_CODES.DATE_DURATION_INVALID]: 'Duration must be greater than zero.',
  [VAL_CODES.DATE_DELIVERY_AFTER_END]:
    'Delivery deadline cannot be after the project end date.',
  [VAL_CODES.DATE_START_SOON]: 'Start date is within less than 48 hours.',
  [VAL_CODES.DATE_DEADLINE_IN_PAST]: 'Deadline cannot be in the past.',
  [VAL_CODES.DATE_AVAILABILITY_END_IN_PAST]:
    'Availability end date cannot be in the past.',
  [VAL_CODES.DATE_DEADLINE_BEFORE_START]:
    'Deadline cannot be before start date.',
  [VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START]:
    'Availability end date cannot be before start date.',

  [VAL_CODES.BUDGET_CASH_REQUIRED]: 'Budget is required for cash exchange.',
  [VAL_CODES.BUDGET_BELOW_MINIMUM]: 'Budget is below the configured minimum.',
  [VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED]:
    'Profit share percentage, revenue basis, and settlement cycle are required.',
  [VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED]:
    'Equity percentage, capital contribution, and governance rights are required.',
  [VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED]:
    'Each selected hybrid component needs complete data.',

  [VAL_CODES.SKILL_REQUIRED_MISSING]: 'Add at least one required skill.',
  [VAL_CODES.SKILL_PROVIDED_MISSING]: 'Add at least one provided skill.',
  [VAL_CODES.SKILL_DUPLICATE]: 'Duplicate skills are not allowed.',
  [VAL_CODES.SKILL_YEARS_NEGATIVE]: 'Years of experience cannot be negative.',
  [VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE]:
    'Experience level and years of experience are inconsistent.',

  [VAL_CODES.PACKAGE_TITLE_REQUIRED]: 'Every work package needs a title.',
  [VAL_CODES.PACKAGE_DESCRIPTION_REQUIRED]:
    'Every work package needs a description.',
  [VAL_CODES.PACKAGE_SKILL_REQUIRED]:
    'Every work package needs at least one skill.',
  [VAL_CODES.PACKAGE_DEADLINE_REQUIRED]: 'Every work package needs a deadline.',
  [VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT]:
    'Work package deadline cannot be after the project end date.',
  [VAL_CODES.PACKAGE_DUPLICATE_NAME]: 'Work package names must be unique.',
  [VAL_CODES.PACKAGE_COUNT_EXCEEDED]:
    'Too many work packages for the configured limit.',

  [VAL_CODES.COMMERCIAL_RETENTION_RANGE]:
    'Retention must be between 0% and the configured maximum.',
  [VAL_CODES.COMMERCIAL_PROFIT_SHARE_RANGE]:
    'Profit share must be within the configured range.',
  [VAL_CODES.COMMERCIAL_VAT_RANGE]: 'VAT must be within the configured range.',
  [VAL_CODES.COMMERCIAL_ADVANCE_EXCEEDS_BUDGET]:
    'Advance payment cannot exceed the budget.',
  [VAL_CODES.COMMERCIAL_MIN_MAX_CONTRACT]:
    'Minimum contract value cannot exceed maximum contract value.',

  [VAL_CODES.CAPACITY_REQUIRED_INVALID]:
    'Required capacity must be greater than zero for a need.',
  [VAL_CODES.CAPACITY_AVAILABLE_INVALID]:
    'Available capacity must be greater than zero for an offer.',
  [VAL_CODES.CAPACITY_NEGATIVE]: 'Capacity cannot be negative.',

  [VAL_CODES.DOC_CR_REQUIRED]:
    'A Commercial Registration (CR) document is required before publishing.',
  [VAL_CODES.DOC_INSURANCE_REQUIRED]:
    'An insurance document is required before publishing.',
  [VAL_CODES.DOC_PERFORMANCE_BOND_REQUIRED]:
    'A performance bond is required before publishing.',
  [VAL_CODES.DOC_EXPIRED]: 'A mandatory document has expired.',

  [VAL_CODES.LOCATION_INCONSISTENT]:
    'Location country and city are inconsistent.',
  [VAL_CODES.LOCATION_ONSITE_REQUIRED]:
    'On-site work requires a location.',

  [VAL_CODES.DUP_SIMILAR_DRAFT]:
    'A similar draft opportunity already exists.',

  [VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY]:
    'A need cannot include available capacity.',
  [VAL_CODES.INTENT_NEED_HAS_PRICING_TABLE]:
    'A need cannot include a pricing table.',
  [VAL_CODES.INTENT_OFFER_HAS_REQUIRED_CAPACITY]:
    'An offer cannot include required capacity.',
  [VAL_CODES.INTENT_OFFER_HAS_MANDATORY_DEADLINE]:
    'An offer cannot include a mandatory deadline.',
  [VAL_CODES.INTENT_OFFER_REQUIRED_BUDGET_NON_CASH]:
    'An offer cannot require budget when exchange mode is not cash.',

  [VAL_CODES.TAXONOMY_INVALID]:
    'Collaboration model selection is incomplete or inconsistent.',

  [VAL_CODES.PUBLISH_PROFILE_INCOMPLETE]:
    'Complete your profile before publishing.',
  [VAL_CODES.PUBLISH_VETTING_NOT_APPROVED]:
    'Vetting must be approved before publishing.',
  [VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD]:
    'Opportunity readiness must reach the publish threshold.',
  [VAL_CODES.PUBLISH_FIELD_ERRORS]:
    'Resolve field validation errors before publishing.',
  [VAL_CODES.PUBLISH_BUSINESS_ERRORS]:
    'Resolve business validation issues before publishing.',
}

export function messageForCode(
  code: string,
  fallback?: string,
): string {
  return MESSAGES[code] ?? fallback ?? 'Please review this field.'
}

/** Ensures UI strings never accidentally include internal codes. */
export function assertNoCodeInMessage(message: string, code: string): boolean {
  return !message.includes(code)
}
