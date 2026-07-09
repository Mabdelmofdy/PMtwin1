import type { ExplanationBundle } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { ExplanationHealthBadge } from '@/components/explainability/explanation-health-badge.tsx'

export function ExplanationSummary({
  bundle,
  scoreLabel = 'Score',
  className,
}: {
  bundle: ExplanationBundle
  scoreLabel?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)} data-slot="explanation-summary">
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn(pmTypography.stat, 'tabular-nums')}>
          {formatReadinessScorePercent(bundle.score)}
        </p>
        <ExplanationHealthBadge health={bundle.health} />
      </div>
      <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{scoreLabel}</p>
      <p className={cn(pmTypography.bodySm, 'text-foreground')}>{bundle.summary}</p>
    </div>
  )
}
