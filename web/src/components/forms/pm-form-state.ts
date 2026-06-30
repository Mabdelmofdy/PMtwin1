/**
 * PM Form state helpers — loading, disabled, wizard step state.
 */

export type PmFormMode = 'edit' | 'readonly' | 'disabled'

export type PmFormStateFlags = {
  readonly loading?: boolean
  readonly disabled?: boolean
  readonly readOnly?: boolean
}

/** Resolves effective form mode from flags. */
export function resolveFormMode(flags: PmFormStateFlags = {}): PmFormMode {
  if (flags.readOnly) return 'readonly'
  if (flags.disabled) return 'disabled'
  return 'edit'
}

/** Whether form inputs should be non-interactive. */
export function isFormInteractive(flags: PmFormStateFlags = {}): boolean {
  return !flags.loading && !flags.disabled && !flags.readOnly
}

/** Whether submit actions should show loading state. */
export function isFormSubmitting(flags: PmFormStateFlags = {}): boolean {
  return Boolean(flags.loading)
}

// --- Wizard stepper ---

export type PmWizardStepStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'error'
  | 'optional'

export type PmWizardStepMeta = {
  readonly id: string
  readonly label: string
  readonly optional?: boolean
}

export type PmWizardStepStateInput = {
  readonly stepId: string
  readonly activeStepId: string
  readonly completedStepIds?: readonly string[]
  readonly errorStepIds?: readonly string[]
  readonly step: PmWizardStepMeta
}

/** Resolves visual status for a single wizard step. */
export function resolveWizardStepStatus(
  input: PmWizardStepStateInput,
): PmWizardStepStatus {
  const { stepId, activeStepId, completedStepIds = [], errorStepIds = [], step } =
    input

  if (errorStepIds.includes(stepId)) return 'error'
  if (stepId === activeStepId) return 'active'
  if (completedStepIds.includes(stepId)) return 'completed'
  if (step.optional) return 'optional'
  return 'upcoming'
}

/** Progress percentage (0–100) from completed steps. */
export function resolveWizardProgress(
  steps: readonly PmWizardStepMeta[],
  completedStepIds: readonly string[],
): number {
  if (steps.length === 0) return 0
  const requiredSteps = steps.filter((s) => !s.optional)
  const denominator = requiredSteps.length > 0 ? requiredSteps.length : steps.length
  const completedRequired = requiredSteps.filter((s) =>
    completedStepIds.includes(s.id),
  ).length
  return Math.round((completedRequired / denominator) * 100)
}

/** Index of active step (0-based), -1 if not found. */
export function resolveActiveStepIndex(
  steps: readonly PmWizardStepMeta[],
  activeStepId: string,
): number {
  return steps.findIndex((s) => s.id === activeStepId)
}

/** Whether a step is navigable (completed or active). */
export function isWizardStepNavigable(
  stepId: string,
  activeStepId: string,
  completedStepIds: readonly string[],
): boolean {
  return stepId === activeStepId || completedStepIds.includes(stepId)
}
