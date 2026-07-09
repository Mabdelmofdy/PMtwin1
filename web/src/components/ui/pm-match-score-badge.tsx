import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import {
  formatMatchScorePercent,
  resolveMatchScoreDisplay,
  type MatchScoreDisplay,
} from '@/components/ui/pm-match-score-display'
import { buildScoreRegionLabel } from '@/components/ui/pm-score-a11y'
import { buildMatchExplanationLines } from '@/components/ui/pm-score-explanation'
import { PmScoreTooltip } from '@/components/ui/pm-score-tooltip'

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
  display?: MatchScoreDisplay
  breakdown?: Record<string, number>
  explainable?: boolean
} & Omit<ComponentProps<'div'>, 'children'>

function wrapExplainable(
  node: ReactElement,
  lines: readonly string[],
  explainable: boolean,
  className?: string,
) {
  return (
    <PmScoreTooltip lines={lines} disabled={!explainable} className={className}>
      {node}
    </PmScoreTooltip>
  )
}

/** Token-driven match score indicator — compact badge through hero layouts. */
export function PmMatchScoreBadge({
  score,
  variant = 'default',
  showLabel = true,
  className,
  display: displayProp,
  breakdown,
  explainable,
  ...props
}: PmMatchScoreBadgeProps) {
  const display = displayProp ?? resolveMatchScoreDisplay(score)
  const percentLabel = `${display.percent}%`
  const explanationLines = buildMatchExplanationLines(display, breakdown)
  const resolvedVariant = variant === 'card' ? 'default' : variant
  const shouldExplain =
    explainable ??
    (resolvedVariant === 'compact' ||
      resolvedVariant === 'tooltip' ||
      resolvedVariant === 'pipeline' ||
      resolvedVariant === 'list')
  const regionLabel = buildScoreRegionLabel('match', explanationLines)

  if (resolvedVariant === 'compact') {
    const badge = (
      <PmBadge
        tone={display.tone}
        size="sm"
        className={cn('shrink-0 tabular-nums', className)}
        {...props}
      >
        {percentLabel}
      </PmBadge>
    )
    return wrapExplainable(badge, explanationLines, shouldExplain)
  }

  if (resolvedVariant === 'list') {
    const content = (
      <span
        data-slot="pm-match-score-list"
        className={cn(
          'inline-flex max-w-full flex-wrap items-center gap-1.5 tabular-nums sm:gap-2',
          className,
        )}
        {...props}
      >
        <span className={cn(pmTypography.stat, 'text-sm text-foreground sm:text-base')}>
          {percentLabel}
        </span>
        {showLabel ? (
          <PmBadge tone={display.tone} size="sm" className="max-w-full truncate">
            {display.label}
          </PmBadge>
        ) : null}
      </span>
    )
    return wrapExplainable(content, explanationLines, shouldExplain)
  }

  if (resolvedVariant === 'pipeline') {
    const content = (
      <span
        data-slot="pm-match-score-pipeline"
        className={cn(
          'inline-flex max-w-full shrink-0 flex-col items-end gap-0.5 tabular-nums',
          className,
        )}
        {...props}
      >
        <span className={cn(pmTypography.stat, 'text-base leading-none sm:text-lg')}>
          {percentLabel}
        </span>
        {showLabel ? (
          <PmBadge tone={display.tone} size="sm" className="max-w-[8rem] truncate">
            {display.label}
          </PmBadge>
        ) : null}
      </span>
    )
    return wrapExplainable(content, explanationLines, shouldExplain)
  }

  if (resolvedVariant === 'dashboard') {
    return (
      <div
        data-slot="pm-match-score-dashboard"
        role="region"
        aria-label={regionLabel}
        className={cn(
          'pm-score-surface flex min-w-0 w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-3',
          className,
        )}
        {...props}
      >
        <div className="min-w-0">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Match score</p>
          {showLabel ? (
            <PmBadge tone={display.tone} size="sm" className="mt-1 max-w-full truncate">
              {display.label}
            </PmBadge>
          ) : null}
        </div>
        <p className={cn(pmTypography.stat, 'shrink-0 text-2xl md:text-[1.75rem]')}>
          {percentLabel}
        </p>
      </div>
    )
  }

  if (resolvedVariant === 'hero') {
    const breakdownLine = explanationLines.find((line) => line.includes(':'))
    return (
      <div
        data-slot="pm-match-score-hero"
        role="region"
        aria-label={regionLabel}
        className={cn(
          'pm-score-surface flex min-w-0 w-full flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-surface to-surface-muted/80 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
        {...props}
      >
        <div className="min-w-0 space-y-1">
          <p className={pmTypography.overline}>Match compatibility</p>
          <div className="flex flex-wrap items-center gap-2">
            <PmBadge tone={display.tone} size="lg" className="max-w-full truncate">
              {display.label}
            </PmBadge>
            <span className={cn(pmTypography.caption, 'min-w-0 text-muted-foreground')}>
              Based on skills, timeline, and location fit
            </span>
          </div>
          {breakdownLine ? (
            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Top signal: {breakdownLine}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-end">
          <p className={cn(pmTypography.stat, 'text-3xl sm:text-4xl md:text-5xl')}>{percentLabel}</p>
          <p className={pmTypography.statLabel}>Match score</p>
        </div>
      </div>
    )
  }

  if (resolvedVariant === 'tooltip') {
    const badge = (
      <PmBadge
        tone={display.tone}
        size="md"
        className={cn('max-w-full cursor-default truncate tabular-nums', className)}
        {...props}
      >
        {percentLabel}
        {showLabel ? ` · ${display.label}` : null}
      </PmBadge>
    )
    return wrapExplainable(badge, explanationLines, shouldExplain)
  }

  const content = (
    <span
      data-slot="pm-match-score-badge"
      className={cn('inline-flex max-w-full flex-wrap items-center gap-2', className)}
      {...props}
    >
      <PmBadge tone={display.tone} size="md" className="shrink-0 tabular-nums">
        {percentLabel}
      </PmBadge>
      {showLabel ? (
        <span className={cn(pmTypography.caption, 'min-w-0 text-muted-foreground')}>
          {display.label}
        </span>
      ) : null}
    </span>
  )
  return wrapExplainable(content, explanationLines, shouldExplain)
}

export { formatMatchScorePercent, resolveMatchScoreDisplay }
