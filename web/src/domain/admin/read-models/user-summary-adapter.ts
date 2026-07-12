/**
 * Map PlatformUser / peopleApi records to AdminUserSummary read models.
 */

import { peopleApi } from '@/api/people.ts'
import { partiesApi } from '@/api/parties.ts'
import {
  adminRoleDisplayLabel,
  toUnifiedAdminRole,
} from '@/domain/rbac/roles/canonical-roles.ts'
import { partyMembershipRepository } from '@/repositories/index.ts'
import type { PlatformUser } from '@/types/domain.ts'
import type { AdminUserDetail, AdminUserSummary } from './types.ts'

export type AdminUserSummaryFilters = {
  readonly status?: string
  readonly role?: string
  readonly query?: string
}

function membershipCountForUser(userId: string): number {
  return partyMembershipRepository.listForUser(userId).length
}

function primaryPartyLabel(userId: string): { id?: string; label?: string } {
  const primary = partiesApi.getPrimaryMembership(userId)
  if (!primary) return {}
  const party = partiesApi.getParty(primary.partyId)
  return {
    id: primary.partyId,
    label: party?.displayName ?? primary.partyId,
  }
}

export function toAdminUserSummary(user: PlatformUser): AdminUserSummary {
  const party = primaryPartyLabel(user.id)
  return {
    id: user.id,
    fullName: user.profile?.name ?? user.email ?? user.id,
    email: user.email,
    accountType: user.profile?.type,
    primaryPartyId: party.id,
    primaryPartyLabel: party.label,
    membershipCount: membershipCountForUser(user.id),
    role: String(user.role ?? 'user'),
    roleLabel: adminRoleDisplayLabel(user.role),
    vettingStatus: user.profile?.vetting?.reviewProgress ?? user.status,
    accountStatus: user.status ?? 'unknown',
    registeredAt: user.createdAt,
    riskFlag: (user.status ?? '').toLowerCase() === 'suspended',
  }
}

export function toAdminUserDetail(user: PlatformUser): AdminUserDetail {
  return {
    ...toAdminUserSummary(user),
    locked: (user.status ?? '').toLowerCase() === 'locked',
    notes: user.profile?.vetting?.reviewNotes
      ? [user.profile.vetting.reviewNotes]
      : undefined,
  }
}

export function listAdminUserSummaries(
  filters?: AdminUserSummaryFilters,
): readonly AdminUserSummary[] {
  let users = peopleApi.listAll()
  if (filters?.status) {
    const s = filters.status.toLowerCase()
    users = users.filter((u) => (u.status ?? '').toLowerCase() === s)
  }
  if (filters?.role) {
    const r = filters.role.toLowerCase()
    users = users.filter((u) => {
      return (
        String(u.role).toLowerCase() === r ||
        toUnifiedAdminRole(u.role) === r
      )
    })
  }
  if (filters?.query?.trim()) {
    const q = filters.query.trim().toLowerCase()
    users = users.filter((u) => {
      const hay = [
        u.profile?.name,
        u.email,
        u.role,
        u.status,
        u.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }
  return users.map(toAdminUserSummary)
}

export function getAdminUserSummary(userId: string): AdminUserSummary | undefined {
  const user = peopleApi.get(userId)
  return user ? toAdminUserSummary(user) : undefined
}

export function getAdminUserDetail(userId: string): AdminUserDetail | undefined {
  const user = peopleApi.get(userId)
  return user ? toAdminUserDetail(user) : undefined
}

export function uniqueUserStatuses(): readonly string[] {
  const set = new Set<string>()
  for (const u of peopleApi.listAll()) {
    if (u.status) set.add(u.status)
  }
  return [...set].sort()
}

export function uniqueUserRoles(): readonly string[] {
  const set = new Set<string>()
  for (const u of peopleApi.listAll()) {
    if (u.role) set.add(String(u.role))
  }
  return [...set].sort()
}
