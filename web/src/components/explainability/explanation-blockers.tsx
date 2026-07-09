import type { ExplanationBundle } from '@pm-twin/explainability'
import { EXPLANATION_SEVERITY } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'

const SEVERITY_TONES = {
  [EXPLANATION_SEVERITY.INFO]: 'info',
  [EXPLANATION_SEVERITY.WARNING]: 'warning',
  [EXPLANATION_SEVERITY.CRITICAL]: 'danger',
} as const

export function ExplanationBlockers({
  bundle,
  className,
  heading = 'Blockers',
}: {
  bundle: ExplanationBundle
  className?: string
  heading?: string
}) {
  const blockers = bundle.blockers
  const criticalReasons = bundle.reasons.filter(
    (reason) => reason.severity === EXPLANATION_SEVERITY.CRITICAL,
  )

  if (blockers.length === 0 && criticalReasons.length === 0) return null

  return (
    <div className={cn('space-y-2', className)} data-slot="explanation-blockers">
      <p className={cn(pmTypography.label)}>{heading}</p>
      <ul className={cn('space-y-2', pmTypography.bodySm)}>
        {blockers.map((blocker) => (
          <li
            key={`${blocker.reasonCode}-${blocker.blockingEntity ?? 'global'}`}
            className="rounded-md border border-border/60 bg-surface-muted/40 px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <PmBadge tone={SEVERITY_TONES[blocker.severity]} size="sm">
                {blocker.severity}
              </PmBadge>
              <span className="font-medium">{blocker.reasonCode}</span>
            </div>
            {blocker.resolutionHint ? (
              <p className={cn('mt-1 text-muted-foreground')}>{blocker.resolutionHint}</p>
            ) : null}
          </li>
        ))}
        {criticalReasons.map((reason) => (
          <li
            key={reason.code}
            className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2"
          >
            <p>{reason.message}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
