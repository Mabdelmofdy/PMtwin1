import {
  READINESS_REASON_CODES,
  type ReadinessReasonCode,
} from '../reason-codes/readiness.ts'

/** Core opportunity field IDs from opportunity-core-readiness.ts → canonical READINESS_* codes. */
export const OPPORTUNITY_FIELD_ID_TO_REASON_CODE: Readonly<
  Record<string, ReadinessReasonCode>
> = {
  title: READINESS_REASON_CODES.MISSING_TITLE,
  intent: READINESS_REASON_CODES.MISSING_INTENT,
  categoryProfession: READINESS_REASON_CODES.MISSING_CATEGORY_PROFESSION,
  roleIntent: READINESS_REASON_CODES.MISSING_ROLE_INTENT,
  skillsIntent: READINESS_REASON_CODES.MISSING_SKILLS_INTENT,
  servicesIntent: READINESS_REASON_CODES.MISSING_SERVICES_INTENT,
  location: READINESS_REASON_CODES.MISSING_LOCATION,
  timeline: READINESS_REASON_CODES.MISSING_TIMELINE,
  collaborationModel: READINESS_REASON_CODES.MISSING_COLLABORATION_MODEL,
  descriptionScope: READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE,
  budgetValueTerms: READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS,
  preferredPartnerType: READINESS_REASON_CODES.MISSING_PREFERRED_PARTNER_TYPE,
  attachments: READINESS_REASON_CODES.MISSING_ATTACHMENTS,
  compliance: READINESS_REASON_CODES.MISSING_COMPLIANCE,
  deliveryMilestones: READINESS_REASON_CODES.MISSING_DELIVERY_MILESTONES,
}

const OPPORTUNITY_FIELD_HREF_SLUG: Readonly<Record<string, string>> = {
  title: 'title',
  intent: 'intent',
  categoryProfession: 'category-profession',
  roleIntent: 'role-intent',
  skillsIntent: 'skills-intent',
  servicesIntent: 'services-intent',
  location: 'location',
  timeline: 'timeline',
  collaborationModel: 'collaboration-model',
  descriptionScope: 'description-scope',
  budgetValueTerms: 'budget-value-terms',
  preferredPartnerType: 'preferred-partner-type',
  attachments: 'attachments',
  compliance: 'compliance',
  deliveryMilestones: 'delivery-milestones',
}

const READINESS_CODE_ALIASES: Readonly<Record<string, ReadinessReasonCode>> = {
  READINESS_MISSING_BUDGET_VALUE_TERMS: READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS,
  READINESS_MISSING_DESCRIPTION_SCOPE: READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE,
  READINESS_MISSING_SCOPE: READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE,
}

function fieldIdToParameterizedCode(fieldId: string): ReadinessReasonCode {
  const snake = fieldId
    .replace(/([A-Z])/g, '_$1')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase()
    .replace(/^_/, '')

  return `READINESS_MISSING_${snake}` as ReadinessReasonCode
}

export function opportunityFieldIdToReasonCode(fieldId: string): ReadinessReasonCode {
  return OPPORTUNITY_FIELD_ID_TO_REASON_CODE[fieldId] ?? fieldIdToParameterizedCode(fieldId)
}

const READINESS_REASON_CODE_VALUES = new Set<string>(
  Object.values(READINESS_REASON_CODES),
)

export function isReadinessReasonCode(code: string): code is ReadinessReasonCode {
  return READINESS_REASON_CODE_VALUES.has(code)
}

export function opportunityReasonCodeToCanonical(
  code: string,
  fieldId?: string,
): ReadinessReasonCode {
  if (code in READINESS_CODE_ALIASES) {
    return READINESS_CODE_ALIASES[code]
  }

  if (isReadinessReasonCode(code)) {
    return code
  }

  if (code.startsWith('READINESS_MISSING_') && fieldId) {
    return opportunityFieldIdToReasonCode(fieldId)
  }

  if (code.startsWith('READINESS_')) {
    return code as ReadinessReasonCode
  }

  if (fieldId) {
    return opportunityFieldIdToReasonCode(fieldId)
  }

  return code as ReadinessReasonCode
}

export function opportunityFieldIdToHref(
  fieldId: string,
  subModelKey?: string,
): string {
  const slug =
    OPPORTUNITY_FIELD_HREF_SLUG[fieldId] ??
    fieldId.replace(/([A-Z])/g, '-$1').toLowerCase()
  const base = subModelKey
    ? `/opportunity/edit/${subModelKey}`
    : '/opportunity/edit'
  return `${base}#${slug}`
}
