import type { PmFormStepperStep } from '@/components/forms/pm-form-index'

/** Opportunity Creation Experience 3.0 — five draft steps; publish is an action on Review. */
export const WIZARD_STEPS: readonly PmFormStepperStep[] = [
  { id: 'opportunity', label: 'Opportunity', description: 'Post type and basics' },
  { id: 'collaboration', label: 'Collaboration', description: 'Model and sub-model' },
  { id: 'scope_work', label: 'Scope & Work', description: 'Requirements and packages' },
  { id: 'commercial', label: 'Commercial Structure', description: 'Value exchange' },
  { id: 'review', label: 'Review & Publish', description: 'Confirm and publish' },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

/** Field / readiness reason → wizard step for action links. */
export const FIELD_TO_WIZARD_STEP: Readonly<Record<string, WizardStepId>> = {
  intent: 'opportunity',
  title: 'opportunity',
  descriptionScope: 'opportunity',
  categoryProfession: 'opportunity',
  roleIntent: 'opportunity',
  preferredPartnerType: 'opportunity',
  attachments: 'scope_work',
  collaborationModel: 'collaboration',
  skillsIntent: 'scope_work',
  servicesIntent: 'scope_work',
  location: 'opportunity',
  timeline: 'scope_work',
  budgetValueTerms: 'commercial',
  compliance: 'scope_work',
  deliveryMilestones: 'scope_work',
}

/** Legacy step IDs from OCX v1/v2 local drafts → v3 step IDs. */
export const LEGACY_STEP_ID_MAP: Readonly<Record<string, WizardStepId>> = {
  type: 'opportunity',
  basic: 'opportunity',
  collaboration: 'collaboration',
  attributes: 'scope_work',
  commercial: 'commercial',
  timeline: 'scope_work',
  review: 'review',
  opportunity: 'opportunity',
  scope_work: 'scope_work',
}

export function resolveWizardStepIndex(stepId: string): number {
  return WIZARD_STEPS.findIndex((step) => step.id === stepId)
}

export function normalizeWizardStepId(stepId: string | null | undefined): WizardStepId {
  if (!stepId) return 'opportunity'
  const mapped = LEGACY_STEP_ID_MAP[stepId] ?? (stepId as WizardStepId)
  return WIZARD_STEPS.some((s) => s.id === mapped) ? mapped : 'opportunity'
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
