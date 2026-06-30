/**
 * Match score display helpers — compatibility tiers and semantic tones.
 * Display-only; scores may be stored as 0–1 fractions or 0–100 percentages.
 */

import type { PmBadgeTone } from '@/components/ui/pm-badge'

export type MatchCompatibilityLevel =
  | 'excellent'
  | 'strong'
  | 'good'
  | 'weak'
  | 'poor'

export type MatchScoreDisplay = {
  readonly percent: number
  readonly level: MatchCompatibilityLevel
  readonly label: string
  readonly tone: PmBadgeTone
}

const COMPATIBILITY_LABELS: Record<MatchCompatibilityLevel, string> = {
  excellent: 'Excellent Match',
  strong: 'Strong Match',
  good: 'Good Match',
  weak: 'Weak Match',
  poor: 'Poor Match',
}

const LEVEL_TONE: Record<MatchCompatibilityLevel, PmBadgeTone> = {
  excellent: 'success',
  strong: 'info',
  good: 'warning',
  weak: 'neutral',
  poor: 'danger',
}

/** Normalize stored match score to an integer 0–100 percent. */
export function normalizeMatchScorePercent(score: number): number {
  if (!Number.isFinite(score)) return 0
  if (score > 0 && score <= 1) return Math.round(score * 100)
  return Math.round(Math.min(100, Math.max(0, score)))
}

/** Resolve compatibility tier from a 0–100 percent value. */
export function resolveMatchCompatibilityLevel(
  percent: number,
): MatchCompatibilityLevel {
  if (percent >= 90) return 'excellent'
  if (percent >= 75) return 'strong'
  if (percent >= 60) return 'good'
  if (percent >= 40) return 'weak'
  return 'poor'
}

/** Full display model for match score UI. */
export function resolveMatchScoreDisplay(score: number): MatchScoreDisplay {
  const percent = normalizeMatchScorePercent(score)
  const level = resolveMatchCompatibilityLevel(percent)
  return {
    percent,
    level,
    label: COMPATIBILITY_LABELS[level],
    tone: LEVEL_TONE[level],
  }
}

/** Format percent for display. */
export function formatMatchScorePercent(score: number): string {
  return `${normalizeMatchScorePercent(score)}%`
}
