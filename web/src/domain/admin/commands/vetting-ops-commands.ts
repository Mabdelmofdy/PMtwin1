/**
 * Remaining vetting admin commands for Demo/UAT compliance workspace.
 */

import { executeApproveVetting, executeRejectVetting, executeRequestVettingClarification, executeReviewVettingDocument } from '@/domain/admin/commands/vetting-admin-commands.ts'
import { auditRepository, userRepository } from '@/repositories/index.ts'
import type { PlatformUser } from '@/types/domain.ts'

export {
  executeApproveVetting,
  executeRejectVetting,
  executeRequestVettingClarification,
  executeReviewVettingDocument,
}

export type VettingOpsResult = {
  readonly ok: boolean
  readonly user?: PlatformUser
  readonly error?: string
}

export function executeAssignVettingReviewer(
  userId: string,
  reviewerId: string,
  actorId: string,
): VettingOpsResult {
  const existing = userRepository.getById(userId)
  if (!existing) return { ok: false, error: 'User not found' }
  const profile = existing.profile ?? {}
  const vetting = {
    ...(typeof profile === 'object' && profile && 'vetting' in profile
      ? (profile as { vetting?: Record<string, unknown> }).vetting
      : {}),
    assignedReviewerId: reviewerId,
    assignedAt: new Date().toISOString(),
  }
  const updated = userRepository.update(userId, {
    profile: {
      ...((existing.profile ?? {}) as Record<string, unknown>),
      vetting,
    } as PlatformUser['profile'],
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return { ok: false, error: 'Assign failed' }
  auditRepository.append({
    action: 'AssignVettingReviewer',
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: { reviewerId },
  })
  return { ok: true, user: updated }
}

export function executeEscalateVettingCase(
  userId: string,
  actorId: string,
  reason: string,
): VettingOpsResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  const existing = userRepository.getById(userId)
  if (!existing) return { ok: false, error: 'User not found' }
  auditRepository.append({
    action: 'EscalateVettingCase',
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: { reason },
  })
  return { ok: true, user: existing }
}

export function executeSuspendForExpiredCompliance(
  userId: string,
  actorId: string,
  reason: string,
): VettingOpsResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  const updated = userRepository.update(userId, {
    status: 'suspended',
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return { ok: false, error: 'Suspend failed' }
  auditRepository.append({
    action: 'SuspendForExpiredCompliance',
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: { reason },
  })
  return { ok: true, user: updated }
}

export function executeRestoreAfterComplianceReview(
  userId: string,
  actorId: string,
  reason: string,
): VettingOpsResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  const updated = userRepository.update(userId, {
    status: 'active',
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return { ok: false, error: 'Restore failed' }
  auditRepository.append({
    action: 'RestoreAfterComplianceReview',
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: { reason },
  })
  return { ok: true, user: updated }
}
