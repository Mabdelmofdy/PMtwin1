import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Check, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import type { StatusEntity } from '@/lib/status-display'

export type PmWorkflowJourneyStepState = 'complete' | 'current' | 'upcoming'

export type PmWorkflowJourneyStep = {
  id: string
  label: string
  state: PmWorkflowJourneyStepState
  status?: string
  statusEntity?: StatusEntity
  href?: string
  icon?: ReactNode
}

export type PmWorkflowJourneyProps = {
  steps: readonly PmWorkflowJourneyStep[]
  className?: string
  'aria-label'?: string
  compact?: boolean
  /** Section overline — pass `false` to hide. */
  label?: string | false
}

/** Display-only workflow strip: Opportunity → Match → Negotiation → Deal → Contract → Complete. */
export function PmWorkflowJourney({
  steps,
  className,
  'aria-label': ariaLabel = 'Workflow journey',
  compact = false,
  label = 'Workflow journey',
}: PmWorkflowJourneyProps) {
  if (steps.length === 0) return null

  function resolveStateIcon(step: PmWorkflowJourneyStep): ReactNode {
    if (step.icon) return step.icon
    if (step.state === 'complete') {
      return <Check className="size-3.5 shrink-0 text-success" aria-hidden />
    }
    if (step.status === 'blocked') {
      return <Ban className="size-3.5 shrink-0 text-danger" aria-hidden />
    }
    if (step.state === 'current') {
      return <Clock className="size-3.5 shrink-0 text-primary" aria-hidden />
    }
    return <Circle className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
  }

  return (
    <PmSurface
      data-slot="pm-workflow-journey"
      variant="muted"
      className={cn(compact ? 'px-3 py-2.5' : 'px-4 py-3', className)}
    >
      {label !== false ? (
        <p className={cn(pmTypography.overline, 'mb-2 text-muted-foreground')}>
          {label}
        </p>
      ) : null}
      <ol
        className={cn(
          'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1',
          pmTypography.bodySm,
        )}
        aria-label={ariaLabel}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const stepContent = (
            <span
              className={cn(
                'inline-flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg px-2 py-1',
                step.state === 'current' &&
                  'bg-primary/10 font-semibold text-primary ring-1 ring-primary/20',
                step.state === 'complete' && 'text-foreground',
                step.state === 'upcoming' && 'text-muted-foreground',
              )}
            >
              {resolveStateIcon(step)}
              <span className="truncate">{step.label}</span>
              {step.status ? (
                <PmWorkflowBadge
                  status={step.status}
                  entity={step.statusEntity}
                  size="sm"
                  className="max-w-[8rem] truncate"
                />
              ) : null}
            </span>
          )

          return (
            <li key={step.id} className="flex min-w-0 items-center gap-1">
              {step.href ? (
                <Link
                  to={step.href}
                  className="min-w-0 rounded-lg outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {stepContent}
                </Link>
              ) : (
                stepContent
              )}
              {!isLast ? (
                <span
                  className="hidden px-0.5 text-muted-foreground sm:inline rtl:rotate-180"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </PmSurface>
  )
}
