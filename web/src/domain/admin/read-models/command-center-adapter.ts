/**
 * Command Center / Operations / Risk summaries from live repositories.
 * No fake metrics. EOX expansions: platform health, pipeline, recent ops.
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
import { formatEnterpriseSubjectLine } from './enterprise-subject-adapter.ts'
import type {
  AdminCommandCenterSummary,
  AdminHealthTone,
  AdminOperationsSummary,
  AdminOpsActionCard,
  AdminPipelineSummary,
  AdminPlatformHealthSummary,
  AdminRecentOperation,
  AdminRiskBucket,
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

function statusLower(value?: string): string {
  return (value ?? '').toLowerCase()
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
    const vis = statusLower(o.visibilityStatus)
    const st = statusLower(o.status)
    return vis === 'published' || st === 'published'
  }).length

  const activeMatches = matches.filter((m) => {
    const s = statusLower(m.status)
    return s === 'discovered' || s === 'accepted' || s === 'confirmed' || s === 'pending'
  }).length

  const activeNegotiations = negotiations.filter((n) => {
    const s = statusLower(n.status)
    return s === 'active' || s === 'countered' || s === 'open'
  }).length

  const activeContracts = contracts.filter((c) => {
    const s = statusLower(c.status)
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
    (u) => statusLower(u.status) === 'suspended',
  )
  const opportunities = opportunityRepository.getAll()
  const pendingModeration = opportunities.filter((o) => {
    const vis = statusLower(o.visibilityStatus)
    const st = statusLower(o.status)
    return vis === 'pending_moderation' || st === 'pending_moderation' || st === 'under_review'
  })
  const inactiveNegotiations = negotiationRepository.getAll().filter((n) => {
    const s = statusLower(n.status)
    if (!(s === 'active' || s === 'countered' || s === 'open')) return false
    return ageMsFrom(n.updatedAt) > 14 * DAY_MS
  })
  const reviewCas = commercialAgreementRepository.getAll().filter((ca) => {
    const s = statusLower(ca.status)
    return s === 'draft' || s === 'negotiating' || s === 'review' || s === 'signing'
  })
  const awardReady = commercialAgreementRepository.getAll().filter((ca) => {
    const s = statusLower(ca.status)
    return s === 'approved' || s === 'ready_for_award' || s === 'awarded'
  })
  const legalContracts = contractRepository.getAll().filter((c) => {
    const s = statusLower(c.status)
    return s === 'draft' || s === 'pending_signature' || s === 'pending'
  })

  const cards: AdminOpsActionCard[] = [
    buildOpsCard({
      id: 'pending_moderation',
      title: 'Pending moderation',
      count: pendingModeration.length,
      timestamps: pendingModeration.map((o) => o.updatedAt ?? o.createdAt),
      assignedTeam: 'Marketplace',
      destinationHref: '/admin/moderation',
      quickActions: ['opportunity.moderate'],
      requiredPermission: 'admin.opportunities.moderate',
      highAt: 5,
    }),
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
      title: 'Pending approvals',
      count: reviewCas.length,
      timestamps: reviewCas.map((c) => c.updatedAt ?? c.createdAt),
      assignedTeam: 'Commercial',
      destinationHref: '/admin/approvals',
      quickActions: ['commercial_agreement.approve'],
      requiredPermission: 'admin.commercial_agreements.approve',
      highAt: 5,
    }),
    buildOpsCard({
      id: 'pending_awards',
      title: 'Pending awards',
      count: awardReady.filter((c) => statusLower(c.status) !== 'awarded').length,
      timestamps: awardReady.map((c) => c.updatedAt ?? c.createdAt),
      assignedTeam: 'Commercial',
      destinationHref: '/admin/awards',
      quickActions: ['commercial_agreement.award'],
      requiredPermission: 'admin.commercial_agreements.award',
      highAt: 3,
    }),
    buildOpsCard({
      id: 'legal_review',
      title: 'Pending legal review',
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

function toneFromCheckStatus(status: string): AdminHealthTone {
  if (status === 'error') return 'critical'
  if (status === 'warning') return 'warning'
  if (status === 'ok') return 'healthy'
  return 'info'
}

export function buildPlatformHealthSummary(): AdminPlatformHealthSummary {
  const snap = buildDemoUatHealthSnapshot()
  const ops = buildOperationsSummary()
  const summary = buildCommandCenterSummary()
  const pendingActionCount = ops.cards.reduce((n, c) => n + c.count, 0)

  const facets: AdminPlatformHealthSummary['facets'] = [
    {
      id: 'marketplace',
      label: 'Marketplace Health',
      tone: summary.publishedOpportunities > 0 ? 'healthy' : 'warning',
      detail: `${summary.publishedOpportunities} published opportunities`,
      href: '/admin/opportunities',
      value: summary.publishedOpportunities,
    },
    {
      id: 'commercial',
      label: 'Commercial Health',
      tone: summary.activeNegotiations + summary.activeContracts > 0 ? 'healthy' : 'info',
      detail: `${summary.activeNegotiations} negotiations · ${summary.activeContracts} contracts`,
      href: '/admin/workspaces/commercial',
      value: summary.commercialAgreements,
    },
    {
      id: 'matching',
      label: 'Matching Health',
      tone: summary.activeMatches > 0 ? 'healthy' : 'warning',
      detail: `${summary.activeMatches} active matches`,
      href: '/admin/matching',
      value: summary.activeMatches,
    },
    {
      id: 'readiness',
      label: 'Readiness Health',
      tone: 'info',
      detail: 'Profile and opportunity readiness from live evaluators',
      href: '/admin/matching/quality',
      value: summary.platformHealthLabel,
    },
    {
      id: 'compliance',
      label: 'Compliance Health',
      tone: summary.pendingVetting > 0 ? 'warning' : 'healthy',
      detail: `${summary.pendingVetting} pending vetting`,
      href: '/admin/vetting',
      value: summary.pendingVetting,
    },
    {
      id: 'data_quality',
      label: 'Data Quality',
      tone: toneFromCheckStatus(
        snap.checks.find((c) => c.id === 'local_storage')?.status ?? 'info',
      ),
      detail: snap.checks.find((c) => c.id === 'local_storage')?.detail ?? 'LocalStorage',
      href: '/admin/data-quality',
      value: snap.counts.auditEntries,
    },
  ]

  const overallTone: AdminHealthTone =
    pendingActionCount >= 10
      ? 'critical'
      : pendingActionCount >= 5
        ? 'warning'
        : snap.checks.some((c) => c.status === 'error')
          ? 'blocked'
          : 'healthy'

  return {
    facets,
    overallTone,
    overallLabel: summary.platformHealthLabel,
  }
}

export function buildPipelineSummary(): AdminPipelineSummary {
  const opportunities = opportunityRepository.getAll()
  const matches = postMatchRepository.getAll()
  const negotiations = negotiationRepository.getAll()
  const cas = commercialAgreementRepository.getAll()
  const contracts = contractRepository.getAll()

  const published = opportunities.filter((o) => {
    const vis = statusLower(o.visibilityStatus)
    const st = statusLower(o.status)
    return vis === 'published' || st === 'published' || st === 'matched' || st === 'negotiating'
  }).length

  const matched = matches.filter((m) => {
    const s = statusLower(m.status)
    return s === 'discovered' || s === 'accepted' || s === 'confirmed' || s === 'pending'
  }).length

  const accepted = matches.filter((m) => {
    const s = statusLower(m.status)
    return s === 'accepted' || s === 'confirmed'
  }).length

  const negotiation = negotiations.filter((n) => {
    const s = statusLower(n.status)
    return s === 'active' || s === 'countered' || s === 'open' || s === 'agreed'
  }).length

  const commercial = cas.length

  const contract = contracts.length

  const execution = contracts.filter((c) => statusLower(c.status) === 'active').length

  const completed = contracts.filter((c) => {
    const s = statusLower(c.status)
    return s === 'completed' || s === 'closed'
  }).length

  return {
    stages: [
      { id: 'published', label: 'Published', count: published, href: '/admin/opportunities?status=published' },
      { id: 'matched', label: 'Matched', count: matched, href: '/admin/post-matches' },
      { id: 'accepted', label: 'Accepted', count: accepted, href: '/admin/post-matches?status=accepted' },
      { id: 'negotiation', label: 'Negotiation', count: negotiation, href: '/admin/negotiations' },
      { id: 'commercial', label: 'Commercial Agreement', count: commercial, href: '/admin/commercial-agreements' },
      { id: 'contract', label: 'Contract', count: contract, href: '/admin/contracts' },
      { id: 'execution', label: 'Execution', count: execution, href: '/admin/contracts?status=active' },
      { id: 'completed', label: 'Completed', count: completed, href: '/admin/contracts?status=completed' },
    ],
  }
}

export function buildRiskSummary(): AdminRiskSummary {
  const suspendedUsers = userRepository.getAll().filter(
    (u) => statusLower(u.status) === 'suspended',
  ).length

  const rejectedDocuments = userRepository.getAll().filter((u) => {
    const st = statusLower(u.status)
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

  const critical = riskCards.filter((c) => c.severity === 'critical' || c.sla === 'overdue')
  const warning = riskCards.filter(
    (c) =>
      !critical.includes(c) &&
      (c.severity === 'high' || c.severity === 'medium' || c.sla === 'warning'),
  )
  const blocked = riskCards.filter((c) => c.id === 'suspended_users' && c.count > 0)
  const healthyCount = ops.cards.filter((c) => c.count === 0).length

  const buckets: AdminRiskBucket[] = [
    { id: 'critical', label: 'Critical', count: critical.length, items: critical },
    { id: 'warning', label: 'Warning', count: warning.length, items: warning },
    {
      id: 'blocked',
      label: 'Blocked',
      count: blocked.length,
      items: blocked,
    },
    {
      id: 'healthy',
      label: 'Healthy',
      count: healthyCount,
      items: ops.cards.filter((c) => c.count === 0),
    },
  ]

  return {
    suspendedUsers,
    rejectedDocuments,
    orphanHints,
    items: riskCards,
    buckets,
  }
}

const OPERATIONAL_AUDIT_HINTS = [
  'vetting',
  'moderate',
  'moderation',
  'approv',
  'award',
  'suspend',
  'activate',
  'lock',
  'unlock',
  'environment',
  'import',
  'export',
  'feature',
  'legal',
  'contract',
  'membership',
] as const

export function buildRecentOperations(limit = 8): readonly AdminRecentOperation[] {
  const audit = adminApi.getAuditLog()
  const operational = audit.filter((entry) => {
    const detailText =
      entry.details && typeof entry.details === 'object'
        ? JSON.stringify(entry.details)
        : ''
    const hay = `${entry.action ?? ''} ${entry.entityType ?? ''} ${detailText}`.toLowerCase()
    return OPERATIONAL_AUDIT_HINTS.some((hint) => hay.includes(hint))
  })

  const source = operational.length > 0 ? operational : audit
  return source.slice(0, limit).map((entry) => {
    const subject = formatEnterpriseSubjectLine(entry.entityType, entry.entityId)
    const typeLabel = entry.entityType
      ? String(entry.entityType).replace(/_/g, ' ')
      : undefined
    return {
      id: entry.id,
      title: entry.action ?? 'Operation',
      summary: subject
        ? typeLabel
          ? `${typeLabel} · ${subject}`
          : subject
        : typeLabel || 'Platform event',
      timestamp: entry.timestamp ?? new Date().toISOString(),
      href: '/admin/audit',
      kind: String(entry.entityType ?? 'audit'),
    }
  })
}
