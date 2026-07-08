import type { ReadinessFieldContribution, ReadinessTimelinePoint } from '../types.ts'
import { fieldIdToReasonCode } from '../field-presence.ts'

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

export function buildReadinessTimeline(
  contributions: readonly ReadinessFieldContribution[],
): readonly ReadinessTimelinePoint[] {
  const points: ReadinessTimelinePoint[] = [
    {
      score: 0,
      fieldId: '__start__',
      label: 'Start',
      reasonCode: 'READINESS_SCORE_SUMMARY',
    },
  ]

  let earnedRequired = 0
  let earnedRecommended = 0
  let totalRequired = 0
  let totalRecommended = 0

  for (const field of contributions) {
    totalRequired += field.requiredWeight
    totalRecommended += field.recommendedWeight
  }

  const ordered = [...contributions].sort((a, b) => {
    const weightA = a.requiredWeight + a.recommendedWeight
    const weightB = b.requiredWeight + b.recommendedWeight
    return weightB - weightA
  })

  for (const field of ordered) {
    if (!field.present) continue
    earnedRequired += field.requiredWeight
    earnedRecommended += field.recommendedWeight
    const requiredRatio = totalRequired === 0 ? 1 : earnedRequired / totalRequired
    const recommendedRatio = totalRecommended === 0 ? 1 : earnedRecommended / totalRecommended
    const score = roundScore(requiredRatio * 80 + recommendedRatio * 20)
    points.push({
      score,
      fieldId: field.fieldId,
      label: field.label,
      reasonCode: fieldIdToReasonCode(field.fieldId),
    })
  }

  if (points.length === 1 && contributions.some((c) => c.present)) {
    const requiredRatio = totalRequired === 0 ? 1 : earnedRequired / totalRequired
    const recommendedRatio = totalRecommended === 0 ? 1 : earnedRecommended / totalRecommended
    points.push({
      score: roundScore(requiredRatio * 80 + recommendedRatio * 20),
      fieldId: '__current__',
      label: 'Current',
      reasonCode: 'READINESS_SCORE_SUMMARY',
    })
  }

  return points
}
