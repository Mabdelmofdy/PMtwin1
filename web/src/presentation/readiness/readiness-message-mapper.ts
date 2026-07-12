/**
 * Map technical readiness reason codes to customer-facing messages.
 * Never expose READINESS_* or VAL_* codes in the UI.
 */

import { READINESS_REASON_CODES } from '@pm-twin/explainability'
import { FIELD_TO_WIZARD_STEP } from '@/components/opportunity/wizard/wizard-steps.ts'
import type { ReadinessUserMessage } from './readiness-presentation-types.ts'

const MESSAGES: Readonly<
  Record<string, Omit<ReadinessUserMessage, 'severity'>>
> = {
  [READINESS_REASON_CODES.MISSING_TITLE]: {
    title: 'Add a title',
    description: 'Give your opportunity a clear, searchable title.',
    stepId: 'opportunity',
    sectionId: 'basic-info',
    fieldId: 'title',
  },
  [READINESS_REASON_CODES.MISSING_INTENT]: {
    title: 'Choose Need or Offer',
    description: 'Select whether you are requesting or providing capacity.',
    stepId: 'opportunity',
    sectionId: 'post-type',
    fieldId: 'intent',
  },
  [READINESS_REASON_CODES.MISSING_CATEGORY_PROFESSION]: {
    title: 'Choose a category or profession',
    description: 'Add a sector or category so partners can discover this opportunity.',
    stepId: 'opportunity',
    sectionId: 'basic-info',
    fieldId: 'sector',
  },
  [READINESS_REASON_CODES.MISSING_ROLE_INTENT]: {
    title: 'Select the role you need or can provide',
    description: 'Specify the partner role for this engagement.',
    stepId: 'opportunity',
    sectionId: 'basic-info',
    fieldId: 'targetRole',
  },
  [READINESS_REASON_CODES.MISSING_SKILLS_INTENT]: {
    title: 'Add at least one required or offered skill',
    description: 'Skills improve matching quality and readiness.',
    stepId: 'scope_work',
    sectionId: 'requirements',
    fieldId: 'structuredSkills',
  },
  [READINESS_REASON_CODES.MISSING_SERVICES_INTENT]: {
    title: 'Add required or offered services',
    description: 'Describe the services involved in this opportunity.',
    stepId: 'scope_work',
    sectionId: 'requirements',
    fieldId: 'services',
  },
  [READINESS_REASON_CODES.MISSING_LOCATION]: {
    title: 'Add a location or service area',
    description: 'Partners need to know where the work applies.',
    stepId: 'opportunity',
    sectionId: 'basic-info',
    fieldId: 'location',
  },
  [READINESS_REASON_CODES.MISSING_TIMELINE]: {
    title: 'Add a start date or availability period',
    description: 'Include when work starts or when capacity is available.',
    stepId: 'opportunity',
    sectionId: 'basic-info',
    fieldId: 'startDate',
  },
  [READINESS_REASON_CODES.MISSING_COLLABORATION_MODEL]: {
    title: 'Select a collaboration model',
    description: 'Choose a main model and sub-model for this engagement.',
    stepId: 'collaboration',
    sectionId: 'main-model',
    fieldId: 'mainCollaborationModel',
  },
  [READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE]: {
    title: 'Add a short description',
    description: 'Describe the scope so partners can evaluate fit.',
    stepId: 'opportunity',
    sectionId: 'basic-info',
    fieldId: 'description',
  },
  [READINESS_REASON_CODES.MISSING_BUDGET]: {
    title: 'Add commercial terms',
    description: 'Configure at least one value exchange component.',
    stepId: 'commercial',
    sectionId: 'exchange-components',
    fieldId: 'commercialStructure',
  },
  [READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS]: {
    title: 'Complete commercial structure details',
    description: 'Fill in value exchange fields for your selected components.',
    stepId: 'commercial',
    sectionId: 'exchange-components',
    fieldId: 'commercialStructure',
  },
  [READINESS_REASON_CODES.MISSING_PREFERRED_PARTNER_TYPE]: {
    title: 'Add a preferred partner type',
    description: 'Recommend who should respond (company, individual, consultant).',
    stepId: 'scope_work',
    sectionId: 'requirements',
    fieldId: 'preferredPartnerType',
    impactPercent: 4,
  },
  [READINESS_REASON_CODES.MISSING_ATTACHMENTS]: {
    title: 'Add portfolio references or documents',
    description: 'Attachments improve partner confidence.',
    stepId: 'scope_work',
    sectionId: 'documents-compliance',
    fieldId: 'attachmentsText',
    impactPercent: 4,
  },
  [READINESS_REASON_CODES.MISSING_COMPLIANCE]: {
    title: 'Add compliance requirements',
    description: 'List licenses, insurance, or regulatory needs when relevant.',
    stepId: 'scope_work',
    sectionId: 'documents-compliance',
    fieldId: 'complianceRequirementsText',
    impactPercent: 4,
  },
  [READINESS_REASON_CODES.MISSING_DELIVERY_MILESTONES]: {
    title: 'Add delivery milestones',
    description: 'Milestones clarify delivery planning and payment triggers.',
    stepId: 'scope_work',
    sectionId: 'milestones',
    fieldId: 'milestones',
    impactPercent: 6,
  },
}

const RECOMMENDED_CODES = new Set<string>([
  READINESS_REASON_CODES.MISSING_PREFERRED_PARTNER_TYPE,
  READINESS_REASON_CODES.MISSING_ATTACHMENTS,
  READINESS_REASON_CODES.MISSING_COMPLIANCE,
  READINESS_REASON_CODES.MISSING_DELIVERY_MILESTONES,
])

function humanizeCode(reasonCode: string): string {
  return reasonCode
    .replace(/^READINESS_/, '')
    .replace(/^VAL_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function mapReadinessReasonToUserMessage(
  reasonCode: string,
  options?: { required?: boolean },
): ReadinessUserMessage {
  const known = MESSAGES[reasonCode]
  if (known) {
    const severity: ReadinessUserMessage['severity'] =
      options?.required === false || RECOMMENDED_CODES.has(reasonCode)
        ? 'recommended'
        : 'required'
    return { ...known, severity }
  }

  // Never return the raw technical code as the title
  const fieldKey = reasonCode
    .replace(/^READINESS_MISSING_/, '')
    .replace(/^READINESS_/, '')
    .split('_')
    .map((part, i) =>
      i === 0 ? part.toLowerCase() : part.charAt(0) + part.slice(1).toLowerCase(),
    )
    .join('')
  const stepId =
    FIELD_TO_WIZARD_STEP[fieldKey]
    ?? FIELD_TO_WIZARD_STEP[
      reasonCode.replace(/^READINESS_MISSING_/, '').toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    ]
    ?? 'opportunity'

  return {
    title: humanizeCode(reasonCode),
    description: 'Complete this item to improve opportunity readiness.',
    stepId,
    severity: options?.required === false ? 'recommended' : 'required',
  }
}

/** Strip any accidental technical codes from display strings. */
export function sanitizeReadinessDisplayText(text: string): string {
  return text
    .replace(/\bREADINESS_[A-Z0-9_]+\b/g, '')
    .replace(/\bVAL_[A-Z0-9_]+\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
