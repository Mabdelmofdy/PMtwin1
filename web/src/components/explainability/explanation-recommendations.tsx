import { Link } from 'react-router-dom'
import type { ExplanationBundle } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'

export function ExplanationRecommendations({
  bundle,
  className,
  heading = 'Recommended actions',
  compact = false,
}: {
  bundle: ExplanationBundle
  className?: string
  heading?: string
  compact?: boolean
}) {
  if (bundle.recommendations.length === 0) return null

  return (
    <div className={cn('space-y-2', className)} data-slot="explanation-recommendations">
      <p className={cn(pmTypography.label)}>{heading}</p>
      <ul className={cn('space-y-2', pmTypography.bodySm)}>
        {bundle.recommendations.map((recommendation) => (
          <li
            key={recommendation.id}
            className={cn(
              'rounded-md border border-border/60 px-3 py-2',
              compact ? 'bg-transparent' : 'bg-surface-muted/30',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{recommendation.label}</p>
                {!compact ? (
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {recommendation.category}
                  </p>
                ) : null}
              </div>
              <PmBadge tone="info" size="sm" className="shrink-0 tabular-nums">
                +{recommendation.impactPercent}%
              </PmBadge>
            </div>
            {recommendation.href ? (
              <PmButton
                variant="link"
                size="sm"
                className="mt-1 h-auto px-0"
                asChild
              >
                <Link to={recommendation.href}>Take action</Link>
              </PmButton>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
