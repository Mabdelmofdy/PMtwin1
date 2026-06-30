/**
 * Score explanation helpers — display-only copy for tooltips and popovers.
 * No new calculations; formats existing readiness gaps and match breakdowns.
 */

import type { ReadinessScoreDisplay } from '@/components/ui/pm-readiness-score-display'
import type { MatchScoreDisplay } from '@/components/ui/pm-match-score-display'

export type ReadinessScoreExplanation = {
  readonly missingRequired?: readonly string[]
  readonly missingRecommended?: readonly string[]
}

const MATCH_BREAKDOWN_LABELS: Record<string, string> = {
  skillMatch: 'Skills',
  timelineFit: 'Timeline',
  locationFit: 'Location',
  budgetFit: 'Budget',
  sectorFit: 'Sector',
  roleFit: 'Role',
}

function formatBreakdownPercent(value: number): string {
  const percent = value > 0 && value <= 1 ? Math.round(value * 100) : Math.round(value)
  return `${percent}%`
}

/** Human-readable lines for match score breakdown (existing payload fields). */
export function formatMatchBreakdownLines(
  breakdown?: Record<string, number>,
): readonly string[] {
  if (!breakdown) return []
  return Object.entries(breakdown)
    .filter(([, value]) => Number.isFinite(value))
    .map(([key, value]) => {
      const label = MATCH_BREAKDOWN_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim()
      return `${label}: ${formatBreakdownPercent(value)}`
    })
}

/** Whether readiness has gap fields to show in an explanation. */
export function hasReadinessExplanation(
  explanation?: ReadinessScoreExplanation,
): boolean {
  if (!explanation) return false
  return (
    (explanation.missingRequired?.length ?? 0) > 0 ||
    (explanation.missingRecommended?.length ?? 0) > 0
  )
}

/** Whether match has breakdown fields to show in an explanation. */
export function hasMatchExplanation(breakdown?: Record<string, number>): boolean {
  return formatMatchBreakdownLines(breakdown).length > 0
}

export function buildReadinessExplanationLines(
  display: ReadinessScoreDisplay,
  explanation?: ReadinessScoreExplanation,
): readonly string[] {
  const lines: string[] = [
    `${display.percent}% readiness`,
    `Completion tier: ${display.label}`,
  ]

  if (explanation?.missingRequired?.length) {
    lines.push(`Required: ${explanation.missingRequired.join(', ')}`)
  }
  if (explanation?.missingRecommended?.length) {
    lines.push(`Recommended: ${explanation.missingRecommended.join(', ')}`)
  }
  if (!hasReadinessExplanation(explanation) && display.level === 'ready') {
    lines.push('All required fields are complete.')
  }

  return lines
}

export function buildMatchExplanationLines(
  display: MatchScoreDisplay,
  breakdown?: Record<string, number>,
): readonly string[] {
  const lines: string[] = [
    `${display.percent}% match`,
    `Compatibility: ${display.label}`,
  ]

  const breakdownLines = formatMatchBreakdownLines(breakdown)
  if (breakdownLines.length > 0) {
    lines.push(...breakdownLines)
  }

  return lines
}
