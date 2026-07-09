import type { ReasonCode } from '../reason-codes/index.ts'

export type ScoreBreakdownEntry = {
  readonly label: string
  readonly weight: number
  readonly score: number
  readonly maxScore: number
  readonly reasonCodes: readonly ReasonCode[]
}
