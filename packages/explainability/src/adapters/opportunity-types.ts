export type OpportunityReadinessLevel =
  | 'draft'
  | 'basic'
  | 'partial'
  | 'ready'
  | 'excellent'

export type OpportunityReadinessHealth =
  | 'excellent'
  | 'good'
  | 'warning'
  | 'critical'

export type OpportunityExplainabilitySeverity = 'info' | 'warning' | 'critical'

export type OpportunityReadinessCategory =
  | 'general'
  | 'requirements'
  | 'location'
  | 'timeline'
  | 'commercial'
  | 'technical'
  | 'financial'
  | 'legal'

export type OpportunityReadinessReasonCode =
  | `READINESS_MISSING_${string}`
  | `READINESS_COMPLETE_${string}`
  | 'READINESS_PUBLISH_BLOCKED'
  | 'READINESS_SCORE_SUMMARY'
  | 'READINESS_RECOMMENDED_GAPS'

export type OpportunityFieldContribution = {
  readonly fieldId: string
  readonly label: string
  readonly category: OpportunityReadinessCategory
  readonly present: boolean
  readonly requiredWeight: number
  readonly recommendedWeight: number
  readonly earnedRequired: number
  readonly earnedRecommended: number
  readonly scope: 'core' | 'subModel' | 'exchange'
}

export type OpportunityExplanation = {
  readonly code: OpportunityReadinessReasonCode
  readonly message: string
  readonly severity: OpportunityExplainabilitySeverity
  readonly category?: OpportunityReadinessCategory
  readonly fieldId?: string
}

export type OpportunityBlockingReason = {
  readonly code: OpportunityReadinessReasonCode
  readonly message: string
  readonly severity: 'critical'
  readonly fieldId?: string
  readonly category?: OpportunityReadinessCategory
}

export type OpportunityAction = {
  readonly fieldId: string
  readonly label: string
  readonly category: OpportunityReadinessCategory
  readonly reasonCode: OpportunityReadinessReasonCode
  readonly impactPercent: number
  readonly estimatedGain: number
  readonly estimatedScore: number
  readonly estimatedReadinessLevel: OpportunityReadinessLevel
  readonly priority: 'required' | 'recommended'
}

export type OpportunityReadinessSnapshotMeta = {
  readonly generatedAt: string
  readonly knowledgeVersion: number
  readonly formVersion: string
  readonly engineVersion: string
}

/**
 * Minimal snapshot of opportunity readiness evaluation — decoupled from collaboration-models types.
 * Web callers map `evaluateReadiness()` / `ReadinessResult` into this shape.
 */
export type OpportunityReadinessSnapshot = {
  readonly entityId: string
  readonly subModelKey?: string
  readonly score: number
  readonly requiredScore: number
  readonly recommendedScore: number
  readonly publishReady: boolean
  readonly readinessLevel: OpportunityReadinessLevel
  readonly health: OpportunityReadinessHealth
  readonly missingRequiredFields: readonly string[]
  readonly missingRecommendedFields: readonly string[]
  readonly completedRequiredFields?: readonly string[]
  readonly completedRecommendedFields?: readonly string[]
  readonly fieldContributions: readonly OpportunityFieldContribution[]
  readonly explanations: readonly OpportunityExplanation[]
  readonly nextBestActions: readonly OpportunityAction[]
  readonly blockingReasons: readonly OpportunityBlockingReason[]
  readonly snapshot: OpportunityReadinessSnapshotMeta
  readonly evaluatedAt?: string
  readonly locale?: string
  readonly createdAt?: string
}
