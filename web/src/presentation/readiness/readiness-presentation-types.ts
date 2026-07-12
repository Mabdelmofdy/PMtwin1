/** Readiness presentation types for Opportunity Creation 3.0. */

import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'

export type ReadinessUserMessage = {
  title: string
  description: string
  stepId: WizardStepId
  sectionId?: string
  fieldId?: string
  severity: 'required' | 'recommended' | 'completed'
  impactPercent?: number
}

export type ReadinessIssueGroup = {
  required: ReadinessUserMessage[]
  recommended: ReadinessUserMessage[]
  completed: ReadinessUserMessage[]
}

export type ReadinessActionTarget = {
  stepId: WizardStepId
  sectionId?: string
  fieldId?: string
  hash?: string
}
