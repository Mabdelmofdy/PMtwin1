import type { PartyDocument } from '@/types/party-document.ts'

export type VettingReadinessStatus = 'incomplete' | 'needs_review' | 'ready_for_matching'

export type VettingReviewProgress =
  | 'not_started'
  | 'in_review'
  | 'changes_requested'
  | 'approved'

export type VettingReadinessInput = {
  readonly accountStatus?: string | null
  readonly reviewProgress?: VettingReviewProgress
  readonly changesResolved?: boolean
  readonly documents?: readonly PartyDocument[]
}

export type VettingReadinessResult = {
  readonly score: number
  readonly status: VettingReadinessStatus
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly recommendations: readonly string[]
  readonly documentsProgress: {
    readonly approvedRequired: number
    readonly totalRequired: number
  }
}

