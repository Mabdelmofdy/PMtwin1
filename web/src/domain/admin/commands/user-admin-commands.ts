/**
 * Demo/UAT user admin commands — LocalStorage repo mutations + audit append.
 * No backend.
 */

import { auditRepository, userRepository } from '@/repositories/index.ts'
import { recordFailedLocalCommand } from '@/domain/admin/diagnostics/failed-command-log.ts'
import type { PlatformUser } from '@/types/domain.ts'

export type UserAdminCommandResult = {
  readonly ok: boolean
  readonly user?: PlatformUser
  readonly error?: string
}

function mutateStatus(
  userId: string,
  nextStatus: string,
  actorId: string,
  action: string,
  reason?: string,
): UserAdminCommandResult {
  const existing = userRepository.getById(userId)
  if (!existing) {
    return { ok: false, error: 'User not found' }
  }
  if (!reason?.trim() && action !== 'UnlockUser') {
    // Unlock may omit reason; other sensitive actions require reason when flagged
  }
  const updated = userRepository.update(userId, {
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  })
  if (!updated) {
    recordFailedLocalCommand({
      commandType: action,
      message: 'Failed to update user',
      aggregateId: userId,
      actorId,
    })
    return { ok: false, error: 'Failed to update user' }
  }
  auditRepository.append({
    action,
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: {
      previousStatus: existing.status,
      nextStatus,
      reason: reason ?? null,
    },
  })
  return { ok: true, user: updated }
}

export function activateUser(
  userId: string,
  actorId: string,
  reason: string,
): UserAdminCommandResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  return mutateStatus(userId, 'active', actorId, 'ActivateUser', reason)
}

export function suspendUser(
  userId: string,
  actorId: string,
  reason: string,
): UserAdminCommandResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  return mutateStatus(userId, 'suspended', actorId, 'SuspendUser', reason)
}

export function unsuspendUser(
  userId: string,
  actorId: string,
  reason: string,
): UserAdminCommandResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  return mutateStatus(userId, 'active', actorId, 'UnsuspendUser', reason)
}

export function lockUser(
  userId: string,
  actorId: string,
  reason: string,
): UserAdminCommandResult {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  return mutateStatus(userId, 'locked', actorId, 'LockUser', reason)
}

export function unlockUser(
  userId: string,
  actorId: string,
  reason?: string,
): UserAdminCommandResult {
  return mutateStatus(userId, 'active', actorId, 'UnlockUser', reason)
}

export function addUserInternalNote(
  userId: string,
  actorId: string,
  note: string,
): UserAdminCommandResult {
  const existing = userRepository.getById(userId)
  if (!existing) return { ok: false, error: 'User not found' }
  if (!note.trim()) return { ok: false, error: 'Note is required' }
  auditRepository.append({
    action: 'AddUserInternalNote',
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: { note: note.trim() },
  })
  return { ok: true, user: existing }
}

export function assignUserRole(
  userId: string,
  actorId: string,
  role: string,
  reason: string,
): UserAdminCommandResult {
  const existing = userRepository.getById(userId)
  if (!existing) return { ok: false, error: 'User not found' }
  if (!role.trim()) return { ok: false, error: 'Role is required' }
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  const updated = userRepository.update(userId, {
    role: role.trim(),
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return { ok: false, error: 'Failed to update user' }
  auditRepository.append({
    action: 'AssignUserRole',
    userId: actorId,
    actorType: 'admin',
    entityType: 'user',
    entityId: userId,
    details: {
      previousRole: existing.role,
      nextRole: role.trim(),
      reason,
    },
  })
  return { ok: true, user: updated }
}
