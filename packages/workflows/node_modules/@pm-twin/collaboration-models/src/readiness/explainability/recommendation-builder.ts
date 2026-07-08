import type {
  ReadinessAction,
  ReadinessFieldContribution,
  ReadinessResult,
} from '../types.ts'
import { fieldIdToReasonCode } from '../field-presence.ts'
import { resolveReadinessLevel } from '../readiness-levels.ts'

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function simulateScoreAfterField(
  contributions: readonly ReadinessFieldContribution[],
  targetFieldId: string,
): number {
  let earnedRequired = 0
  let earnedRecommended = 0
  let totalRequired = 0
  let totalRecommended = 0

  for (const field of contributions) {
    totalRequired += field.requiredWeight
    totalRecommended += field.recommendedWeight
    const present = field.fieldId === targetFieldId ? true : field.present
    if (present) {
      earnedRequired += field.requiredWeight
      earnedRecommended += field.recommendedWeight
    }
  }

  const requiredRatio = totalRequired === 0 ? 1 : earnedRequired / totalRequired
  const recommendedRatio = totalRecommended === 0 ? 1 : earnedRecommended / totalRecommended
  return roundScore(requiredRatio * 80 + recommendedRatio * 20)
}

export function buildNextBestActions(
  contributions: readonly ReadinessFieldContribution[],
  publishReady: boolean,
): readonly ReadinessAction[] {
  const missing = contributions.filter((c) => !c.present)
  const requiredMissing = missing.filter((c) => c.requiredWeight > 0)
  const recommendedMissing = missing.filter((c) => c.recommendedWeight > 0)

  const pool = requiredMissing.length > 0 ? requiredMissing : recommendedMissing

  const actions: ReadinessAction[] = pool.map((field) => {
    const impact = field.requiredWeight > 0
      ? field.requiredWeight
      : field.recommendedWeight
    const estimatedScore = simulateScoreAfterField(contributions, field.fieldId)
    const estimatedLevel = resolveReadinessLevel(
      estimatedScore,
      publishReady || field.requiredWeight > 0,
      requiredMissing.length > 1 ? requiredMissing.length - 1 : recommendedMissing.length,
    )
    const priority = field.requiredWeight > 0 ? 'required' as const : 'recommended' as const

    return {
      fieldId: field.fieldId,
      label: field.label,
      category: field.category,
      reasonCode: fieldIdToReasonCode(field.fieldId),
      impactPercent: impact,
      estimatedGain: impact,
      estimatedScore,
      estimatedReadinessLevel: estimatedLevel,
      priority,
    }
  })

  return actions.sort((a, b) => b.impactPercent - a.impactPercent)
}

export function getMissingRequiredFields(result: ReadinessResult): readonly string[] {
  return result.missingRequiredFields
}

export function getMissingRecommendedFields(result: ReadinessResult): readonly string[] {
  return result.missingRecommendedFields
}

export function getNextBestActions(result: ReadinessResult): readonly ReadinessAction[] {
  return result.nextBestActions
}

export function getBlockingReasons(result: ReadinessResult): ReadinessResult['blockingReasons'] {
  return result.blockingReasons
}
