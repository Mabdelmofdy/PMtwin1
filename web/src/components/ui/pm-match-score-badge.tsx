import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import {
  formatMatchScorePercent,
  resolveMatchScoreDisplay,
  type MatchScoreDisplay,
} from '@/components/ui/pm-match-score-display'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type PmMatchScoreBadgeVariant =
  | 'compact'
  | 'default'
  | 'card'
  | 'hero'
  | 'tooltip'
  | 'list'
  | 'pipeline'
  | 'dashboard'

export type PmMatchScoreBadgeProps = {
  score: number
  variant?: PmMatchScoreBadgeVariant
  showLabel?: boolean
  className?: string
  /** Pre-resolved display — skips recompute when parent already resolved. */
  display?: MatchScoreDisplay
} & Omit<ComponentProps<'div'>, 'children'>

function MatchScoreTooltipContent({ display }: { display: MatchScoreDisplay }) {
  return (
    <div className="space-y-1 text-xs">
      <p className="font-semibold">{display.percent}% match</p>
      <p className="text-muted-foreground">Compatibility: {display.label}</p>
    </div>
  )
}

/** Token-driven match score indicator — compact badge through hero layouts. */
export function PmMatchScoreBadge({
  score,
  variant = 'default',
  showLabel = true,
  className,
  display: displayProp,
  ...props
}: PmMatchScoreBadgeProps) {
  const display = displayProp ?? resolveMatchScoreDisplay(score)
  const percentLabel = `${display.percent}%`

  const resolvedVariant = variant === 'card' ? 'default' : variant

  if (resolvedVariant === 'compact') {
    return (
      <PmBadge tone={display.tone} size="sm" className={className} {...props}>
        {percentLabel}
      </PmBadge>
    )
  }

  if (resolvedVariant === 'list') {
    return (
      <span
        data-slot="pm-match-score-list"
        className={cn('inline-flex items-center gap-2 tabular-nums', className)}
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
        data-slot="pm-match-score-pipeline"
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
        data-slot="pm-match-score-dashboard"
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-3',
          className,
        )}
        {...props}
      >
        <div className="min-w-0">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Match score</p>
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
        data-slot="pm-match-score-hero"
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-surface to-surface-muted/80 p-5 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
        {...props}
      >
        <div className="space-y-1">
          <p className={pmTypography.overline}>Match compatibility</p>
          <div className="flex flex-wrap items-center gap-2">
            <PmBadge tone={display.tone} size="lg">
              {display.label}
            </PmBadge>
            <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Based on skills, timeline, and location fit
            </span>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <p className={cn(pmTypography.stat, 'text-4xl md:text-5xl')}>{percentLabel}</p>
          <p className={pmTypography.statLabel}>Match score</p>
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
          <MatchScoreTooltipContent display={display} />
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span
      data-slot="pm-match-score-badge"
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

export { formatMatchScorePercent, resolveMatchScoreDisplay }
