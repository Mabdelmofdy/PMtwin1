import type { FieldGroupId } from '../../knowledge/types.ts'
import type {
  ReadinessBreakdown,
  ReadinessResult,
  ReadinessSummary,
} from '../types.ts'
import { FIELD_GROUP_IDS } from '../../knowledge/types.ts'

function emptyCategoryMap(): Record<FieldGroupId, { present: number; total: number }> {
  const map = {} as Record<FieldGroupId, { present: number; total: number }>
  for (const id of FIELD_GROUP_IDS) {
    map[id] = { present: 0, total: 0 }
  }
  return map
}

export function buildReadinessSummary(result: ReadinessResult): ReadinessSummary {
  const byCategory = emptyCategoryMap()

  for (const field of result.fieldContributions) {
    const bucket = byCategory[field.category]
    bucket.total += 1
    if (field.present) bucket.present += 1
  }

  return {
    score: result.score,
    requiredScore: result.requiredScore,
    recommendedScore: result.recommendedScore,
    readinessLevel: result.readinessLevel,
    health: result.health,
    publishReady: result.publishReady,
    missingRequiredCount: result.missingRequiredFields.length,
    missingRecommendedCount: result.missingRecommendedFields.length,
    remainingRequired: result.missingRequiredFields,
    remainingRecommended: result.missingRecommendedFields,
    byCategory,
  }
}

export function buildReadinessBreakdown(result: ReadinessResult): ReadinessBreakdown {
  const byCategory = {} as Record<FieldGroupId, { earned: number; max: number }>
  for (const id of FIELD_GROUP_IDS) {
    byCategory[id] = { earned: 0, max: 0 }
  }

  const entries = result.fieldContributions.map((field) => {
    const maxRequired = field.requiredWeight
    const maxRecommended = field.recommendedWeight
    byCategory[field.category].earned += field.earnedRequired + field.earnedRecommended
    byCategory[field.category].max += maxRequired + maxRecommended
    return {
      fieldId: field.fieldId,
      label: field.label,
      category: field.category,
      present: field.present,
      earnedRequired: field.earnedRequired,
      earnedRecommended: field.earnedRecommended,
      maxRequired,
      maxRecommended,
    }
  })

  return { entries, byCategory }
}
