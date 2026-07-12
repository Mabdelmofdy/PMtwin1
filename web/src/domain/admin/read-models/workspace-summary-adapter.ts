/**
 * Workspace summary builder for admin workspace shells (EOX operational homes).
 */

import { buildAdminInbox } from './inbox-adapter.ts'
import {
  buildCommandCenterSummary,
  buildOperationsSummary,
  buildRecentOperations,
  buildRiskSummary,
} from './command-center-adapter.ts'
import type {
  AdminHealthTone,
  AdminOpsActionCard,
  AdminWorkspaceSummary,
} from './types.ts'

type WorkspaceDef = {
  readonly title: string
  readonly description: string
  readonly domainLinks: readonly {
    readonly label: string
    readonly href: string
    readonly description?: string
  }[]
  readonly actionCardIds: readonly string[]
}

const WORKSPACE_DEFS: Readonly<Record<string, WorkspaceDef>> = {
  identity: {
    title: 'Identity Workspace',
    description: 'Users, invitations, memberships, roles, and pending vetting.',
    domainLinks: [
      { label: 'Users', href: '/admin/users', description: 'Accounts and status' },
      { label: 'Parties', href: '/admin/parties', description: 'Party records' },
      { label: 'Memberships', href: '/admin/memberships', description: 'Party memberships' },
      { label: 'Roles', href: '/admin/roles', description: 'Role assignments' },
      { label: 'Pending Vetting', href: '/admin/vetting', description: 'Identity compliance queue' },
    ],
    actionCardIds: ['pending_vetting', 'suspended_users'],
  },
  compliance: {
    title: 'Compliance Workspace',
    description: 'Vetting, documents, clarifications, and review SLA.',
    domainLinks: [
      { label: 'Vetting', href: '/admin/vetting', description: 'Pending reviews' },
      { label: 'Vetting Config', href: '/admin/vetting/config', description: 'Policy settings' },
      { label: 'Inbox', href: '/admin/inbox', description: 'Compliance actions' },
      { label: 'Risk', href: '/admin/command-center/risk', description: 'Risk signals' },
    ],
    actionCardIds: ['pending_vetting'],
  },
  marketplace: {
    title: 'Marketplace Workspace',
    description: 'Moderation, matching, PostMatches, taxonomy, and marketplace health.',
    domainLinks: [
      { label: 'Opportunities', href: '/admin/opportunities', description: 'Marketplace listings' },
      { label: 'Moderation', href: '/admin/moderation', description: 'Pending moderation' },
      { label: 'Matching', href: '/admin/matching', description: 'Run matching' },
      { label: 'PostMatches', href: '/admin/post-matches', description: 'Match outcomes' },
      { label: 'Matching Quality', href: '/admin/matching/quality', description: 'Quality analytics' },
      { label: 'Taxonomy', href: '/admin/taxonomy', description: 'Classification' },
    ],
    actionCardIds: ['pending_moderation'],
  },
  commercial: {
    title: 'Commercial Workspace',
    description: 'Negotiations, agreements, approvals, awards, contracts, and legal review.',
    domainLinks: [
      { label: 'Negotiations', href: '/admin/negotiations', description: 'Active negotiations' },
      { label: 'Commercial Agreements', href: '/admin/commercial-agreements', description: 'CA records' },
      { label: 'Approvals', href: '/admin/approvals', description: 'Pending approvals' },
      { label: 'Awards', href: '/admin/awards', description: 'Award decisions' },
      { label: 'Contracts', href: '/admin/contracts', description: 'Contract records' },
      { label: 'Legal Review', href: '/admin/legal-review', description: 'Legal queue' },
    ],
    actionCardIds: ['stale_negotiations', 'ca_review', 'pending_awards', 'legal_review'],
  },
  reports: {
    title: 'Reports Workspace',
    description: 'Live platform metrics from repositories.',
    domainLinks: [
      { label: 'Reports', href: '/admin/reports', description: 'Platform analytics' },
      { label: 'Matching Quality', href: '/admin/matching/quality', description: 'Match analytics' },
      { label: 'Command Center', href: '/admin', description: 'Executive overview' },
    ],
    actionCardIds: [],
  },
  configuration: {
    title: 'Configuration Workspace',
    description: 'Settings, feature flags, and environments.',
    domainLinks: [
      { label: 'Settings', href: '/admin/settings', description: 'Platform settings' },
      { label: 'Feature Flags', href: '/admin/feature-flags', description: 'Runtime flags' },
      { label: 'Environments', href: '/admin/environments', description: 'Demo/UAT environments' },
    ],
    actionCardIds: [],
  },
  system: {
    title: 'System Workspace',
    description: 'Environment, health, flags, data quality, import/export, and audit.',
    domainLinks: [
      { label: 'Health', href: '/admin/health', description: 'Runtime health' },
      { label: 'Environments', href: '/admin/environments', description: 'Import / export / reset' },
      { label: 'Feature Flags', href: '/admin/feature-flags', description: 'Flags' },
      { label: 'Data Quality', href: '/admin/data-quality', description: 'DQ checks' },
      { label: 'Failed Commands', href: '/admin/failed-commands', description: 'Command failures' },
      { label: 'Audit', href: '/admin/audit', description: 'Audit trail' },
    ],
    actionCardIds: [],
  },
}

