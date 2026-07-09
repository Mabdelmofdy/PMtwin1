import { READINESS_REASON_CODES } from '@pm-twin/explainability'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import { FIELD_TO_WIZARD_STEP } from '@/components/opportunity/wizard/wizard-steps.ts'

export type ReadinessReasonCopy = {
  label: string
  why: string
  stepId: WizardStepId
  impactPercent?: number
}

const COPY: Readonly<Record<string, ReadinessReasonCopy>> = {
  [READINESS_REASON_CODES.MISSING_TITLE]: {
    label: 'Missing title',
    why: 'Add a clear opportunity title so partners understand the engagement.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_INTENT]: {
    label: 'Missing Need or Offer',
    why: 'Choose whether you are posting a Need or an Offer.',
    stepId: 'type',
  },
  [READINESS_REASON_CODES.MISSING_CATEGORY_PROFESSION]: {
    label: 'Missing category or profession',
    why: 'Add a sector or category so the opportunity can be discovered.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_ROLE_INTENT]: {
    label: 'Missing target role',
    why: 'Specify the partner role you are looking for.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_SKILLS_INTENT]: {
    label: 'Missing required skills',
    why: 'Add at least one required skill or provided skill.',
    stepId: 'attributes',
  },
  [READINESS_REASON_CODES.MISSING_SERVICES_INTENT]: {
    label: 'Missing services',
    why: 'Add required or offered services for this opportunity.',
    stepId: 'attributes',
  },
  [READINESS_REASON_CODES.MISSING_LOCATION]: {
    label: 'Missing location',
    why: 'Add a location or service area.',
    stepId: 'timeline',
  },
  [READINESS_REASON_CODES.MISSING_TIMELINE]: {
    label: 'Missing timeline',
    why: 'Add start date, deadline, or availability.',
    stepId: 'timeline',
  },
  [READINESS_REASON_CODES.MISSING_COLLABORATION_MODEL]: {
    label: 'Missing collaboration model',
    why: 'Select a main model, sub-model, and value exchange mode.',
    stepId: 'collaboration',
  },
  [READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE]: {
    label: 'Missing description',
    why: 'Describe the scope so partners can evaluate fit.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_BUDGET]: {
    label: 'Missing budget',
    why: 'Add commercial terms for the selected exchange mode.',
    stepId: 'commercial',
  },
  [READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS]: {
    label: 'Missing commercial terms',
    why: 'Complete value exchange fields for your selected mode.',
    stepId: 'commercial',
  },
  [READINESS_REASON_CODES.MISSING_PREFERRED_PARTNER_TYPE]: {
    label: 'Missing preferred partner type',
    why: 'Recommend who should respond (company, individual, consultant).',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_ATTACHMENTS]: {
    label: 'Missing documents',
    why: 'Attach references or required documents when available.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_COMPLIANCE]: {
    label: 'Missing compliance requirements',
    why: 'List compliance or regulatory requirements if applicable.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.MISSING_DELIVERY_MILESTONES]: {
    label: 'Missing delivery milestones',
    why: 'Add milestones or work packages to clarify delivery.',
    stepId: 'attributes',
  },
  [READINESS_REASON_CODES.MISSING_SCOPE]: {
    label: 'Missing scope',
    why: 'Complete the opportunity description and scope.',
    stepId: 'basic',
  },
  [READINESS_REASON_CODES.PUBLISH_BLOCKED]: {
    label: 'Not ready to publish',
    why: 'Resolve required readiness items before publishing.',
    stepId: 'review',
  },
}

function humanizeCode(code: string): string {
  return code
    .replace(/^READINESS_MISSING_/, '')
    .replace(/^READINESS_/, '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getReadinessReasonCopy(
  reasonCode: string,
  fieldId?: string,
): ReadinessReasonCopy {
  if (COPY[reasonCode]) return COPY[reasonCode]
  const stepFromField =
    fieldId && FIELD_TO_WIZARD_STEP[fieldId]
      ? FIELD_TO_WIZARD_STEP[fieldId]
      : ('review' as WizardStepId)
  return {
    label: humanizeCode(reasonCode) || 'Missing information',
    why: 'Complete this item to improve opportunity readiness.',
    stepId: stepFromField,
  }
}

export function isInternalReasonCodeVisibleText(text: string): boolean {
  return /READINESS_[A-Z0-9_]+/.test(text)
}
