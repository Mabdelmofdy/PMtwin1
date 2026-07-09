import type { EngineId } from './engine.ts'
import type { Health } from './health.ts'
import type { ExplanationMetadata } from './metadata.ts'
import type { BlockingFactor } from './blocking.ts'
import type { ExplanationReason, StrengthWeaknessEntry } from './reason.ts'
import type { Recommendation } from './recommendation.ts'
import type { ScoreBreakdownEntry } from './score-breakdown.ts'
import type { TimelineEvent } from './timeline.ts'

export type ExplanationBundle = {
  readonly engine: EngineId
  readonly entityId: string
  readonly score: number
  readonly health: Health
  readonly summary: string
  readonly scoreBreakdown: readonly ScoreBreakdownEntry[]
  readonly reasons: readonly ExplanationReason[]
  readonly blockers: readonly BlockingFactor[]
  readonly strengths: readonly StrengthWeaknessEntry[]
  readonly weaknesses: readonly StrengthWeaknessEntry[]
  readonly recommendations: readonly Recommendation[]
  readonly timeline: readonly TimelineEvent[]
  readonly metadata: ExplanationMetadata
}
