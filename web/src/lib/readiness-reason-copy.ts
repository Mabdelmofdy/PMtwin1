import { READINESS_REASON_CODES } from '@pm-twin/explainability'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import { FIELD_TO_WIZARD_STEP } from '@/components/opportunity/wizard/wizard-steps.ts'
import { mapReadinessReasonToUserMessage } from '@/presentation/readiness'

export type ReadinessReasonCopy = {
  label: string
  why: string
  stepId: WizardStepId
  impactPercent?: number
}

export function getReadinessReasonCopy(
  reasonCode: string,
  fieldId?: string,
): ReadinessReasonCopy {
  const mapped = mapReadinessReasonToUserMessage(reasonCode)
  if (mapped.title && mapped.stepId) {
    return {
      label: mapped.title,
      why: mapped.description,
      stepId: mapped.stepId,
      impactPercent: mapped.impactPercent,
    }
  }
  const stepFromField =
    fieldId && FIELD_TO_WIZARD_STEP[fieldId]
      ? FIELD_TO_WIZARD_STEP[fieldId]
      : ('review' as WizardStepId)
  return {
    label: mapped.title || 'Missing information',
    why: mapped.description || 'Complete this item to improve opportunity readiness.',
    stepId: stepFromField,
  }
}

/** @deprecated Prefer mapReadinessReasonToUserMessage — kept for existing imports. */
export const READINESS_COPY_CODES = READINESS_REASON_CODES

export function isInternalReasonCodeVisibleText(text: string): boolean {
  return /READINESS_[A-Z0-9_]+/.test(text) || /\bVAL_[A-Z0-9_]+\b/.test(text)
}
