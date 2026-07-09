import type { ComponentProps, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { pmResponsive } from '@/tokens'
import {
  resolveWizardProgress,
  resolveWizardStepStatus,
  type PmWizardStepMeta,
} from '@/components/forms/pm-form-state'

const pmMotionSafe = 'motion-safe:transition-colors'

export type PmFormStepperStep = PmWizardStepMeta & {
  description?: string
}

export type PmFormStepperProps = ComponentProps<'nav'> & {
  steps: readonly PmFormStepperStep[]
  activeStepId: string
  completedStepIds?: readonly string[]
  errorStepIds?: readonly string[]
  onStepClick?: (stepId: string) => void
  showProgress?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const stepStatusStyles: Record<string, string> = {
  upcoming: 'border-border text-muted-foreground bg-surface',
  active: 'border-primary bg-primary text-primary-foreground',
  completed: 'border-success bg-success/10 text-success',
  error: 'border-danger bg-danger/10 text-danger',
  optional: 'border-border text-muted-foreground bg-surface-muted',
}

/** Wizard step indicator — active, completed, error, optional states. */
export function PmFormStepper({
  steps,
  activeStepId,
  completedStepIds = [],
  errorStepIds = [],
  onStepClick,
  showProgress = true,
  orientation = 'horizontal',
  className,
  ...props
}: PmFormStepperProps) {
  const progress = resolveWizardProgress(steps, completedStepIds)

  return (
    <nav
      data-slot="pm-form-stepper"
      aria-label="Form steps"
      className={cn('space-y-4', className)}
      {...props}
    >
      {showProgress ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Progress
            </span>
            <span className={cn(pmTypography.caption, 'tabular-nums text-muted-foreground')}>
              {progress}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <ol
        className={cn(
          'flex gap-2',
          orientation === 'horizontal'
            ? cn('flex-row flex-wrap sm:flex-nowrap', pmResponsive.scrollX)
            : 'flex-col',
        )}
      >
        {steps.map((step, index) => {
          const status = resolveWizardStepStatus({
            stepId: step.id,
            activeStepId,
            completedStepIds,
            errorStepIds,
            step,
          })
          const navigable =
            onStepClick &&
            (status === 'completed' || status === 'active' || status === 'error')

          return (
            <li key={step.id} className="min-w-0 flex-1 sm:flex-initial">
              <button
                type="button"
                disabled={!navigable}
                onClick={() => navigable && onStepClick(step.id)}
                aria-current={status === 'active' ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start transition-colors',
                  pmMotionSafe,
                  navigable && 'cursor-pointer hover:border-border-strong',
                  !navigable && 'cursor-default',
                  status === 'active' && 'ring-2 ring-primary/20',
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                    stepStatusStyles[status],
                  )}
                  aria-hidden
                >
                  {status === 'completed' ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span className={cn(pmTypography.label, 'block truncate')}>
                    {step.label}
                    {step.optional ? (
                      <span className="ms-1 font-normal text-muted-foreground">
                        (optional)
                      </span>
                    ) : null}
                  </span>
                  {step.description ? (
                    <span
                      className={cn(
                        pmTypography.caption,
                        'block truncate text-muted-foreground',
                      )}
                    >
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type PmFormStepperSlotProps = {
  children?: ReactNode
  className?: string
}

/** Custom stepper slot. */
export function PmFormStepperSlot({ children, className }: PmFormStepperSlotProps) {
  return (
    <div data-slot="pm-form-stepper-slot" className={className}>
      {children}
    </div>
  )
}
