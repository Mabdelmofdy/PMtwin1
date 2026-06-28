export const LABEL_PARTIAL = 0.25

export type ScoreLabel = 'Match' | 'Partial' | 'No Match'

export function labelFromScore(score: number): ScoreLabel {
  if (score >= 1) return 'Match'
  if (score >= LABEL_PARTIAL) return 'Partial'
  return 'No Match'
}
