/**
 * Workspace summary builder for admin workspace shells.
 */

import { buildAdminInbox } from './inbox-adapter.ts'
import { buildCommandCenterSummary, buildOperationsSummary } from './command-center-adapter.ts'
import type { AdminWorkspaceSummary } from './types.ts'

type WorkspaceDef = {
  readonly title: string
  readonly description: string
  readonly domainLinks: readonly { readonly label: string; readonly href: string }[]
}

const WORKSPACE_DEFS: Readonly<Record<string, WorkspaceDef>> = {
  identity: {
    title: 'Identity Workspace',
    description: 'Users, parties, memberships, and roles.',
    domainLinks: [
      { label: 'Users', href: '/admin/users' },
      { label: 'Parties', href: '/admin/parties' },
      { label: 'Memberships', href: '/admin/memberships' },
      { label: 'Roles', href: '/admin/roles' },
    ],
  },
  compliance: {
    title: 'Compliance Workspace',
    description: 'Vetting queues and compliance actions.',
    domainLinks: [
      { label: 'Vetting', href: '/admin/vetting' },
      { label: 'Vetting Config', href: '/admin/vetting/config' },
      { label: 'Inbox', href: '/admin/inbox' },
    ],
  },
  marketplace: {
    title: 'Marketplace Workspace',
    description: 'Opportunities, matching, and moderation.',
    domainLinks: [
      { label: 'Opportunities', href: '/admin/opportunities' },
      { label: 'Matching', href: '/admin/matching' },
      { label: 'PostMatches', href: '/admin/post-matches' },
      { label: 'Taxonomy', href: '/admin/taxonomy' },
      { label: 'Moderation', href: '/admin/moderation' },
    ],
  },
  commercial: {
    title: 'Commercial Workspace',
    description: 'Negotiations, Commercial Agreements, awards, and contracts.',
    domainLinks: [
      { label: 'Negotiations', href: '/admin/negotiations' },
      { label: 'Commercial Agreements', href: '/admin/commercial-agreements' },
      { label: 'Approvals', href: '/admin/approvals' },
      { label: 'Awards', href: '/admin/awards' },
      { label: 'Contracts', href: '/admin/contracts' },
      { label: 'Legal Review', href: '/admin/legal-review' },
    ],
  },
  reports: {
    title: 'Reports Workspace',
    description: 'Live platform metrics from repositories.',
    domainLinks: [{ label: 'Reports', href: '/admin/reports' }],
  },
  configuration: {
    title: 'Configuration Workspace',
    description: 'Platform settings and content configuration.',
    domainLinks: [
      { label: 'Settings', href: '/admin/settings' },
      { label: 'Skills', href: '/admin/skills' },
      { label: 'Site content', href: '/admin/site-content' },
    ],
  },
  system: {
    title: 'System Workspace',
    description: 'Health, environments, flags, and data quality.',
    domainLinks: [
      { label: 'Health', href: '/admin/health' },
      { label: 'Environments', href: '/admin/environments' },
      { label: 'Feature Flags', href: '/admin/feature-flags' },
      { label: 'Data Quality', href: '/admin/data-quality' },
      { label: 'Audit', href: '/admin/audit' },
    ],
  },
}

export function buildWorkspaceSummary(workspaceId: string): AdminWorkspaceSummary {
  const def = WORKSPACE_DEFS[workspaceId] ?? {
    title: `Workspace: ${workspaceId}`,
    description: 'Admin workspace overview.',
    domainLinks: [{ label: 'Command Center', href: '/admin' }],
  }

  const summary = buildCommandCenterSummary()
  const ops = buildOperationsSummary()
  const inbox = buildAdminInbox().slice(0, 5)

  const kpiByWorkspace: Record<string, AdminWorkspaceSummary['kpiLabels']> = {
    identity: [
      { label: 'Users', value: summary.totalUsers, href: '/admin/users' },
      { label: 'Parties', value: summary.totalParties, href: '/admin/parties' },
      { label: 'Pending vetting', value: summary.pendingVetting, href: '/admin/vetting' },
    ],
    compliance: [
      { label: 'Pending vetting', value: summary.pendingVetting, href: '/admin/vetting' },
      {
        label: 'Ops cards',
        value: ops.cards.filter((c) => c.id === 'pending_vetting').reduce((n, c) => n + c.count, 0),
        href: '/admin/inbox',
      },
    ],
    marketplace: [
      { label: 'Published opportunities', value: summary.publishedOpportunities, href: '/admin/opportunities' },
      { label: 'Active matches', value: summary.activeMatches, href: '/admin/post-matches' },
    ],
    commercial: [
      { label: 'Active negotiations', value: summary.activeNegotiations, href: '/admin/negotiations' },
      { label: 'Commercial Agreements', value: summary.commercialAgreements, href: '/admin/commercial-agreements' },
      { label: 'Active contracts', value: summary.activeContracts, href: '/admin/contracts' },
    ],
    reports: [
      { label: 'Users', value: summary.totalUsers },
      { label: 'Published opportunities', value: summary.publishedOpportunities },
      { label: 'Commercial Agreements', value: summary.commercialAgreements },
    ],
    configuration: [
      { label: 'Environment', value: summary.environment },
    ],
    system: [
      { label: 'Health', value: summary.platformHealthLabel, href: '/admin/health' },
      { label: 'Environment', value: summary.environment, href: '/admin/environments' },
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
    inboxPreview: inbox,
    domainLinks: def.domainLinks,
  }
}

export function listKnownWorkspaceIds(): readonly string[] {
  return Object.keys(WORKSPACE_DEFS)
}
