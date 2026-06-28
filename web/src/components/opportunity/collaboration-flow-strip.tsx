import { cn } from '@/lib/utils'

export const COLLABORATION_FLOW_STEPS = [
  'Opportunity',
  'PostMatch',
  'Negotiation',
  'Deal',
  'Contract',
] as const

export type CollaborationFlowStep = (typeof COLLABORATION_FLOW_STEPS)[number]

type CollaborationFlowStripProps = {
  readonly activeStep?: CollaborationFlowStep
  readonly className?: string
}

export function CollaborationFlowStrip({
  activeStep = 'Opportunity',
  className,
}: CollaborationFlowStripProps) {
  const activeIndex = COLLABORATION_FLOW_STEPS.indexOf(activeStep)

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-muted/30 px-4 py-3',
        className,
      )}
      aria-label="Collaboration path"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Canonical collaboration path
      </p>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {COLLABORATION_FLOW_STEPS.map((step, index) => {
          const isActive = index === activeIndex
          const isPast = index < activeIndex
          return (
            <li key={step} className="flex items-center gap-1">
              {index > 0 ? (
                <span className="px-1 text-muted-foreground" aria-hidden>
                  →
                </span>
              ) : null}
              <span
                className={cn(
                  'rounded-md px-2 py-0.5',
                  isActive && 'bg-primary/10 font-semibold text-primary',
                  isPast && !isActive && 'text-foreground',
                  !isActive && !isPast && 'text-muted-foreground',
                )}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
