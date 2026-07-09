import type { PmFormStepperStep } from '@/components/forms/pm-form-index'

/** Enterprise Opportunity Creation — 7 draft-first steps (no Publish). */
export const WIZARD_STEPS: readonly PmFormStepperStep[] = [
  { id: 'type', label: 'Need or Offer', description: 'Post type' },
  { id: 'basic', label: 'Basic Details', description: 'Title and category' },
  { id: 'collaboration', label: 'Collaboration Model', description: 'Model and exchange' },
  { id: 'attributes', label: 'Work Packages / Attributes', description: 'Skills, packages, resources' },
  { id: 'commercial', label: 'Commercial Terms', description: 'Value and constraints' },
  { id: 'timeline', label: 'Timeline & Location', description: 'Dates and place' },
  { id: 'review', label: 'Review Draft', description: 'Save draft' },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

/** Field / readiness reason → wizard step for action links. */
export const FIELD_TO_WIZARD_STEP: Readonly<Record<string, WizardStepId>> = {
  intent: 'type',
  title: 'basic',
  descriptionScope: 'basic',
  categoryProfession: 'basic',
  roleIntent: 'basic',
  preferredPartnerType: 'basic',
  attachments: 'basic',
  collaborationModel: 'collaboration',
  skillsIntent: 'attributes',
  servicesIntent: 'attributes',
  location: 'timeline',
  timeline: 'timeline',
  budgetValueTerms: 'commercial',
  compliance: 'basic',
  deliveryMilestones: 'attributes',
}

export function resolveWizardStepIndex(stepId: string): number {
  return WIZARD_STEPS.findIndex((step) => step.id === stepId)
}

export function wizardStepHref(
  opportunityId: string | undefined,
  stepId: WizardStepId,
  hash?: string,
): string {
  const base = opportunityId
    ? `/opportunities/${opportunityId}/edit`
    : '/opportunities/create'
  const qs = `?step=${stepId}`
  return `${base}${qs}${hash ? `#${hash}` : ''}`
}
