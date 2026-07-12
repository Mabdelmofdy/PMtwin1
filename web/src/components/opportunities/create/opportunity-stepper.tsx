import { PmFormStepper } from '@/components/forms/pm-form-index'
import { WIZARD_STEPS, type WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import { pmWizardSticky } from '@/tokens/layers/layout.ts'
import { cn } from '@/lib/utils'

export type OpportunityStepperProps = {
  activeStepId: WizardStepId
  completedStepIds?: readonly string[]
  errorStepIds?: readonly string[]
  warningStepIds?: readonly string[]
  onStepClick?: (stepId: WizardStepId) => void
}

export function OpportunityStepper({
  activeStepId,
  completedStepIds = [],
  errorStepIds = [],
  onStepClick,
}: OpportunityStepperProps) {
  return (
    <div
      data-slot="opportunity-stepper"
      className={cn(pmWizardSticky.stepper, '-mx-[var(--pm-space-page-x)] px-[var(--pm-space-page-x)] py-3')}
    >
      <PmFormStepper
        steps={WIZARD_STEPS}
        activeStepId={activeStepId}
        completedStepIds={completedStepIds}
        errorStepIds={errorStepIds}
        showProgress={false}
        onStepClick={
          onStepClick
            ? (id) => onStepClick(id as WizardStepId)
            : undefined
        }
      />
    </div>
  )
}
