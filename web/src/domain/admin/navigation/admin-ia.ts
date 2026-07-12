/**
 * Admin information architecture — Command Center, Workspaces, Explore, domains.
 */

export type AdminNavSectionId =
  | 'command_center'
  | 'workspaces'
  | 'explore'
  | 'identity'
  | 'compliance'
  | 'marketplace'
  | 'commercial'
  | 'reports'
  | 'configuration'
  | 'system'

export type AdminNavLink = {
  readonly title: string
  readonly href: string
  readonly keywords?: readonly string[]
  readonly capability?: string
}

export type AdminNavSection = {
  readonly id: AdminNavSectionId
  readonly title: string
  readonly items: readonly AdminNavLink[]
}

export const ADMIN_IA_SECTIONS: readonly AdminNavSection[] = [
  {
    id: 'command_center',
    title: 'Command Center',
    items: [
      { title: 'Executive', href: '/admin', keywords: ['dashboard', 'command'], capability: 'admin.command_center.read' },
      { title: 'Operations', href: '/admin/command-center/operations', keywords: ['ops', 'queue'], capability: 'admin.command_center.read' },
      { title: 'Risk & Compliance', href: '/admin/command-center/risk', keywords: ['risk'], capability: 'admin.command_center.read' },
      { title: 'My Queue', href: '/admin/command-center/my-queue', keywords: ['assigned'], capability: 'admin.inbox.read' },
      { title: 'Admin Inbox', href: '/admin/inbox', keywords: ['inbox', 'work'], capability: 'admin.inbox.read' },
    ],
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    items: [
      { title: 'Identity', href: '/admin/workspaces/identity', capability: 'admin.users.read' },
      { title: 'Compliance', href: '/admin/workspaces/compliance', capability: 'admin.vetting.read' },
      { title: 'Marketplace', href: '/admin/workspaces/marketplace', capability: 'admin.opportunities.read' },
      { title: 'Commercial', href: '/admin/workspaces/commercial', capability: 'admin.commercial_agreements.read' },
      { title: 'Reports', href: '/admin/workspaces/reports', capability: 'admin.reports.read' },
      { title: 'Configuration', href: '/admin/workspaces/configuration', capability: 'admin.settings.manage' },
      { title: 'System', href: '/admin/workspaces/system', capability: 'admin.health.read' },
    ],
  },
  {
    id: 'explore',
    title: 'Explore',
    items: [
      { title: 'Global Search', href: '/admin/search', keywords: ['search', 'find'], capability: 'admin.search.read' },
      { title: 'Platform Explorer', href: '/admin/explorer', keywords: ['explorer', 'catalogue'], capability: 'admin.explorer.read' },
    ],
  },
  {
    id: 'identity',
    title: 'Identity & Access',
    items: [
      { title: 'Users', href: '/admin/users', capability: 'admin.users.read' },
      { title: 'Parties', href: '/admin/parties', capability: 'admin.parties.read' },
      { title: 'Memberships', href: '/admin/memberships', capability: 'admin.parties.read' },
      { title: 'Roles', href: '/admin/roles', capability: 'admin.roles.assign' },
    ],
  },
  {
    id: 'compliance',
    title: 'Onboarding & Vetting',
    items: [
      { title: 'Vetting', href: '/admin/vetting', capability: 'admin.vetting.read' },
      { title: 'Vetting Config', href: '/admin/vetting/config', capability: 'admin.vetting.manage' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    items: [
      { title: 'Opportunities', href: '/admin/opportunities', capability: 'admin.opportunities.read' },
      { title: 'Matching', href: '/admin/matching', capability: 'admin.matching.read' },
      { title: 'PostMatches', href: '/admin/post-matches', capability: 'admin.matching.read' },
      { title: 'Matching Quality', href: '/admin/matching/quality', capability: 'admin.matching.read' },
      { title: 'Taxonomy', href: '/admin/taxonomy', capability: 'admin.opportunities.read' },
      { title: 'Moderation', href: '/admin/moderation', capability: 'admin.opportunities.moderate' },
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial Operations',
    items: [
      { title: 'Negotiations', href: '/admin/negotiations', capability: 'admin.negotiations.read' },
      { title: 'Commercial Agreements', href: '/admin/commercial-agreements', capability: 'admin.commercial_agreements.read' },
      { title: 'Approvals', href: '/admin/approvals', capability: 'admin.commercial_agreements.approve' },
      { title: 'Award Management', href: '/admin/awards', capability: 'admin.commercial_agreements.award' },
      { title: 'Contracts', href: '/admin/contracts', capability: 'admin.contracts.read' },
      { title: 'Legal Review', href: '/admin/legal-review', capability: 'admin.contracts.legal_review' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    items: [
      { title: 'Reports', href: '/admin/reports', capability: 'admin.reports.read' },
    ],
  },
  {
    id: 'configuration',
    title: 'Platform Configuration',
    items: [
      { title: 'Settings', href: '/admin/settings', capability: 'admin.settings.manage' },
      { title: 'Skills', href: '/admin/skills', capability: 'admin.settings.manage' },
      { title: 'Site content', href: '/admin/site-content', capability: 'admin.settings.manage' },
    ],
  },
  {
    id: 'system',
    title: 'System Administration',
    items: [
      { title: 'Audit', href: '/admin/audit', capability: 'admin.audit.read' },
      { title: 'Environments', href: '/admin/environments', capability: 'admin.environment.manage' },
      { title: 'Health', href: '/admin/health', capability: 'admin.health.read' },
      { title: 'Feature Flags', href: '/admin/feature-flags', capability: 'admin.feature_flags.read' },
      { title: 'Data Quality', href: '/admin/data-quality', capability: 'admin.health.read' },
      { title: 'Failed Commands', href: '/admin/failed-commands', capability: 'admin.health.read' },
    ],
  },
] as const

export function allAdminIaHrefs(): readonly string[] {
  return ADMIN_IA_SECTIONS.flatMap((section) => section.items.map((item) => item.href))
}
