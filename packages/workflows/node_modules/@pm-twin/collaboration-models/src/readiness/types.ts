import type { FieldGroupId } from '../knowledge/types.ts'

export const READINESS_ENGINE_VERSION = '1.0.0' as const

export type ReadinessCategory = FieldGroupId

export type ReadinessLevel = 'draft' | 'basic' | 'partial' | 'ready' | 'excellent'

export type ReadinessHealth = 'excellent' | 'good' | 'warning' | 'critical'

export type ExplainabilitySeverity = 'info' | 'warning' | 'critical'

export type ReadinessReasonCode =
  | `READINESS_MISSING_${string}`
  | `READINESS_COMPLETE_${string}`
  | 'READINESS_PUBLISH_BLOCKED'
  | 'READINESS_SCORE_SUMMARY'
  | 'READINESS_RECOMMENDED_GAPS'

export type ReadinessFieldContribution = {
  readonly fieldId: string
  readonly label: string
  readonly category: ReadinessCategory
  readonly present: boolean
  readonly requiredWeight: number
  readonly recommendedWeight: number
  readonly earnedRequired: number
  readonly earnedRecommended: number
  readonly scope: 'core' | 'subModel' | 'exchange'
}

export type ReadinessExplanation = {
  readonly code: ReadinessReasonCode
  readonly message: string
  readonly severity: ExplainabilitySeverity
  readonly category?: ReadinessCategory
  readonly fieldId?: string
}

export type ReadinessBlockingReason = {
  readonly code: ReadinessReasonCode
  readonly message: string
  readonly severity: 'critical'
  readonly fieldId?: string
  readonly category?: ReadinessCategory
}

export type ReadinessAction = {
  readonly fieldId: string
  readonly label: string
  readonly category: ReadinessCategory
  readonly reasonCode: ReadinessReasonCode
  readonly impactPercent: number
  readonly estimatedGain: number
  readonly estimatedScore: number
  readonly estimatedReadinessLevel: ReadinessLevel
  readonly priority: 'required' | 'recommended'
}

export type ReadinessSnapshot = {
  readonly generatedAt: string
  readonly knowledgeVersion: number
  readonly formVersion: string
  readonly engineVersion: string
}

export type ReadinessResult = {
  readonly score: number
  readonly requiredScore: number
  readonly recommendedScore: number
  readonly completedRequiredWeight: number
  readonly completedRecommendedWeight: number
  readonly completedFields: readonly string[]
  readonly missingRequiredFields: readonly string[]
  readonly missingRecommendedFields: readonly string[]
  readonly completedRequiredFields: readonly string[]
  readonly completedRecommendedFields: readonly string[]
  readonly fieldContributions: readonly ReadinessFieldContribution[]
  readonly explanations: readonly ReadinessExplanation[]
  readonly nextBestActions: readonly ReadinessAction[]
  readonly blockingReasons: readonly ReadinessBlockingReason[]
  readonly publishReady: boolean
  readonly readinessLevel: ReadinessLevel
  readonly health: ReadinessHealth
  readonly snapshot: ReadinessSnapshot
  /** Backward-compatible message list for adapters. */
  readonly explanation: readonly string[]
}

export type ReadinessEvaluateInput = {
  readonly subModelKey?: string
  readonly formState: Readonly<Record<string, unknown>>
  readonly contextValues?: Readonly<Record<string, unknown>>
}

export type ReadinessSummary = {
  readonly score: number
  readonly requiredScore: number
  readonly recommendedScore: number
  readonly readinessLevel: ReadinessLevel
  readonly health: ReadinessHealth
  readonly publishReady: boolean
  readonly missingRequiredCount: number
  readonly missingRecommendedCount: number
  readonly remainingRequired: readonly string[]
  readonly remainingRecommended: readonly string[]
  readonly byCategory: Readonly<Record<ReadinessCategory, { present: number; total: number }>>
}

export type ReadinessBreakdownEntry = {
  readonly fieldId: string
  readonly label: string
  readonly category: ReadinessCategory
  readonly present: boolean
  readonly earnedRequired: number
  readonly earnedRecommended: number
  readonly maxRequired: number
  readonly maxRecommended: number
}

export type ReadinessBreakdown = {
  readonly entries: readonly ReadinessBreakdownEntry[]
  readonly byCategory: Readonly<Record<ReadinessCategory, { earned: number; max: number }>>
}

export type ReadinessTimelinePoint = {
  readonly score: number
  readonly fieldId: string
  readonly label: string
  readonly reasonCode: ReadinessReasonCode
}

export type OpportunityCoreReadinessField = {
  readonly id: string
  readonly label: string
  readonly category: ReadinessCategory
  readonly priority: 'required' | 'recommended'
  readonly weight: number
  readonly requiredWeight: number
  readonly recommendedWeight: number
}

export type OpportunityCoreReadinessDefinition = {
  readonly requiredFields: readonly string[]
  readonly optionalFields: readonly string[]
  readonly minimumPublishFields: readonly string[]
  readonly fields: readonly OpportunityCoreReadinessField[]
}
