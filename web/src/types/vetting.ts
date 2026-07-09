export type VettingMetadata = {
  reason?: string
  requestedItems?: string[]
  dueDate?: string
  reviewerId?: string
  reviewedAt?: string
  lastResubmittedAt?: string
}

export const VETTING_QUEUE_STATUSES = ['pending', 'clarification_requested'] as const

export type VettingQueueStatus = (typeof VETTING_QUEUE_STATUSES)[number]

export const VETTING_RESTRICTED_USER_STATUSES = [
  'pending',
  'clarification_requested',
  'rejected',
] as const

export type VettingRestrictedUserStatus = (typeof VETTING_RESTRICTED_USER_STATUSES)[number]
