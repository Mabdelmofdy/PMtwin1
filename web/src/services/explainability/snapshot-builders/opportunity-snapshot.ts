import type { OpportunityReadinessSnapshot } from '@pm-twin/explainability'
import type { ReadinessResult } from '@pm-twin/collaboration-models'

export type OpportunitySnapshotOptions = {
  readonly subModelKey?: string
  readonly locale?: string
  readonly createdAt?: string
}

export function buildOpportunityReadinessSnapshot(
  entityId: string,
  canonical: ReadinessResult,
  options?: OpportunitySnapshotOptions,
): OpportunityReadinessSnapshot {
  return {
    entityId,
    subModelKey: options?.subModelKey,
    score: canonical.score,
    requiredScore: canonical.requiredScore,
    recommendedScore: canonical.recommendedScore,
    publishReady: canonical.publishReady,
    readinessLevel: canonical.readinessLevel,
    health: canonical.health,
    missingRequiredFields: canonical.missingRequiredFields,
    missingRecommendedFields: canonical.missingRecommendedFields,
    completedRequiredFields: canonical.completedRequiredFields,
    completedRecommendedFields: canonical.completedRecommendedFields,
    fieldContributions: canonical.fieldContributions as OpportunityReadinessSnapshot['fieldContributions'],
    explanations: canonical.explanations as OpportunityReadinessSnapshot['explanations'],
    nextBestActions: canonical.nextBestActions as OpportunityReadinessSnapshot['nextBestActions'],
    blockingReasons: canonical.blockingReasons as OpportunityReadinessSnapshot['blockingReasons'],
    snapshot: canonical.snapshot,
    createdAt: options?.createdAt,
    evaluatedAt: canonical.snapshot.generatedAt,
    locale: options?.locale ?? 'en-SA',
  }
}
