import type { VettingReadinessSnapshot } from '@pm-twin/explainability'
import type {
  VettingReadinessInput,
  VettingReadinessResult,
} from '@/domain/vetting-readiness/types.ts'

export type VettingSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
  readonly createdAt?: string
  readonly reviewStartedAt?: string
  readonly changesRequestedAt?: string
  readonly resubmittedAt?: string
  readonly reviewApprovedAt?: string
}

export function buildVettingReadinessSnapshot(
  entityId: string,
  result: VettingReadinessResult,
  input: VettingReadinessInput,
  options?: VettingSnapshotOptions,
): VettingReadinessSnapshot {
  return {
    entityId,
    score: result.score,
    status: result.status,
    missingRequired: result.missingRequired,
    missingRecommended: result.missingRecommended,
    recommendations: result.recommendations,
    documentsProgress: result.documentsProgress,
    reviewProgress: input.reviewProgress ?? 'not_started',
    changesResolved: input.changesResolved,
    accountStatus: input.accountStatus,
    documents: (input.documents ?? []).map((document) => ({
      type: document.documentType,
      status: document.status,
      uploadedAt: document.uploadedAt,
    })),
    createdAt: options?.createdAt,
    evaluatedAt: options?.evaluatedAt,
    locale: options?.locale ?? 'en-SA',
    reviewStartedAt: options?.reviewStartedAt,
    changesRequestedAt: options?.changesRequestedAt,
    resubmittedAt: options?.resubmittedAt,
    reviewApprovedAt: options?.reviewApprovedAt,
  }
}
