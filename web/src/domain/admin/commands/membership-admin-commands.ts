/**
 * Demo/UAT membership & invitation commands — override persistence only.
 */

import {
  auditRepository,
  partyMembershipRepository,
} from '@/repositories/index.ts'
import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import type { PartyMembership } from '@pm-twin/party'

function requireMembershipManage(actorRole: string | undefined | null): string | null {
  return denyUnlessAuthorized(actorRole, 'admin.memberships.manage')
}

export type MembershipCommandResult = {
  readonly ok: boolean
  readonly membership?: PartyMembership
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
    entityType: 'party_membership',
    entityId,
    details,
  })
}

export function inviteMember(input: {
  readonly partyId: string
  readonly userId: string
  readonly role: string
  readonly actorId: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  const { partyId, userId, role, actorId } = input
  if (!partyId || !userId || !actorId) {
    return { ok: false, error: 'partyId, userId, and actorId are required' }
  }
  const existing = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === partyId && m.userId === userId)
  if (existing && existing.status !== 'suspended' && existing.status !== 'invited') {
    return { ok: false, error: 'Membership already exists' }
  }
  const membership: PartyMembership = {
    userId,
    partyId,
    membershipRole: role || 'member',
    status: 'invited',
    isPrimary: false,
    joinedAt: new Date().toISOString(),
  }
  partyMembershipRepository.upsertMembership(membership)
  appendAudit('InviteMember', actorId, `${partyId}:${userId}`, { role, status: 'invited' })
  return { ok: true, membership }
}

export function acceptInvitation(input: {
  readonly partyId: string
  readonly userId: string
  readonly actorId: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  const current = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.userId)
  if (!current) return { ok: false, error: 'Invitation not found' }
  if (current.status !== 'invited') {
    return { ok: false, error: 'Membership is not an invitation' }
  }
  const updated: PartyMembership = { ...current, status: 'active' }
  partyMembershipRepository.upsertMembership(updated)
  appendAudit('AcceptInvitation', input.actorId, `${input.partyId}:${input.userId}`, {})
  return { ok: true, membership: updated }
}

export function cancelInvitation(input: {
  readonly partyId: string
  readonly userId: string
  readonly actorId: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  const current = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.userId)
  if (!current) return { ok: false, error: 'Invitation not found' }
  if (current.status !== 'invited') {
    return { ok: false, error: 'Membership is not an invitation' }
  }
  partyMembershipRepository.suppressSynthesizedMembership(input.userId, input.partyId)
  appendAudit('CancelInvitation', input.actorId, `${input.partyId}:${input.userId}`, {})
  return { ok: true, membership: current }
}

export function changeMembershipRole(input: {
  readonly partyId: string
  readonly userId: string
  readonly role: string
  readonly actorId: string
  readonly reason: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  if (!input.reason.trim()) return { ok: false, error: 'Reason is required' }
  const current = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.userId)
  if (!current) return { ok: false, error: 'Membership not found' }
  const updated: PartyMembership = {
    ...current,
    membershipRole: input.role,
  }
  partyMembershipRepository.upsertMembership(updated)
  appendAudit('ChangeMembershipRole', input.actorId, `${input.partyId}:${input.userId}`, {
    previousRole: current.membershipRole,
    nextRole: input.role,
    reason: input.reason,
  })
  return { ok: true, membership: updated }
}

export function suspendMembership(input: {
  readonly partyId: string
  readonly userId: string
  readonly actorId: string
  readonly reason: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  if (!input.reason.trim()) return { ok: false, error: 'Reason is required' }
  const current = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.userId)
  if (!current) return { ok: false, error: 'Membership not found' }
  const updated: PartyMembership = { ...current, status: 'suspended' }
  partyMembershipRepository.upsertMembership(updated)
  appendAudit('SuspendMembership', input.actorId, `${input.partyId}:${input.userId}`, {
    reason: input.reason,
  })
  return { ok: true, membership: updated }
}

export function removeMember(input: {
  readonly partyId: string
  readonly userId: string
  readonly actorId: string
  readonly reason: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  if (!input.reason.trim()) return { ok: false, error: 'Reason is required' }
  const current = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.userId)
  if (!current) return { ok: false, error: 'Membership not found' }
  partyMembershipRepository.suppressSynthesizedMembership(input.userId, input.partyId)
  appendAudit('RemoveMember', input.actorId, `${input.partyId}:${input.userId}`, {
    reason: input.reason,
  })
  return { ok: true, membership: current }
}

export function transferOwnership(input: {
  readonly partyId: string
  readonly fromUserId: string
  readonly toUserId: string
  readonly actorId: string
  readonly reason: string
  readonly actorRole?: string | null
}): MembershipCommandResult {
  const denied = requireMembershipManage(input.actorRole)
  if (denied) return { ok: false, error: denied }
  if (!input.reason.trim()) return { ok: false, error: 'Reason is required' }
  const from = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.fromUserId)
  const to = partyMembershipRepository
    .getAll()
    .find((m) => m.partyId === input.partyId && m.userId === input.toUserId)
  if (!from || !to) return { ok: false, error: 'Both memberships required' }
  partyMembershipRepository.upsertMembership({
    ...from,
    membershipRole: 'admin',
    isPrimary: false,
  })
  const updated = partyMembershipRepository.upsertMembership({
    ...to,
    membershipRole: 'owner',
    isPrimary: true,
    status: 'active',
  })
  appendAudit('TransferOwnership', input.actorId, input.partyId, {
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    reason: input.reason,
  })
  return { ok: true, membership: updated }
}
