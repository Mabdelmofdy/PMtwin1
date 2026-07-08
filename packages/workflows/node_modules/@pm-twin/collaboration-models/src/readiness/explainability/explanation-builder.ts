import type {
  ReadinessExplanation,
  ReadinessFieldContribution,
  ReadinessResult,
} from '../types.ts'
import { fieldIdToReasonCode } from '../field-presence.ts'

export function buildExplanations(
  contributions: readonly ReadinessFieldContribution[],
  score: number,
): readonly ReadinessExplanation[] {
  const explanations: ReadinessExplanation[] = [
    {
      code: 'READINESS_SCORE_SUMMARY',
      message: `Readiness ${Math.round(score)}%`,
      severity: 'info',
    },
  ]

  const missingRequired = contributions.filter(
    (c) => c.requiredWeight > 0 && !c.present,
  )
  const missingRecommended = contributions.filter(
    (c) => c.recommendedWeight > 0 && !c.present,
  )

  for (const field of missingRequired) {
    explanations.push({
      code: fieldIdToReasonCode(field.fieldId),
      message: `Missing required: ${field.label}`,
      severity: 'critical',
      category: field.category,
      fieldId: field.fieldId,
    })
  }

  if (missingRecommended.length > 0) {
    explanations.push({
      code: 'READINESS_RECOMMENDED_GAPS',
      message: `${missingRecommended.length} recommended field(s) remaining`,
      severity: 'warning',
    })
    for (const field of missingRecommended) {
      explanations.push({
        code: fieldIdToReasonCode(field.fieldId),
        message: `Recommended: ${field.label}`,
        severity: 'warning',
        category: field.category,
        fieldId: field.fieldId,
      })
    }
  }

  return explanations
}

export function explanationsToMessages(
  explanations: readonly ReadinessExplanation[],
): readonly string[] {
  return explanations.map((item) => item.message)
}

export function buildBlockingReasons(
  contributions: readonly ReadinessFieldContribution[],
): ReadinessResult['blockingReasons'] {
  return contributions
    .filter((c) => c.requiredWeight > 0 && !c.present)
    .map((field) => ({
      code: fieldIdToReasonCode(field.fieldId),
      message: `Complete ${field.label}`,
      severity: 'critical' as const,
      fieldId: field.fieldId,
      category: field.category,
    }))
}
