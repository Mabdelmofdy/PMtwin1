import type { ReasonCode } from '../reason-codes/index.ts'
import type {
  ExplanationSeverity,
  RecommendationPriority,
} from './severity.ts'
import type { ExplanationMetadata } from './metadata.ts'

export type Recommendation = {
  readonly id: string
  readonly label: string
  readonly reasonCode: ReasonCode
  readonly priority: RecommendationPriority
  readonly impactPercent: number
  readonly estimatedScore: number
  readonly href?: string
  readonly category: string
  readonly severity: ExplanationSeverity
  readonly metadata?: ExplanationMetadata
}
