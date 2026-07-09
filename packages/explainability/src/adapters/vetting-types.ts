export type VettingReadinessStatus =
  | 'incomplete'
  | 'needs_review'
  | 'ready_for_matching'

export type VettingReviewProgress =
  | 'not_started'
  | 'in_review'
  | 'changes_requested'
  | 'approved'

export type VettingDocumentStatus =
  | 'approved'
  | 'pending_review'
  | 'rejected'
  | 'expired'
  | 'replacement_requested'

export type VettingDocumentEntry = {
  readonly type: string
  readonly status?: VettingDocumentStatus
  readonly uploadedAt?: string
}

/**
 * Minimal snapshot of vetting readiness evaluation — decoupled from web domain types.
 * Web callers map `evaluateVettingReadiness()` output + document/review metadata into this shape.
 */
export type VettingReadinessSnapshot = {
  readonly entityId: string
  readonly score: number
  readonly status: VettingReadinessStatus
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly recommendations: readonly string[]
  readonly documentsProgress: {
    readonly approvedRequired: number
    readonly totalRequired: number
  }
  readonly reviewProgress: VettingReviewProgress
  readonly changesResolved?: boolean
  readonly accountStatus?: string | null
  readonly documents?: readonly VettingDocumentEntry[]
  readonly createdAt?: string
  readonly evaluatedAt?: string
  readonly locale?: string
  readonly reviewStartedAt?: string
  readonly changesRequestedAt?: string
  readonly resubmittedAt?: string
  readonly reviewApprovedAt?: string
}
