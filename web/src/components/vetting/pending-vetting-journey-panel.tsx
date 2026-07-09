import type { PendingJourneyStep } from '@/domain/pending-vetting-journey/types.ts'
import { PmWorkflowJourney } from '@/components/ui/pm-workflow-journey.tsx'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

function mapStepState(
  state: PendingJourneyStep['state'],
): 'complete' | 'current' | 'upcoming' {
  if (state === 'completed') return 'complete'
  if (state === 'current') return 'current'
  return 'upcoming'
}

export function PendingVettingJourneyPanel({
  steps,
  className,
}: {
  readonly steps: readonly PendingJourneyStep[]
  readonly className?: string
}) {
  return (
    <PmContentCard title="Account progress" className={className}>
      <PmWorkflowJourney
        label="Onboarding journey"
        aria-label="Account progress journey"
        steps={steps.map((step) => ({
          id: step.id,
          label: step.label,
          state: mapStepState(step.state),
          href: step.href,
          status:
            step.state === 'blocked'
              ? 'blocked'
              : step.state === 'completed'
                ? 'complete'
                : step.state,
        }))}
      />
      <ul className={cn('mt-3 space-y-1', pmTypography.caption, 'text-muted-foreground')}>
        {steps.map((step) => (
          <li key={step.id}>
            {step.label}: {step.state}
          </li>
        ))}
      </ul>
    </PmContentCard>
  )
}
