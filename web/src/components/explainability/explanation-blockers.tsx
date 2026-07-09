import type { ExplanationBundle } from '@pm-twin/explainability'
import { EXPLANATION_SEVERITY } from '@pm-twin/explainability'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { getReadinessReasonCopy } from '@/lib/readiness-reason-copy.ts'
import { wizardStepHref } from '@/components/opportunity/wizard/wizard-steps.ts'

const SEVERITY_TONES = {
  [EXPLANATION_SEVERITY.INFO]: 'info',
  [EXPLANATION_SEVERITY.WARNING]: 'warning',
  [EXPLANATION_SEVERITY.CRITICAL]: 'danger',
} as const

export function ExplanationBlockers({
  bundle,
  className,
  heading = 'Blockers',
  opportunityId,
}: {
  bundle: ExplanationBundle
  className?: string
  heading?: string
  opportunityId?: string
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
        {blockers.map((blocker) => {
          const copy = getReadinessReasonCopy(blocker.reasonCode)
          const href = wizardStepHref(opportunityId, copy.stepId)
          return (
            <li
              key={`${blocker.reasonCode}-${blocker.blockingEntity ?? 'global'}`}
              className="rounded-md border border-border/60 bg-surface-muted/40 px-3 py-2"
              data-reason-code={blocker.reasonCode}
            >
              <div className="flex flex-wrap items-center gap-2">
                <PmBadge tone={SEVERITY_TONES[blocker.severity]} size="sm">
                  {blocker.severity}
                </PmBadge>
                <span className="font-medium">{copy.label}</span>
                {copy.impactPercent != null ? (
                  <span className="text-muted-foreground">
                    Impact {copy.impactPercent}%
                  </span>
                ) : null}
              </div>
              <p className={cn('mt-1 text-muted-foreground')}>
                {blocker.resolutionHint || copy.why}
              </p>
              <Link
                to={href}
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                Fix in wizard
              </Link>
            </li>
          )
        })}
        {criticalReasons.map((reason) => {
          const copy = getReadinessReasonCopy(reason.code)
          return (
            <li
              key={reason.code}
              className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2"
              data-reason-code={reason.code}
            >
              <p className="font-medium">{copy.label}</p>
              <p className="text-muted-foreground">{reason.message}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
