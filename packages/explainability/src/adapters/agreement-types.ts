export type AgreementStatus =
  | 'draft'
  | 'review'
  | 'signing'
  | 'executing'
  | 'completed'
  | 'cancelled'

export type AgreementDecisionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'not_required'

export type AgreementAwardStatus =
  | 'pending'
  | 'awarded'
  | 'not_applicable'

export type AgreementStageBlocker = {
  readonly code: string
  readonly label: string
  readonly resolutionHint?: string
}

export type AgreementStageTransition = {
  readonly stage: AgreementStatus
  readonly timestamp: string
}

export type AgreementTimelineEventSnapshot = {
  readonly type: string
  readonly title: string
  readonly description?: string
  readonly timestamp: string
  readonly status?: string
}

/**
 * Minimal snapshot of commercial agreement / deal state — decoupled from web domain types.
 * Web callers map `CommercialAgreementDetailReadModel` into this shape (E7).
 */
export type AgreementExplainabilitySnapshot = {
  readonly entityId: string
  readonly status: AgreementStatus
  readonly decisionStatus?: AgreementDecisionStatus
  readonly awardStatus?: AgreementAwardStatus
  readonly linkedNegotiationId?: string | null
  readonly linkedContractId?: string | null
  readonly pendingSignatures?: number
  readonly totalSignatures?: number
  readonly canCreateContract?: boolean
  readonly stageBlockers?: readonly AgreementStageBlocker[]
  readonly createdAt?: string
  readonly stageTransitions?: readonly AgreementStageTransition[]
  readonly timelineEvents?: readonly AgreementTimelineEventSnapshot[]
  readonly evaluatedAt?: string
  readonly locale?: string
}