function workspaceRiskTone(cards: readonly AdminOpsActionCard[]): AdminHealthTone {
  if (cards.some((c) => c.count > 0 && (c.severity === 'critical' || c.sla === 'overdue'))) {
    return 'critical'
  }
  if (cards.some((c) => c.count > 0 && (c.severity === 'high' || c.severity === 'medium'))) {
    return 'warning'
  }
  if (cards.some((c) => c.count > 0)) return 'info'
  return 'healthy'
}

export function buildWorkspaceSummary(workspaceId: string): AdminWorkspaceSummary {
  const def = WORKSPACE_DEFS[workspaceId] ?? {
    title: `Workspace: ${workspaceId}`,
    description: 'Admin workspace overview.',
    domainLinks: [{ label: 'Command Center', href: '/admin', description: 'Return home' }],
    actionCardIds: [],
  }

  const summary = buildCommandCenterSummary()
  const ops = buildOperationsSummary()
  const risk = buildRiskSummary()
  const inbox = buildAdminInbox().filter((item) => {
    if (workspaceId === 'identity') return item.sourceWorkspace === 'identity' || item.entityType === 'user'
    if (workspaceId === 'compliance') return item.sourceWorkspace === 'compliance' || item.itemType.includes('vetting')
    if (workspaceId === 'marketplace') return item.sourceWorkspace === 'marketplace'
    if (workspaceId === 'commercial') return item.sourceWorkspace === 'commercial'
    if (workspaceId === 'system') return item.sourceWorkspace === 'system'
    return true
  }).slice(0, 8)

  const actionCards =
    def.actionCardIds.length > 0
      ? ops.cards.filter((c) => def.actionCardIds.includes(c.id))
      : ops.cards.filter((c) => c.count > 0).slice(0, 4)

  const kpiByWorkspace: Record<string, AdminWorkspaceSummary['kpiLabels']> = {
    identity: [
      { label: 'Users', value: summary.totalUsers, href: '/admin/users' },
      { label: 'Parties', value: summary.totalParties, href: '/admin/parties' },
      { label: 'Pending vetting', value: summary.pendingVetting, href: '/admin/vetting' },
      {
        label: 'Suspended',
        value: risk.suspendedUsers,
        href: '/admin/users?status=suspended',
      },
    ],
    compliance: [
      { label: 'Pending vetting', value: summary.pendingVetting, href: '/admin/vetting' },
      { label: 'Rejected', value: risk.rejectedDocuments, href: '/admin/vetting' },
      { label: 'Inbox items', value: inbox.length, href: '/admin/inbox' },
    ],
    marketplace: [
      { label: 'Published', value: summary.publishedOpportunities, href: '/admin/opportunities' },
      { label: 'Active matches', value: summary.activeMatches, href: '/admin/post-matches' },
      {
        label: 'Moderation',
        value: ops.cards.find((c) => c.id === 'pending_moderation')?.count ?? 0,
        href: '/admin/moderation',
      },
    ],
    commercial: [
      { label: 'Negotiations', value: summary.activeNegotiations, href: '/admin/negotiations' },
      { label: 'Agreements', value: summary.commercialAgreements, href: '/admin/commercial-agreements' },
      { label: 'Contracts', value: summary.activeContracts, href: '/admin/contracts' },
      {
        label: 'Approvals',
        value: ops.cards.find((c) => c.id === 'ca_review')?.count ?? 0,
        href: '/admin/approvals',
      },
    ],
    reports: [
      { label: 'Users', value: summary.totalUsers, href: '/admin/users' },
      { label: 'Published', value: summary.publishedOpportunities, href: '/admin/opportunities' },
      { label: 'Agreements', value: summary.commercialAgreements, href: '/admin/commercial-agreements' },
    ],
    configuration: [
      { label: 'Environment', value: summary.environment, href: '/admin/environments' },
      { label: 'Health', value: summary.platformHealthLabel, href: '/admin/health' },
    ],
    system: [
      { label: 'Health', value: summary.platformHealthLabel, href: '/admin/health' },
      { label: 'Environment', value: summary.environment, href: '/admin/environments' },
      { label: 'Orphan hints', value: risk.orphanHints, href: '/admin/data-quality' },
    ],
  }

  const analyticsByWorkspace: Record<string, AdminWorkspaceSummary['analytics']> = {
    identity: [
      { label: 'Users', value: summary.totalUsers, href: '/admin/users' },
      { label: 'Parties', value: summary.totalParties, href: '/admin/parties' },
      { label: 'Vetting backlog', value: summary.pendingVetting, href: '/admin/vetting' },
    ],
    compliance: [
      { label: 'Pending vetting', value: summary.pendingVetting, href: '/admin/vetting' },
      { label: 'Rejected', value: risk.rejectedDocuments, href: '/admin/vetting' },
    ],
    marketplace: [
      { label: 'Published → Matches', value: `${summary.publishedOpportunities} → ${summary.activeMatches}`, href: '/admin/matching/quality' },
      { label: 'Active matches', value: summary.activeMatches, href: '/admin/post-matches' },
    ],
    commercial: [
      { label: 'Negotiation → CA', value: `${summary.activeNegotiations} → ${summary.commercialAgreements}`, href: '/admin/reports' },
      { label: 'Active contracts', value: summary.activeContracts, href: '/admin/contracts' },
    ],
    reports: [
      { label: 'Open reports', value: 'Live metrics', href: '/admin/reports' },
    ],
    configuration: [
      { label: 'Runtime', value: summary.environment, href: '/admin/environments' },
    ],
    system: [
      { label: 'Platform health', value: summary.platformHealthLabel, href: '/admin/health' },
      { label: 'Data quality hints', value: risk.orphanHints, href: '/admin/data-quality' },
    ],
  }

  return {
    workspaceId,
    title: def.title,
    description: def.description,
    kpiLabels: kpiByWorkspace[workspaceId] ?? [
      { label: 'Users', value: summary.totalUsers },
      { label: 'Health', value: summary.platformHealthLabel },
    ],
    inboxPreview: inbox.length > 0 ? inbox : buildAdminInbox().slice(0, 5),
    domainLinks: def.domainLinks,
    actionCards,
    riskTone: workspaceRiskTone(actionCards),
    analytics: analyticsByWorkspace[workspaceId] ?? [],
    recentOps: buildRecentOperations(5),
  }
}

export function listKnownWorkspaceIds(): readonly string[] {
  return Object.keys(WORKSPACE_DEFS)
}
