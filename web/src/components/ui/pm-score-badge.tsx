import type { ComponentProps } from 'react'
import { PmMatchScoreBadge, type PmMatchScoreBadgeVariant } from '@/components/ui/pm-match-score-badge'
import {
  PmReadinessScoreBadge,
  type PmReadinessScoreBadgeVariant,
} from '@/components/ui/pm-readiness-score-badge'
import type { ReadinessScoreExplanation } from '@/components/ui/pm-score-explanation'

export type PmScoreBadgeType = 'readiness' | 'match'

export type PmScoreBadgeVariant =
  | PmMatchScoreBadgeVariant
  | PmReadinessScoreBadgeVariant

export type PmScoreBadgeProps = {
  type: PmScoreBadgeType
  value: number
  variant?: PmScoreBadgeVariant
  showLabel?: boolean
  className?: string
  explanation?: ReadinessScoreExplanation
  breakdown?: Record<string, number>
  explainable?: boolean
} & Omit<ComponentProps<'div'>, 'children'>

/**
 * Unified score badge — delegates to readiness or match display components.
 * Use when a single API surface is preferred; otherwise import the typed badges directly.
 */
export function PmScoreBadge({
  type,
  value,
  variant = 'default',
  showLabel = true,
  className,
  explanation,
  breakdown,
  explainable,
  ...props
}: PmScoreBadgeProps) {
  if (type === 'readiness') {
    return (
      <PmReadinessScoreBadge
        score={value}
        variant={variant as PmReadinessScoreBadgeVariant}
        showLabel={showLabel}
        className={className}
        explanation={explanation}
        explainable={explainable}
        {...props}
      />
    )
  }

  return (
    <PmMatchScoreBadge
      score={value}
      variant={variant as PmMatchScoreBadgeVariant}
      showLabel={showLabel}
      className={className}
      breakdown={breakdown}
      explainable={explainable}
      {...props}
    />
  )
}