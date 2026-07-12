import type { AdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'

export type AdminPageRegistryEntry = {
  readonly id: string
  readonly href: string
  readonly title: string
  readonly section: string
  readonly capability: AdminCapability
  readonly plannedShell?: boolean
}

/** Canonical admin page registry — one href per surface. */
export const ADMIN_PAGE_REGISTRY: readonly AdminPageRegistryEntry[] = [
  { id: 'executive', href: '/admin', title: 'Executive Command Center', section: 'command_center', capability: 'admin.command_center.read' },
  { id: 'operations', href: '/admin/command-center/operations', title: 'Operations', section: 'command_center', capability: 'admin.command_center.read' },
  { id: 'risk', href: '/admin/command-center/risk', title: 'Risk & Compliance', section: 'command_center', capability: 'admin.command_center.read' },
  { id: 'my_queue', href: '/admin/command-center/my-queue', title: 'My Queue', section: 'command_center', capability: 'admin.inbox.read' },
  { id: 'inbox', href: '/admin/inbox', title: 'Admin Inbox', section: 'command_center', capability: 'admin.inbox.read' },
  { id: 'ws_identity', href: '/admin/workspaces/identity', title: 'Identity Workspace', section: 'workspaces', capability: 'admin.users.read' },
  { id: 'ws_compliance', href: '/admin/workspaces/compliance', title: 'Compliance Workspace', section: 'workspaces', capability: 'admin.vetting.read' },
  { id: 'ws_marketplace', href: '/admin/workspaces/marketplace', title: 'Marketplace Workspace', section: 'workspaces', capability: 'admin.opportunities.read' },
  { id: 'ws_commercial', href: '/admin/workspaces/commercial', title: 'Commercial Workspace', section: 'workspaces', capability: 'admin.commercial_agreements.read' },
  { id: 'ws_reports', href: '/admin/workspaces/reports', title: 'Reports Workspace', section: 'workspaces', capability: 'admin.reports.read' },
  { id: 'ws_configuration', href: '/admin/workspaces/configuration', title: 'Configuration Workspace', section: 'workspaces', capability: 'admin.settings.manage' },
  { id: 'ws_system', href: '/admin/workspaces/system', title: 'System Workspace', section: 'workspaces', capability: 'admin.health.read' },
  { id: 'search', href: '/admin/search', title: 'Global Search', section: 'explore', capability: 'admin.search.read' },
  { id: 'explorer', href: '/admin/explorer', title: 'Platform Explorer', section: 'explore', capability: 'admin.explorer.read' },
  { id: 'users', href: '/admin/users', title: 'Users', section: 'identity', capability: 'admin.users.read' },
  { id: 'parties', href: '/admin/parties', title: 'Parties', section: 'identity', capability: 'admin.parties.read' },
  { id: 'memberships', href: '/admin/memberships', title: 'Memberships', section: 'identity', capability: 'admin.parties.read' },
  { id: 'roles', href: '/admin/roles', title: 'Roles', section: 'identity', capability: 'admin.roles.assign' },
  { id: 'vetting', href: '/admin/vetting', title: 'Vetting', section: 'compliance', capability: 'admin.vetting.read' },
  { id: 'vetting_config', href: '/admin/vetting/config', title: 'Vetting Config', section: 'compliance', capability: 'admin.vetting.manage', plannedShell: true },
  { id: 'opportunities', href: '/admin/opportunities', title: 'Opportunities', section: 'marketplace', capability: 'admin.opportunities.read' },
  { id: 'matching', href: '/admin/matching', title: 'Matching', section: 'marketplace', capability: 'admin.matching.read' },
  { id: 'post_matches', href: '/admin/post-matches', title: 'PostMatches', section: 'marketplace', capability: 'admin.matching.read' },
  { id: 'matching_quality', href: '/admin/matching/quality', title: 'Matching Quality', section: 'marketplace', capability: 'admin.matching.read' },
  { id: 'taxonomy', href: '/admin/taxonomy', title: 'Taxonomy', section: 'marketplace', capability: 'admin.opportunities.read' },
  { id: 'moderation', href: '/admin/moderation', title: 'Moderation', section: 'marketplace', capability: 'admin.opportunities.moderate' },
  { id: 'negotiations', href: '/admin/negotiations', title: 'Negotiations', section: 'commercial', capability: 'admin.negotiations.read' },
  { id: 'commercial_agreements', href: '/admin/commercial-agreements', title: 'Commercial Agreements', section: 'commercial', capability: 'admin.commercial_agreements.read' },
  { id: 'approvals', href: '/admin/approvals', title: 'Approvals', section: 'commercial', capability: 'admin.commercial_agreements.approve' },
  { id: 'awards', href: '/admin/awards', title: 'Award Management', section: 'commercial', capability: 'admin.commercial_agreements.award' },
  { id: 'contracts', href: '/admin/contracts', title: 'Contracts', section: 'commercial', capability: 'admin.contracts.read' },
  { id: 'legal_review', href: '/admin/legal-review', title: 'Legal Review', section: 'commercial', capability: 'admin.contracts.legal_review' },
  { id: 'reports', href: '/admin/reports', title: 'Reports', section: 'reports', capability: 'admin.reports.read' },
  { id: 'settings', href: '/admin/settings', title: 'Settings', section: 'configuration', capability: 'admin.settings.manage' },
  { id: 'skills', href: '/admin/skills', title: 'Skills', section: 'configuration', capability: 'admin.settings.manage', plannedShell: true },
  { id: 'site_content', href: '/admin/site-content', title: 'Site content', section: 'configuration', capability: 'admin.settings.manage', plannedShell: true },
  { id: 'subscriptions', href: '/admin/subscriptions', title: 'Subscriptions', section: 'configuration', capability: 'admin.settings.manage', plannedShell: true },
  { id: 'disputes', href: '/admin/disputes', title: 'Disputes', section: 'commercial', capability: 'admin.commercial_agreements.read', plannedShell: true },
  { id: 'audit', href: '/admin/audit', title: 'Audit', section: 'system', capability: 'admin.audit.read' },
  { id: 'environments', href: '/admin/environments', title: 'Environments', section: 'system', capability: 'admin.environment.manage' },
  { id: 'health', href: '/admin/health', title: 'Health', section: 'system', capability: 'admin.health.read' },
  { id: 'feature_flags', href: '/admin/feature-flags', title: 'Feature Flags', section: 'system', capability: 'admin.feature_flags.read' },
  { id: 'data_quality', href: '/admin/data-quality', title: 'Data Quality', section: 'system', capability: 'admin.health.read' },
  { id: 'failed_commands', href: '/admin/failed-commands', title: 'Failed Commands', section: 'system', capability: 'admin.health.read' },
] as const

export function getAdminPageByHref(href: string): AdminPageRegistryEntry | undefined {
  const normalized = href.replace(/\/$/, '') || '/admin'
  return ADMIN_PAGE_REGISTRY.find((page) => page.href === normalized)
}

export function getAdminCapabilityForPath(pathname: string): AdminCapability {
  const exact = getAdminPageByHref(pathname)
  if (exact) return exact.capability
  const prefix = ADMIN_PAGE_REGISTRY
    .filter((page) => pathname.startsWith(`${page.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return prefix?.capability ?? 'admin.portal.access'
}
