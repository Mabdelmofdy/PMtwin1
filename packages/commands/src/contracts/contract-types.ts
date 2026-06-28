/** Contract party DTO — transport shape only (zero-dependency). */
export interface ContractParty {
  readonly userId: string
  readonly role: string
  readonly opportunityId?: string
  readonly participantStatus?: string
  readonly signedAt?: string | null
}

/** Milestone snapshot captured at contract creation (immutable transport copy). */
export interface ContractMilestoneSnapshot {
  readonly id?: string
  readonly title: string
  readonly description?: string
  readonly dueDate?: string
  readonly status?: string
}
