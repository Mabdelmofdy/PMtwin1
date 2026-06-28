export {
  applyReadinessAdjustmentIfEnabled,
  denormalizeMatchScoreFromPercent,
  isFractionalMatchScore,
  normalizeMatchScoreToPercent,
} from '@/domain/matching-readiness-adjustment/apply-readiness-adjustment.ts'
export {
  calculateReadinessAdjustment,
  ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT,
} from '@/domain/matching-readiness-adjustment/matching-readiness-adjustment.ts'
export type {
  ApplyReadinessAdjustmentInput,
  ApplyReadinessAdjustmentResult,
  CalculateReadinessAdjustmentInput,
  ReadinessAdjustmentFactors,
  ReadinessAdjustmentResult,
} from '@/domain/matching-readiness-adjustment/types.ts'
