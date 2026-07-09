export type ContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'active'
  | 'completed'
  | 'terminated'

export type ContractPartySignatureSnapshot = {
  readonly userId: string
  readonly role?: string
  readonly signedAt?: string | null
}

export type ContractMilestoneSnapshot = {
  readonly id?: string
  readonly title: string
  readonly dueDate?: string
  readonly status?: string
}

export type ContractTimelineEventSnapshot = {
  readonly type: string
  readonly title: string
  readonly description?: string
  readonly timestamp: string
  readonly status?: string
}

/**
 * Minimal snapshot of contract state — decoupled from web domain types.
 * Web callers map `ContractDetailReadModel` into this shape (E7).
 */
export type ContractExplainabilitySnapshot = {
  readonly entityId: string
  readonly status: ContractStatus
  readonly parties?: readonly ContractPartySignatureSnapshot[]
  readonly partiesSigned?: number
  readonly totalParties?: number
  readonly canSign?: boolean
  readonly canComplete?: boolean
  readonly canTerminate?: boolean
  readonly terminationReason?: string | null
  readonly completionReason?: string | null
  readonly milestones?: readonly ContractMilestoneSnapshot[]
  readonly createdAt?: string
  readonly activatedAt?: string
  readonly completedAt?: string
  readonly terminatedAt?: string
  readonly timelineEvents?: readonly ContractTimelineEventSnapshot[]
  readonly evaluatedAt?: string
  readonly locale?: string
}
