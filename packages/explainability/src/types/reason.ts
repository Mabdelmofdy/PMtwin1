import type { ReasonCode } from '../reason-codes/index.ts'
import type { ExplanationSeverity } from './severity.ts'

export type ExplanationReason = {
  readonly code: ReasonCode
  readonly message: string
  readonly severity: ExplanationSeverity
  readonly category?: string
  readonly relatedEntityId?: string
}

export type StrengthWeaknessEntry = {
  readonly code: ReasonCode
  readonly label: string
  readonly impactPercent?: number
}
