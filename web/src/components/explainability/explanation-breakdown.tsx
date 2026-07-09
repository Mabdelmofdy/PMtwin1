import type { ExplanationBundle } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function ExplanationBreakdown({
  bundle,
  className,
  heading = 'Score breakdown',
}: {
  bundle: ExplanationBundle
  className?: string
  heading?: string
}) {
  if (bundle.scoreBreakdown.length === 0) return null

  return (
    <div className={cn('space-y-2', className)} data-slot="explanation-breakdown">
      <p className={cn(pmTypography.label)}>{heading}</p>
      <div className="space-y-2">
        {bundle.scoreBreakdown.map((entry) => {
          const percent =
            entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0
          return (
            <div key={`${entry.label}-${entry.weight}`} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(pmTypography.bodySm)}>{entry.label}</span>
                <span className={cn(pmTypography.caption, 'tabular-nums text-muted-foreground')}>
                  {percent}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
