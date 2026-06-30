import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import {
  formatReadinessScorePercent,
  resolveReadinessScoreDisplay,
  type ReadinessScoreDisplay,
} from '@/components/ui/pm-readiness-score-display'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type PmReadinessScoreBadgeVariant =
  | 'compact'
  | 'default'
  | 'card'
  | 'hero'
  | 'tooltip'
  | 'list'
  | 'pipeline'
  | 'dashboard'
  | 'admin'

export type PmReadinessScoreBadgeProps = {
  score: number
  variant?: PmReadinessScoreBadgeVariant
  showLabel?: boolean
  className?: string
  /** Pre-resolved display — skips recompute when parent already resolved. */
  display?: ReadinessScoreDisplay
} & Omit<ComponentProps<'div'>, 'children'>

function ReadinessScoreTooltipContent({ display }: { display: ReadinessScoreDisplay }) {
  return (
    <div className="space-y-1 text-xs">
      <p className="font-semibold">{display.percent}% readiness</p>
      <p className="text-muted-foreground">Completion: {display.label}</p>
    </div>
  )
}

/** Token-driven readiness score indicator — compact badge through hero layouts. */
export function PmReadinessScoreBadge({
  score,
  variant = 'default',
  showLabel = true,
  className,
  display: displayProp,
  ...props
}: PmReadinessScoreBadgeProps) {
  const display = displayProp ?? resolveReadinessScoreDisplay(score)
  const percentLabel = `${display.percent}%`

  const resolvedVariant = variant === 'card' ? 'default' : variant

  if (resolvedVariant === 'compact' || resolvedVariant === 'admin') {
    return (
      <PmBadge tone={display.tone} size="sm" className={className} {...props}>
        {percentLabel}
      </PmBadge>
    )
  }

  if (resolvedVariant === 'list') {
    return (
      <span
        data-slot="pm-readiness-score-list"
        className={cn('inline-flex items-center justify-end gap-2 tabular-nums', className)}
        {...props}
      >
        <span className={cn(pmTypography.stat, 'text-base text-foreground')}>
          {percentLabel}
        </span>
        {showLabel ? (
          <PmBadge tone={display.tone} size="sm">
            {display.label}
          </PmBadge>
        ) : null}
      </span>
    )
  }

  if (resolvedVariant === 'pipeline') {
    return (
      <span
        data-slot="pm-readiness-score-pipeline"
        className={cn('inline-flex flex-col items-end gap-0.5 tabular-nums', className)}
        {...props}
      >
        <span className={cn(pmTypography.stat, 'text-lg leading-none')}>{percentLabel}</span>
        {showLabel ? (
          <PmBadge tone={display.tone} size="sm">
            {display.label}
          </PmBadge>
        ) : null}
      </span>
    )
  }

  if (resolvedVariant === 'dashboard') {
    return (
      <div
        data-slot="pm-readiness-score-dashboard"
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-3',
          className,
        )}
        {...props}
      >
        <div className="min-w-0">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Readiness score</p>
          {showLabel ? (
            <PmBadge tone={display.tone} size="sm" className="mt-1">
              {display.label}
            </PmBadge>
          ) : null}
        </div>
        <p className={cn(pmTypography.stat, 'text-2xl md:text-[1.75rem]')}>{percentLabel}</p>
      </div>
    )
  }

  if (resolvedVariant === 'hero') {
    return (
      <div
        data-slot="pm-readiness-score-hero"
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-surface to-surface-muted/80 p-5 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
        {...props}
      >
        <div className="space-y-1">
          <p className={pmTypography.overline}>Opportunity readiness</p>
          <div className="flex flex-wrap items-center gap-2">
            <PmBadge tone={display.tone} size="lg">
              {display.label}
            </PmBadge>
            <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
              How complete and ready this opportunity is
            </span>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <p className={cn(pmTypography.stat, 'text-4xl md:text-5xl')}>{percentLabel}</p>
          <p className={pmTypography.statLabel}>Readiness score</p>
        </div>
      </div>
    )
  }

  if (resolvedVariant === 'tooltip') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <PmBadge
            tone={display.tone}
            size="md"
            className={cn('cursor-default tabular-nums', className)}
            {...props}
          >
            {percentLabel}
            {showLabel ? ` · ${display.label}` : null}
          </PmBadge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <ReadinessScoreTooltipContent display={display} />
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span
      data-slot="pm-readiness-score-badge"
      className={cn('inline-flex flex-wrap items-center gap-2', className)}
      {...props}
    >
      <PmBadge tone={display.tone} size="md" className="tabular-nums">
        {percentLabel}
      </PmBadge>
      {showLabel ? (
        <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
          {display.label}
        </span>
      ) : null}
    </span>
  )
}

export { formatReadinessScorePercent, resolveReadinessScoreDisplay }
