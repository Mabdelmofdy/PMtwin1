import type { ReasonCode } from '../reason-codes/index.ts'
import type { ExplanationSeverity } from './severity.ts'

export type BlockingFactor = {
  readonly reasonCode: ReasonCode
  readonly severity: ExplanationSeverity
  readonly blockingEntity?: string
  readonly resolutionHint?: string
}
