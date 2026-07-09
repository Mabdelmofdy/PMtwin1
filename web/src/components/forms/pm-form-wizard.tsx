import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayoutGrid } from '@/components/shared/pm-layout-tokens'
import { PmForm } from '@/components/forms/pm-form'
import { PmFormStepper, type PmFormStepperProps } from '@/components/forms/pm-form-stepper'

export type PmFormWizardProps = {
  stepper: PmFormStepperProps
  children: ReactNode
  /** Right-side helper / readiness rail */
  rail?: ReactNode
  footer?: ReactNode
  className?: string
  loading?: boolean
  disabled?: boolean
}

/**
 * Wizard form scaffold — stepper, step body, optional rail, sticky footer.
 * Opportunity wizard migration target (Phase 6+).
 */
export function PmFormWizard({
  stepper,
  children,
  rail,
  footer,
  className,
  loading = false,
  disabled = false,
}: PmFormWizardProps) {
  return (
    <div
      data-slot="pm-form-wizard"
      className={cn(pmLayoutGrid.pageStack, className)}
    >
      <PmFormStepper {...stepper} />

      <PmForm
        loading={loading}
        disabled={disabled}
        className="gap-6"
        onSubmit={(event) => {
          // Wizard navigation must never trigger a native GET submit
          // (that reloads to `?` and resets draft state).
          event.preventDefault()
        }}
      >
        {rail ? (
          <div className={pmLayoutGrid.wizard}>
            <div className={pmLayoutGrid.wizardMain}>{children}</div>
            <aside
              data-slot="pm-form-wizard-rail"
              className={cn(pmLayoutGrid.wizardAside, 'lg:sticky lg:top-20 lg:self-start')}
            >
              {rail}
            </aside>
          </div>
        ) : (
          children
        )}
        {footer}
      </PmForm>
    </div>
  )
}

export type PmFormWizardStepProps = {
  stepId: string
  activeStepId: string
  children: ReactNode
}

/** Conditionally renders wizard step content when active. */
export function PmFormWizardStep({
  stepId,
  activeStepId,
  children,
}: PmFormWizardStepProps) {
  if (stepId !== activeStepId) return null
  return (
    <div data-slot="pm-form-wizard-step" data-step-id={stepId}>
      {children}
    </div>
  )
}

export type PmFormWizardFooterProps = {
  children?: ReactNode
  className?: string
}

/** Wizard footer slot wrapper. */
export function PmFormWizardFooter({ children, className }: PmFormWizardFooterProps) {
  return (
    <div data-slot="pm-form-wizard-footer" className={className}>
      {children}
    </div>
  )
}
