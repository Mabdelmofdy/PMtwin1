/**
 * Readiness score display helpers — completion tiers and semantic tones.
 * Display-only; uses existing evaluator scores (0–100).
 */

import type { PmBadgeTone } from '@/components/ui/pm-badge'

export type ReadinessCompletionLevel =
  | 'ready'
  | 'good'
  | 'needs_improvement'
  | 'incomplete'

export type ReadinessScoreDisplay = {
  readonly percent: number
  readonly level: ReadinessCompletionLevel
  readonly label: string
  readonly tone: PmBadgeTone
}

const COMPLETION_LABELS: Record<ReadinessCompletionLevel, string> = {
  ready: 'Ready',
  good: 'Good',
  needs_improvement: 'Needs Improvement',
  incomplete: 'Incomplete',
}

const LEVEL_TONE: Record<ReadinessCompletionLevel, PmBadgeTone> = {
  ready: 'success',
  good: 'info',
  needs_improvement: 'warning',
  incomplete: 'danger',
}

/** Normalize stored readiness score to an integer 0–100 percent. */
export function normalizeReadinessScorePercent(score: number): number {
  if (!Number.isFinite(score)) return 0
  return Math.round(Math.min(100, Math.max(0, score)))
}

/** Resolve completion tier from a 0–100 percent value. */
export function resolveReadinessCompletionLevel(
  percent: number,
): ReadinessCompletionLevel {
  if (percent >= 90) return 'ready'
  if (percent >= 80) return 'good'
  if (percent >= 70) return 'needs_improvement'
  return 'incomplete'
}

/** Full display model for readiness score UI. */
export function resolveReadinessScoreDisplay(score: number): ReadinessScoreDisplay {
  const percent = normalizeReadinessScorePercent(score)
  const level = resolveReadinessCompletionLevel(percent)
  return {
    percent,
    level,
    label: COMPLETION_LABELS[level],
    tone: LEVEL_TONE[level],
  }
}

/** Format percent for display. */
export function formatReadinessScorePercent(score: number): string {
  return `${normalizeReadinessScorePercent(score)}%`
}
