import type { ExplanationBundle } from '@pm-twin/explainability'
import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import {
  formatReadinessScorePercent,
  resolveReadinessScoreDisplay,
  type ReadinessScoreDisplay,
} from '@/components/ui/pm-readiness-score-display'
import { buildScoreRegionLabel } from '@/components/ui/pm-score-a11y'
import {
  buildReadinessExplanationLines,
  type ReadinessScoreExplanation,
} from '@/components/ui/pm-score-explanation'
import { bundleToReadinessTooltipLines } from '@/services/explainability/explainability-service.ts'
import { PmScoreTooltip } from '@/components/ui/pm-score-tooltip'

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
  display?: ReadinessScoreDisplay
  explanation?: ReadinessScoreExplanation
  bundle?: ExplanationBundle
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

/** Token-driven readiness score indicator — compact badge through hero layouts. */
export function PmReadinessScoreBadge({
  score,
  variant = 'default',
  showLabel = true,
  className,
  display: displayProp,
  explanation,
  bundle,
  explainable,
  ...props
}: PmReadinessScoreBadgeProps) {
  const display = displayProp ?? resolveReadinessScoreDisplay(score)
  const percentLabel = `${display.percent}%`
  const explanationLines = bundle
    ? bundleToReadinessTooltipLines(bundle)
    : buildReadinessExplanationLines(display, explanation)
  const resolvedVariant = variant === 'card' ? 'default' : variant
  const shouldExplain =
    explainable ??
    (resolvedVariant === 'compact' ||
      resolvedVariant === 'admin' ||
      resolvedVariant === 'tooltip' ||
      resolvedVariant === 'pipeline' ||
      resolvedVariant === 'list')
  const regionLabel = buildScoreRegionLabel('readiness', explanationLines)

  if (resolvedVariant === 'compact' || resolvedVariant === 'admin') {
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
        data-slot="pm-readiness-score-list"
        className={cn(
          'inline-flex max-w-full flex-wrap items-center justify-end gap-1.5 tabular-nums sm:gap-2',
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
        data-slot="pm-readiness-score-pipeline"
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
        data-slot="pm-readiness-score-dashboard"
        role="region"
        aria-label={regionLabel}
        className={cn(
          'pm-score-surface flex min-w-0 w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-muted/60 px-4 py-3',
          className,
        )}
        {...props}
      >
        <div className="min-w-0">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Readiness score</p>
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
    return (
      <div
        data-slot="pm-readiness-score-hero"
        role="region"
        aria-label={regionLabel}
        className={cn(
          'pm-score-surface flex min-w-0 w-full flex-col gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-surface to-surface-muted/80 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
        {...props}
      >
        <div className="min-w-0 space-y-1">
          <p className={pmTypography.overline}>Opportunity readiness</p>
          <div className="flex flex-wrap items-center gap-2">
            <PmBadge tone={display.tone} size="lg" className="max-w-full truncate">
              {display.label}
            </PmBadge>
            <span className={cn(pmTypography.caption, 'min-w-0 text-muted-foreground')}>
              How complete and ready this opportunity is
            </span>
          </div>
          {explanation?.missingRequired?.length ? (
            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Missing required: {explanation.missingRequired.join(', ')}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-end">
          <p className={cn(pmTypography.stat, 'text-3xl sm:text-4xl md:text-5xl')}>{percentLabel}</p>
          <p className={pmTypography.statLabel}>Readiness score</p>
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
      data-slot="pm-readiness-score-badge"
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

export { formatReadinessScorePercent, resolveReadinessScoreDisplay }
