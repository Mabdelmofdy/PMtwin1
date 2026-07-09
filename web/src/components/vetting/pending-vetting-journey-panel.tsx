import { Link } from 'react-router-dom'
import { Ban, Check, Circle, Clock } from 'lucide-react'
import type { PendingJourneyStep } from '@/domain/pending-vetting-journey/types.ts'
import { buildVettingWorkflowSteps } from '@/components/ui/pm-workflow-journey-steps.ts'
import type { VettingActionQueue } from '@/components/vetting/resolve-vetting-action-queue.ts'
import { PmButton, PmWorkflowBadge } from '@/components/ui/pm-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmSurface } from '@/components/ui/pm-surface'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

function resolvePreviewStepId(steps: readonly PendingJourneyStep[]): string | undefined {
  const activeIndex = steps.findIndex(
    (step) => step.state === 'current' || step.state === 'blocked',
  )
  if (activeIndex < 0) return undefined
  const next = steps.slice(activeIndex + 1).find((step) => step.state === 'pending')
  return next?.id
}

function StepStateIcon({
  state,
  workflowState,
}: {
  readonly state: PendingJourneyStep['state']
  readonly workflowState: 'complete' | 'current' | 'upcoming'
}) {
  if (workflowState === 'complete' || state === 'completed') {
    return <Check className="size-4 shrink-0 text-success" aria-hidden />
  }
  if (state === 'blocked') {
    return <Ban className="size-4 shrink-0 text-danger" aria-hidden />
  }
  if (workflowState === 'current' || state === 'current') {
    return <Clock className="size-4 shrink-0 text-primary" aria-hidden />
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
}

export function PendingVettingJourneyPanel({
  steps,
  actionQueue,
  className,
}: {
  readonly steps: readonly PendingJourneyStep[]
  readonly actionQueue: VettingActionQueue
  readonly className?: string
}) {
  const workflowSteps = buildVettingWorkflowSteps(steps)
  const previewStepId = resolvePreviewStepId(steps)

  return (
    <PmContentCard title="Account progress" className={className}>
      <ol
        className="space-y-2"
        aria-label="Account progress journey"
      >
        {workflowSteps.map((step, index) => {
          const domainStep = steps[index]
          const isPrimaryStep = domainStep.id === actionQueue.primary.stepId
          const isPreviewStep =
            previewStepId === domainStep.id
            && actionQueue.secondary
            && !isPrimaryStep

          return (
            <li key={step.id}>
              <PmSurface
                variant="default"
                shadow="card"
                className={cn(
                  'flex flex-col gap-2 p-3.5 md:p-4',
                  isPrimaryStep && 'ring-1 ring-primary/20',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <StepStateIcon state={domainStep.state} workflowState={step.state} />
                    {step.href ? (
                      <Link
                        to={step.href}
                        className={cn(
                          pmTypography.bodySm,
                          'font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                          step.state === 'current' && 'text-primary',
                        )}
                      >
                        {step.label}
                      </Link>
                    ) : (
                      <span className={cn(pmTypography.bodySm, 'font-medium')}>{step.label}</span>
                    )}
                    {step.status ? (
                      <PmWorkflowBadge status={step.status} size="sm" />
                    ) : null}
                  </div>
                </div>

                {isPrimaryStep ? (
                  <PmButton
                    asChild
                    size="sm"
                    className="w-fit"
                    aria-label={`${actionQueue.primary.link.label} — primary onboarding action`}
                  >
                    <Link to={actionQueue.primary.link.href}>{actionQueue.primary.link.label}</Link>
                  </PmButton>
                ) : null}

                {isPreviewStep && actionQueue.secondary ? (
                  <PmButton
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    aria-label={`${actionQueue.secondary.link.label} — next onboarding action`}
                  >
                    <Link to={actionQueue.secondary.link.href}>
                      {actionQueue.secondary.link.label}
                    </Link>
                  </PmButton>
                ) : null}

                {domainStep.state === 'blocked' && domainStep.id === 'admin_review' ? (
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    Upload required documents before admin review.
                  </p>
                ) : null}
              </PmSurface>
            </li>
          )
        })}
      </ol>
    </PmContentCard>
  )
}
