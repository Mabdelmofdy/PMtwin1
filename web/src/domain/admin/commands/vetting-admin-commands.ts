/**
 * Vetting admin commands — wraps vettingService + audit for Admin UI.
 * Thin path for a future command gateway.
 */

import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import { vettingService } from '@/lib/vetting-service.ts'
import { auditRepository } from '@/repositories/index.ts'
import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument } from '@/types/party-document.ts'
import type { RequestVettingChangesInput } from '@/lib/vetting-service.ts'

function requireVettingManage(actorRole: string | undefined | null): string | null {
  return denyUnlessAuthorized(actorRole, 'admin.vetting.manage')
}

export type VettingAdminCommandResult<T = PlatformUser | undefined> = {
  readonly ok: boolean
  readonly data?: T
  readonly error?: string
}

function appendAudit(
  action: string,
  actorId: string,
  entityId: string,
  details?: Record<string, unknown>,
): void {
  auditRepository.append({
    action,
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId,
    details,
  })
}

export function executeApproveVetting(
  userId: string,
  partyId: string,
  reviewerId: string,
  actorRole?: string | null,
): VettingAdminCommandResult {
  const denied = requireVettingManage(actorRole)
  if (denied) return { ok: false, error: denied }
  if (!userId || !partyId || !reviewerId) {
    return { ok: false, error: 'userId, partyId, and reviewerId are required' }
  }
  const data = vettingService.approve(userId, partyId, reviewerId)
  if (!data) return { ok: false, error: 'Approve vetting failed' }
  appendAudit('ApproveVetting', reviewerId, userId, { partyId })
  return { ok: true, data }
}

export function executeRejectVetting(
  userId: string,
  partyId: string,
  reviewerId: string,
  reason?: string,
  actorRole?: string | null,
): VettingAdminCommandResult {
  const denied = requireVettingManage(actorRole)
  if (denied) return { ok: false, error: denied }
  if (!userId || !partyId || !reviewerId) {
    return { ok: false, error: 'userId, partyId, and reviewerId are required' }
  }
  const data = vettingService.reject(userId, partyId, reviewerId, reason)
  if (!data) return { ok: false, error: 'Reject vetting failed' }
  appendAudit('RejectVetting', reviewerId, userId, { partyId, reason: reason ?? null })
  return { ok: true, data }
}

export function executeRequestVettingClarification(
  input: RequestVettingChangesInput & { readonly actorRole?: string | null },
): VettingAdminCommandResult {
  const denied = requireVettingManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  if (!input.userId || !input.partyId || !input.reviewerId) {
    return { ok: false, error: 'userId, partyId, and reviewerId are required' }
  }
  if (!input.reason?.trim() || !input.requestedItems?.length) {
    return { ok: false, error: 'Reason and requested items are required' }
  }
  const data = vettingService.requestChanges(input)
  if (!data) return { ok: false, error: 'Request clarification failed' }
  appendAudit('RequestVettingClarification', input.reviewerId, input.userId, {
    partyId: input.partyId,
    requestedItems: input.requestedItems,
    reason: input.reason,
  })
  return { ok: true, data }
}

export function executeReviewVettingDocument(
  documentId: string,
  input: {
    readonly reviewerId: string
    readonly decision: 'approved' | 'rejected'
    readonly notes?: string
    readonly actorRole?: string | null
  },
): VettingAdminCommandResult<PartyDocument | undefined> {
  const denied = requireVettingManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  if (!documentId || !input.reviewerId) {
    return { ok: false, error: 'documentId and reviewerId are required' }
  }
  const data = vettingService.reviewPartyDocument(documentId, {
    reviewedBy: input.reviewerId,
    status: input.decision,
    reviewNotes: input.notes,
  })
  if (!data) return { ok: false, error: 'Document review failed' }
  appendAudit('ReviewVettingDocument', input.reviewerId, documentId, {
    decision: input.decision,
    notes: input.notes ?? null,
  })
  return { ok: true, data }
}

export function executeSuspendVetting(
  userId: string,
  partyId: string,
  reviewerId: string,
  reason?: string,
  actorRole?: string | null,
): VettingAdminCommandResult {
  const denied = requireVettingManage(actorRole)
  if (denied) return { ok: false, error: denied }
  if (!userId || !partyId || !reviewerId) {
    return { ok: false, error: 'userId, partyId, and reviewerId are required' }
  }
  const data = vettingService.suspend(userId, partyId, reviewerId, reason)
  if (!data) return { ok: false, error: 'Suspend vetting failed' }
  appendAudit('SuspendVetting', reviewerId, userId, { partyId, reason: reason ?? null })
  return { ok: true, data }
}

export function executeReassignVetting(
  userId: string,
  reviewerId: string,
  assignedReviewerId: string,
  actorRole?: string | null,
): VettingAdminCommandResult {
  const denied = requireVettingManage(actorRole)
  if (denied) return { ok: false, error: denied }
  const data = vettingService.reassign(userId, reviewerId, assignedReviewerId)
  if (!data) return { ok: false, error: 'Reassign failed' }
  appendAudit('ReassignVetting', reviewerId, userId, { assignedReviewerId })
  return { ok: true, data }
}

export function executeSubmitVetting(
  userId: string,
  partyId: string,
  actorRole?: string | null,
): VettingAdminCommandResult {
  // Submit is a user action; admin capability not required when actor is self.
  void actorRole
  const data = vettingService.submitForReview(userId, partyId)
  if (!data) return { ok: false, error: 'Submit for review failed' }
  appendAudit('SubmitVetting', userId, userId, { partyId })
  return { ok: true, data }
}
