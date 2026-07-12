/**
 * Command Center / Operations / Risk summaries from live repositories.
 * No fake metrics.
 */

import { adminApi } from '@/api/admin.ts'
import { runtimeEnvironment } from '@/config/runtime-environment.ts'
import { buildDemoUatHealthSnapshot } from '@/domain/admin/diagnostics/demo-uat-health.ts'
import {
  commercialAgreementRepository,
  contractRepository,
  negotiationRepository,
  opportunityRepository,
  partyRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import type {
  AdminCommandCenterSummary,
  AdminOperationsSummary,
  AdminOpsActionCard,
  AdminRiskSummary,
  AdminSeverity,
  AdminSlaState,
} from './types.ts'

const DAY_MS = 24 * 60 * 60 * 1000

function ageMsFrom(iso?: string): number {
  if (!iso) return 0
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 0
  return Math.max(0, Date.now() - t)
}

function oldestAge(timestamps: readonly (string | undefined)[]): number {
  let max = 0
  for (const ts of timestamps) {
    max = Math.max(max, ageMsFrom(ts))
  }
  return max
}

function slaFromOldest(oldestMs: number): AdminSlaState {
  if (oldestMs <= 0) return 'none'
  if (oldestMs > 7 * DAY_MS) return 'overdue'
  if (oldestMs > 3 * DAY_MS) return 'warning'
  return 'ok'
}

function severityFromCount(count: number, highAt: number): AdminSeverity {
  if (count === 0) return 'info'
  if (count >= highAt) return 'high'
  if (count >= Math.ceil(highAt / 2)) return 'medium'
  return 'low'
}

function platformHealthLabel(): string {
  const snap = buildDemoUatHealthSnapshot()
  const hasError = snap.checks.some((c) => c.status === 'error')
  const hasWarning = snap.checks.some((c) => c.status === 'warning')
  if (hasError) return 'Degraded'
  if (hasWarning) return 'Attention'
  return 'Operational'
}

export function buildCommandCenterSummary(): AdminCommandCenterSummary {
  const users = userRepository.getAll()
  const parties = partyRepository.getAll()
  const opportunities = opportunityRepository.getAll()
  const matches = postMatchRepository.getAll()
  const negotiations = negotiationRepository.getAll()
  const cas = commercialAgreementRepository.getAll()
  const contracts = contractRepository.getAll()
  const pendingVetting = adminApi.getPendingUsers().length

  const publishedOpportunities = opportunities.filter((o) => {
    const vis = (o.visibilityStatus ?? '').toLowerCase()
    const st = (o.status ?? '').toLowerCase()
    return vis === 'published' || st === 'published'
  }).length

  const activeMatches = matches.filter((m) => {
    const s = (m.status ?? '').toLowerCase()
    return s === 'discovered' || s === 'accepted' || s === 'confirmed' || s === 'pending'
  }).length

  const activeNegotiations = negotiations.filter((n) => {
    const s = (n.status ?? '').toLowerCase()
    return s === 'active' || s === 'countered' || s === 'open'
  }).length

  const activeContracts = contracts.filter((c) => {
    const s = (c.status ?? '').toLowerCase()
    return s === 'active' || s === 'pending_signature' || s === 'pending'
  }).length

  return {
    generatedAt: new Date().toISOString(),
    environment: runtimeEnvironment.mode,
    totalUsers: users.length,
    totalParties: parties.length,
    publishedOpportunities,
    activeMatches,
    activeNegotiations,
    commercialAgreements: cas.length,
    activeContracts,
    pendingVetting,
    platformHealthLabel: platformHealthLabel(),
  }
}

function buildOpsCard(
  partial: Omit<AdminOpsActionCard, 'severity' | 'sla' | 'oldestAgeMs'> & {
    readonly timestamps: readonly (string | undefined)[]
    readonly highAt?: number
  },
): AdminOpsActionCard {
  const oldest = oldestAge(partial.timestamps)
  return {
    id: partial.id,
    title: partial.title,
    count: partial.count,
    severity: severityFromCount(partial.count, partial.highAt ?? 5),
    sla: slaFromOldest(oldest),
    oldestAgeMs: oldest,
    assignedTeam: partial.assignedTeam,
    destinationHref: partial.destinationHref,
    quickActions: partial.quickActions,
    requiredPermission: partial.requiredPermission,
  }
}

export function buildOperationsSummary(): AdminOperationsSummary {
  const pendingUsers = adminApi.getPendingUsers()
  const suspended = userRepository.getAll().filter(
    (u) => (u.status ?? '').toLowerCase() === 'suspended',
  )
  const inactiveNegotiations = negotiationRepository.getAll().filter((n) => {
    const s = (n.status ?? '').toLowerCase()
    if (!(s === 'active' || s === 'countered' || s === 'open')) return false
    return ageMsFrom(n.updatedAt) > 14 * DAY_MS
  })
  const reviewCas = commercialAgreementRepository.getAll().filter((ca) => {
    const s = (ca.status ?? '').toLowerCase()
    return s === 'draft' || s === 'negotiating' || s === 'review' || s === 'signing'
  })
  const legalContracts = contractRepository.getAll().filter((c) => {
    const s = (c.status ?? '').toLowerCase()
    return s === 'draft' || s === 'pending_signature' || s === 'pending'
  })

  const cards: AdminOpsActionCard[] = [
    buildOpsCard({
      id: 'pending_vetting',
      title: 'Pending vetting',
      count: pendingUsers.length,
      timestamps: pendingUsers.map((e) => e.user.updatedAt ?? e.user.createdAt),
      assignedTeam: 'Compliance',
      destinationHref: '/admin/vetting',
      quickActions: ['vetting.approve', 'vetting.reject'],
      requiredPermission: 'admin.vetting.manage',
      highAt: 5,
    }),
    buildOpsCard({
      id: 'suspended_users',
      title: 'Suspended users',
      count: suspended.length,
      timestamps: suspended.map((u) => u.updatedAt ?? u.createdAt),
      assignedTeam: 'User Admin',
      destinationHref: '/admin/users?status=suspended',
      quickActions: ['user.unsuspend'],
      requiredPermission: 'admin.users.manage',
      highAt: 3,
    }),
    buildOpsCard({
      id: 'stale_negotiations',
      title: 'Inactive negotiations (>14d)',
      count: inactiveNegotiations.length,
      timestamps: inactiveNegotiations.map((n) => n.updatedAt),
      assignedTeam: 'Operations',
      destinationHref: '/admin/negotiations',
      quickActions: [],
      requiredPermission: 'admin.negotiations.read',
      highAt: 5,
    }),
    buildOpsCard({
      id: 'ca_review',
      title: 'Commercial Agreements awaiting review',
      count: reviewCas.length,
      timestamps: reviewCas.map((c) => c.updatedAt ?? c.createdAt),
      assignedTeam: 'Commercial',
      destinationHref: '/admin/approvals',
      quickActions: ['commercial_agreement.approve'],
      requiredPermission: 'admin.commercial_agreements.approve',
      highAt: 5,
    }),
    buildOpsCard({
      id: 'legal_review',
      title: 'Contracts pending legal review',
      count: legalContracts.length,
      timestamps: legalContracts.map((c) => c.updatedAt ?? c.createdAt),
      assignedTeam: 'Legal',
      destinationHref: '/admin/legal-review',
      quickActions: [],
      requiredPermission: 'admin.contracts.legal_review',
      highAt: 5,
    }),
  ]

  return { cards }
}

export function buildRiskSummary(): AdminRiskSummary {
  const suspendedUsers = userRepository.getAll().filter(
    (u) => (u.status ?? '').toLowerCase() === 'suspended',
  ).length

  const rejectedDocuments = userRepository.getAll().filter((u) => {
    const st = (u.status ?? '').toLowerCase()
    return st === 'rejected'
  }).length

  const userIds = new Set(userRepository.getAll().map((u) => u.id))
  const orphanHints = opportunityRepository.getAll().filter((o) => {
    if (!o.creatorId) return true
    return !userIds.has(o.creatorId)
  }).length

  const ops = buildOperationsSummary()
  const riskCards = ops.cards.filter(
    (c) => c.id === 'suspended_users' || c.id === 'pending_vetting' || c.count > 0,
  )

  return {
    suspendedUsers,
    rejectedDocuments,
    orphanHints,
    items: riskCards,
  }
}
