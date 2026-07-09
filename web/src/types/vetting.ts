export type VettingSlaStatus = 'on_track' | 'at_risk' | 'overdue'

export type VettingMetadata = {
  reason?: string
  requestedItems?: string[]
  /** Alias for review notes in admin governance UI. */
  reviewNotes?: string
  /** Alias for requestedItems in admin governance UI. */
  requestedChanges?: string[]
  dueDate?: string
  escalationAt?: string
  slaStatus?: VettingSlaStatus
  reviewerId?: string
  reviewedBy?: string
  reviewedAt?: string
  lastResubmittedAt?: string
  reviewProgress?: 'not_started' | 'in_review' | 'changes_requested' | 'approved'
  changesResolved?: boolean
}

export const VETTING_QUEUE_STATUSES = [
  'pending_vetting',
  'pending',
  'clarification_requested',
] as const

export type VettingQueueStatus = (typeof VETTING_QUEUE_STATUSES)[number]

export const VETTING_RESTRICTED_USER_STATUSES = [
  'pending_vetting',
  'pending',
  'clarification_requested',
  'rejected',
] as const

export type VettingRestrictedUserStatus = (typeof VETTING_RESTRICTED_USER_STATUSES)[number]
