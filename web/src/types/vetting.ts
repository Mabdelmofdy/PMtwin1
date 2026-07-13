export type VettingSlaStatus = 'on_track' | 'at_risk' | 'overdue'

/** Canonical enterprise vetting case status (source of truth for workflow). */
export const VETTING_CASE_STATUSES = [
  'draft',
  'submitted',
  'pending_review',
  'clarification_requested',
  'resubmitted',
  'approved',
  'rejected',
  'suspended',
] as const

export type VettingCaseStatus = (typeof VETTING_CASE_STATUSES)[number]

export type VettingMetadata = {
  /** Canonical case status — prefer this over dual user.status / reviewProgress. */
  caseStatus?: VettingCaseStatus
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
  submittedAt?: string
  assignedReviewerId?: string
  emailVerified?: boolean
  reviewProgress?: 'not_started' | 'in_review' | 'changes_requested' | 'approved'
  changesResolved?: boolean
}

/** Map canonical case status → platform user/party status used by auth gates. */
export function userStatusForVettingCase(caseStatus: VettingCaseStatus): string {
  switch (caseStatus) {
    case 'approved':
      return 'active'
    case 'rejected':
      return 'rejected'
    case 'suspended':
      return 'suspended'
    case 'clarification_requested':
      return 'clarification_requested'
    default:
      return 'pending_vetting'
  }
}

export function resolveVettingCaseStatus(
  vetting: VettingMetadata | undefined,
  userStatus?: string,
): VettingCaseStatus {
  if (vetting?.caseStatus && (VETTING_CASE_STATUSES as readonly string[]).includes(vetting.caseStatus)) {
    return vetting.caseStatus
  }
  if (vetting?.reviewProgress === 'approved' || userStatus === 'active') return 'approved'
  if (userStatus === 'rejected') return 'rejected'
  if (userStatus === 'suspended') return 'suspended'
  if (
    vetting?.reviewProgress === 'changes_requested' ||
    userStatus === 'clarification_requested'
  ) {
    return 'clarification_requested'
  }
  if (vetting?.lastResubmittedAt) return 'resubmitted'
  if (vetting?.reviewProgress === 'in_review' || vetting?.submittedAt) return 'pending_review'
  if (vetting?.submittedAt) return 'submitted'
  return 'draft'
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
