import type { ExplanationBundle } from '../types/bundle.ts'
import type { Recommendation } from '../types/recommendation.ts'
import type { ScoreBreakdownEntry } from '../types/score-breakdown.ts'
import type { TimelineEvent } from '../types/timeline.ts'

export interface ExplainabilityAdapter<TInput> {
  buildExplanation(input: TInput): ExplanationBundle
  buildRecommendations(input: TInput): readonly Recommendation[]
  buildBreakdown(input: TInput): readonly ScoreBreakdownEntry[]
  buildTimeline(input: TInput): readonly TimelineEvent[]
}
