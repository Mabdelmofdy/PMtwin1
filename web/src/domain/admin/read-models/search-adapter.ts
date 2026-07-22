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
import {
  formatCommercialAgreementPresentation,
  formatContractPresentation,
  formatNegotiationPresentation,
  formatOpportunityPresentation,
  formatPartyPresentation,
  formatUserPresentation,
} from '@/lib/enterprise-display.ts'
import { formatEnterpriseSubjectLine } from './enterprise-subject-adapter.ts'
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
  const getOpportunity = (id: string) => opportunityRepository.getById(id)

  for (const user of userRepository.getAll()) {
    const email = user.email ?? ''
    const view = formatUserPresentation(user)
    // Match on repository id for operators, but never display it.
    if (
      !matchesQuery(
        `${view.fullName} ${view.employeeNumber} ${email} ${user.id} ${user.role} ${user.status}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `user-${user.id}`,
      entityType: 'user',
      primaryLabel: view.fullName,
      secondaryContext: maskSensitive
        ? `${view.employeeNumber} · ${maskEmail(email)}`
        : `${view.employeeNumber}${email ? ` · ${email}` : ''}`,
      status: user.status,
      environment: env,
      lastUpdated: user.updatedAt ?? user.createdAt,
      href: `/admin/users/${user.id}`,
      rank: 10,
      masked: maskSensitive,
    })
  }

  for (const party of partyRepository.getAll()) {
    const view = formatPartyPresentation(party)
    if (
      !matchesQuery(
        `${view.companyName} ${view.companyCode} ${party.id} ${party.partyType} ${party.status}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `party-${party.id}`,
      entityType: 'party',
      primaryLabel: view.companyName,
      secondaryContext: `${view.companyCode} · ${party.partyType}`,
      status: party.status,
      environment: env,
      lastUpdated: party.updatedAt,
      href: `/admin/parties/${party.id}`,
      rank: 20,
    })
  }

  for (const opp of opportunityRepository.getAll()) {
    const view = formatOpportunityPresentation(opp)
    if (
      !matchesQuery(
        `${view.name} ${view.reference} ${opp.id} ${opp.status} ${opp.location ?? ''}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `opportunity-${opp.id}`,
      entityType: 'opportunity',
      primaryLabel: view.name,
      secondaryContext: view.reference,
      status: String(opp.status),
      environment: env,
      lastUpdated: opp.updatedAt,
      href: `/admin/opportunities/${opp.id}`,
      rank: 30,
    })
  }

  for (const n of negotiationRepository.getAll()) {
    const view = formatNegotiationPresentation(n, getOpportunity)
    const oppLine = n.opportunityId
      ? formatEnterpriseSubjectLine('opportunity', n.opportunityId)
      : undefined
    if (
      !matchesQuery(
        `${view.title} ${view.reference} ${n.id} ${n.status} ${oppLine ?? ''}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `negotiation-${n.id}`,
      entityType: 'negotiation',
      primaryLabel: view.title,
      secondaryContext: oppLine ? `${view.reference} · ${oppLine}` : view.reference,
      status: String(n.status),
      environment: env,
      lastUpdated: n.updatedAt,
      href: `/admin/negotiations/${n.id}`,
      rank: 40,
    })
  }

  for (const ca of commercialAgreementRepository.getAll()) {
    const view = formatCommercialAgreementPresentation(ca, (id) =>
      opportunityRepository.getById(id),
    )
    if (!matchesQuery(`${view.name} ${view.reference} ${ca.id} ${ca.status}`, q)) continue
    results.push({
      id: `ca-${ca.id}`,
      entityType: 'commercial_agreement',
      primaryLabel: view.name,
      secondaryContext: view.reference,
      status: String(ca.status),
      environment: env,
      lastUpdated: ca.updatedAt,
      href: `/admin/commercial-agreements/${ca.id}`,
      rank: 50,
    })
  }

  for (const c of contractRepository.getAll()) {
    const view = formatContractPresentation(c)
    if (
      !matchesQuery(
        `${view.name} ${view.reference} ${c.id} ${c.status} ${c.paymentMode ?? ''}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `contract-${c.id}`,
      entityType: 'contract',
      primaryLabel: view.name,
      secondaryContext: view.reference,
      status: String(c.status),
      environment: env,
      lastUpdated: c.updatedAt,
      href: `/admin/contracts/${c.id}`,
      rank: 60,
    })
  }

  for (const entry of auditRepository.getAll()) {
    const subject = formatEnterpriseSubjectLine(entry.entityType, entry.entityId)
    const actor = entry.userId
      ? formatEnterpriseSubjectLine('user', entry.userId)
      : undefined
    if (
      !matchesQuery(
        `${entry.action} ${subject ?? ''} ${actor ?? ''} ${entry.entityType ?? ''} ${entry.id}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `audit-${entry.id}`,
      entityType: 'audit',
      primaryLabel: entry.action,
      secondaryContext: subject ?? actor ?? entry.entityType ?? 'Platform event',
      environment: env,
      lastUpdated: entry.timestamp,
      href: '/admin/audit',
      rank: 80,
    })
  }

  for (const n of notificationRepository.getAll()) {
    const recipient = formatEnterpriseSubjectLine('user', n.userId)
    if (
      !matchesQuery(
        `${n.title} ${n.message ?? ''} ${recipient ?? ''} ${n.id}`,
        q,
      )
    ) {
      continue
    }
    results.push({
      id: `notification-${n.id}`,
      entityType: 'notification',
      primaryLabel: n.title,
      secondaryContext: recipient ?? 'Notification',
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
