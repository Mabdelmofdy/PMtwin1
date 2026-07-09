import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import type {
  PmWorkflowJourneyStep,
  PmWorkflowJourneyStepState,
} from '@/components/ui/pm-workflow-journey'

export type PmLifecycleMapStep = PmWorkflowJourneyStep

export type PmLifecycleMapProps = {
  steps: readonly PmLifecycleMapStep[]
  className?: string
  'aria-label'?: string
  /** Section overline — pass `false` to hide. */
  label?: string | false
  /** Render without surrounding surface (for embedding in cards). */
  bare?: boolean
}

function stepCircleClass(state: PmWorkflowJourneyStepState): string {
  if (state === 'complete') {
    return 'border-success/40 bg-success/12 text-success'
  }
  if (state === 'current') {
    return 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/15'
  }
  return 'border-border bg-surface text-muted-foreground'
}

/**
 * Canonical lifecycle map — Opportunity → PostMatch → Negotiation → Deal → Contract.
 * Numbered milestone stepper with connectors; a single lifecycle affordance per page.
 */
export function PmLifecycleMap({
  steps,
  className,
  'aria-label': ariaLabel = 'Collaboration lifecycle',
  label = 'Lifecycle',
  bare = false,
}: PmLifecycleMapProps) {
  if (steps.length === 0) return null

  const currentIndex = steps.findIndex((step) => step.state === 'current')
  const progressLabel =
    currentIndex >= 0
      ? `Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex]?.label}`
      : undefined

  const body = (
    <>
      {label !== false ? (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className={cn(pmTypography.overline, 'text-muted-foreground')}>{label}</p>
          {progressLabel ? (
            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
              {progressLabel}
            </p>
          ) : null}
        </div>
      ) : null}
      <ol
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0"
        aria-label={ariaLabel}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const circle = (
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                stepCircleClass(step.state),
              )}
              aria-hidden
            >
              {step.state === 'complete' ? <Check className="size-3.5" /> : index + 1}
            </span>
          )

          const textBlock = (
            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className={cn(
                  pmTypography.bodySm,
                  'truncate',
                  step.state === 'current' && 'font-semibold text-primary',
                  step.state === 'complete' && 'text-foreground',
                  step.state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
              {step.status ? (
                <PmWorkflowBadge
                  status={step.status}
                  entity={step.statusEntity}
                  size="sm"
                  className="max-w-[9rem] self-start truncate"
                />
              ) : null}
            </span>
          )

          const stepInner = (
            <span className="flex min-w-0 items-center gap-2.5 sm:flex-col sm:items-center sm:gap-1.5 sm:text-center">
              {circle}
              {textBlock}
            </span>
          )

          return (
            <li
              key={step.id}
              className={cn(
                'flex min-w-0 items-start',
                !isLast && 'sm:flex-1',
              )}
              aria-current={step.state === 'current' ? 'step' : undefined}
            >
              {step.href ? (
                <Link
                  to={step.href}
                  className="min-w-0 rounded-lg outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {stepInner}
                </Link>
              ) : (
                stepInner
              )}
              {!isLast ? (
                <span
                  className={cn(
                    'mx-2 mt-3.5 hidden h-px min-w-4 flex-1 sm:block',
                    step.state === 'complete' ? 'bg-success/40' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </>
  )

  if (bare) {
    return (
      <div data-slot="pm-lifecycle-map" className={className}>
        {body}
      </div>
    )
  }

  return (
    <PmSurface
      data-slot="pm-lifecycle-map"
      variant="muted"
      className={cn('px-4 py-3.5', className)}
    >
      {body}
    </PmSurface>
  )
}
