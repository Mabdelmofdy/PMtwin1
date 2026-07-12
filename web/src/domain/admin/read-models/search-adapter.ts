/**
 * Global admin search across repositories.
 */

import { defaultScopeForRole } from '@/domain/rbac/roles/permission-bundles.ts'
import { runtimeEnvironment } from '@/config/runtime-environment.ts'
import {
  auditRepository,
  commercialAgreementRepository,
  contractRepository,
  negotiationRepository,
  notificationRepository,
  opportunityRepository,
  partyRepository,
  userRepository,
} from '@/repositories/index.ts'
import type { AdminGlobalSearchResult } from './types.ts'

export type AdminSearchOptions = {
  readonly query: string
  readonly actorRole?: string | null
  readonly limit?: number
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return '***'
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}***@${domain}`
}

function matchesQuery(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query)
}

export function searchAdminEntities(
  options: AdminSearchOptions,
): readonly AdminGlobalSearchResult[] {
  const q = options.query.trim().toLowerCase()
  if (!q) return []

  const limit = options.limit ?? 50
  const maskSensitive = defaultScopeForRole(options.actorRole) === 'read_only' ||
    defaultScopeForRole(options.actorRole) === 'sensitive_masked' ||
    options.actorRole?.toLowerCase() === 'auditor'
  const env = runtimeEnvironment.mode
  const results: AdminGlobalSearchResult[] = []

  for (const user of userRepository.getAll()) {
    const email = user.email ?? ''
    const name = user.profile?.name ?? ''
    if (!matchesQuery(`${name} ${email} ${user.id} ${user.role} ${user.status}`, q)) continue
    results.push({
      id: `user-${user.id}`,
      entityType: 'user',
      primaryLabel: name || email || user.id,
      secondaryContext: maskSensitive ? maskEmail(email) : email,
      status: user.status,
      environment: env,
      lastUpdated: user.updatedAt ?? user.createdAt,
      href: `/admin/users/${user.id}`,
      rank: 10,
      masked: maskSensitive,
    })
  }

  for (const party of partyRepository.getAll()) {
    if (!matchesQuery(`${party.displayName} ${party.id} ${party.partyType} ${party.status}`, q)) continue
    results.push({
      id: `party-${party.id}`,
      entityType: 'party',
      primaryLabel: party.displayName,
      secondaryContext: party.partyType,
      status: party.status,
      environment: env,
      lastUpdated: party.updatedAt,
      href: `/admin/parties/${party.id}`,
      rank: 20,
    })
  }

  for (const opp of opportunityRepository.getAll()) {
    if (!matchesQuery(`${opp.title} ${opp.id} ${opp.status} ${opp.location ?? ''}`, q)) continue
    results.push({
      id: `opportunity-${opp.id}`,
      entityType: 'opportunity',
      primaryLabel: opp.title,
      secondaryContext: opp.location,
      status: String(opp.status),
      environment: env,
      lastUpdated: opp.updatedAt,
      href: `/admin/opportunities`,
      rank: 30,
    })
  }

  for (const n of negotiationRepository.getAll()) {
    if (!matchesQuery(`${n.id} ${n.status} ${n.opportunityId ?? ''}`, q)) continue
    results.push({
      id: `negotiation-${n.id}`,
      entityType: 'negotiation',
      primaryLabel: `Negotiation ${n.id}`,
      secondaryContext: n.opportunityId,
      status: String(n.status),
      environment: env,
      lastUpdated: n.updatedAt,
      href: `/admin/negotiations/${n.id}`,
      rank: 40,
    })
  }

  for (const ca of commercialAgreementRepository.getAll()) {
    if (!matchesQuery(`${ca.title} ${ca.id} ${ca.status}`, q)) continue
    results.push({
      id: `ca-${ca.id}`,
      entityType: 'commercial_agreement',
      primaryLabel: ca.title || `Commercial Agreement ${ca.id}`,
      secondaryContext: ca.opportunityId,
      status: String(ca.status),
      environment: env,
      lastUpdated: ca.updatedAt,
      href: `/admin/commercial-agreements/${ca.id}`,
      rank: 50,
    })
  }

  for (const c of contractRepository.getAll()) {
    if (!matchesQuery(`${c.id} ${c.status} ${c.paymentMode ?? ''}`, q)) continue
    results.push({
      id: `contract-${c.id}`,
      entityType: 'contract',
      primaryLabel: `Contract ${c.id}`,
      secondaryContext: c.commercialAgreementId ?? c.dealId,
      status: String(c.status),
      environment: env,
      lastUpdated: c.updatedAt,
      href: `/admin/contracts/${c.id}`,
      rank: 60,
    })
  }

  for (const entry of auditRepository.getAll()) {
    if (!matchesQuery(`${entry.action} ${entry.userId ?? ''} ${entry.entityId ?? ''} ${entry.id}`, q)) continue
    results.push({
      id: `audit-${entry.id}`,
      entityType: 'audit',
      primaryLabel: entry.action,
      secondaryContext: entry.entityType
        ? `${entry.entityType}:${entry.entityId ?? ''}`
        : entry.userId,
      environment: env,
      lastUpdated: entry.timestamp,
      href: '/admin/audit',
      rank: 80,
    })
  }

  for (const n of notificationRepository.getAll()) {
    if (!matchesQuery(`${n.title} ${n.message ?? ''} ${n.userId} ${n.id}`, q)) continue
    results.push({
      id: `notification-${n.id}`,
      entityType: 'notification',
      primaryLabel: n.title,
      secondaryContext: n.userId,
      status: n.read ? 'read' : 'unread',
      environment: env,
      lastUpdated: n.createdAt,
      href: '/admin/inbox',
      rank: 90,
    })
  }

  return results
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
}
