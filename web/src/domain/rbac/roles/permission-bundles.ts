/**
 * Role → permission bundle → scope model for Demo/UAT Admin.
 * Persist assignments in overrides later; defaults are in-code.
 */

import {
  isMutatingAdminRole,
  isPlatformStaffRole,
  toUnifiedAdminRole,
  type PlatformStaffRole,
} from '@/domain/rbac/roles/canonical-roles.ts'

export type AdminPermissionScope =
  | 'global'
  | 'tenant'
  | 'party'
  | 'region'
  | 'own'
  | 'assigned'
  | 'read_only'
  | 'sensitive_masked'

export type AdminCapability =
  | 'admin.portal.access'
  | 'admin.command_center.read'
  | 'admin.inbox.read'
  | 'admin.inbox.act'
  | 'admin.search.read'
  | 'admin.explorer.read'
  | 'admin.users.read'
  | 'admin.users.manage'
  | 'admin.parties.read'
  | 'admin.parties.manage'
  | 'admin.memberships.manage'
  | 'admin.roles.assign'
  | 'admin.vetting.read'
  | 'admin.vetting.manage'
  | 'admin.opportunities.read'
  | 'admin.opportunities.moderate'
  | 'admin.matching.read'
  | 'admin.matching.execute'
  | 'admin.negotiations.read'
  | 'admin.negotiations.transcript'
  | 'admin.commercial_agreements.read'
  | 'admin.commercial_agreements.approve'
  | 'admin.commercial_agreements.award'
  | 'admin.contracts.read'
  | 'admin.contracts.legal_review'
  | 'admin.reports.read'
  | 'admin.settings.manage'
  | 'settings.general.manage'
  | 'settings.access.manage'
  | 'settings.vetting.manage'
  | 'settings.marketplace.manage'
  | 'settings.matching.manage'
  | 'settings.readiness.manage'
  | 'settings.commercial.manage'
  | 'settings.contract.manage'
  | 'settings.notifications.manage'
  | 'settings.localization.manage'
  | 'settings.branding.manage'
  | 'feature-flags.manage'
  | 'admin.audit.read'
  | 'admin.audit.export'
  | 'admin.environment.manage'
  | 'admin.feature_flags.read'
  | 'admin.health.read'
  | 'admin.platform.execute'
  | 'admin.impersonate'
  | string

const ALL_CAPABILITIES: readonly AdminCapability[] = [
  'admin.portal.access',
  'admin.command_center.read',
  'admin.inbox.read',
  'admin.inbox.act',
  'admin.search.read',
  'admin.explorer.read',
  'admin.users.read',
  'admin.users.manage',
  'admin.parties.read',
  'admin.parties.manage',
  'admin.memberships.manage',
  'admin.roles.assign',
  'admin.vetting.read',
  'admin.vetting.manage',
  'admin.opportunities.read',
  'admin.opportunities.moderate',
  'admin.matching.read',
  'admin.matching.execute',
  'admin.negotiations.read',
  'admin.negotiations.transcript',
  'admin.commercial_agreements.read',
  'admin.commercial_agreements.approve',
  'admin.commercial_agreements.award',
  'admin.contracts.read',
  'admin.contracts.legal_review',
  'admin.reports.read',
  'admin.settings.manage',
  'settings.general.manage',
  'settings.access.manage',
  'settings.vetting.manage',
  'settings.marketplace.manage',
  'settings.matching.manage',
  'settings.readiness.manage',
  'settings.commercial.manage',
  'settings.contract.manage',
  'settings.notifications.manage',
  'settings.localization.manage',
  'settings.branding.manage',
  'feature-flags.manage',
  'admin.audit.read',
  'admin.audit.export',
  'admin.environment.manage',
  'admin.feature_flags.read',
  'admin.health.read',
  'admin.platform.execute',
]

const READ_BUNDLE: readonly AdminCapability[] = [
  'admin.portal.access',
  'admin.command_center.read',
  'admin.inbox.read',
  'admin.search.read',
  'admin.explorer.read',
  'admin.users.read',
  'admin.parties.read',
  'admin.vetting.read',
  'admin.opportunities.read',
  'admin.matching.read',
  'admin.negotiations.read',
  'admin.commercial_agreements.read',
  'admin.contracts.read',
  'admin.reports.read',
  'admin.audit.read',
  'admin.feature_flags.read',
  'admin.health.read',
]

const STAFF_BUNDLES: Readonly<Record<PlatformStaffRole, readonly AdminCapability[]>> = {
  super_admin: ['*'] as unknown as readonly AdminCapability[],
  platform_admin: ALL_CAPABILITIES,
  operations_admin: [
    ...READ_BUNDLE,
    'admin.inbox.act',
    'admin.vetting.manage',
    'admin.opportunities.moderate',
    'admin.matching.execute',
    'admin.platform.execute',
    'admin.users.manage',
  ],
  user_admin: [
    ...READ_BUNDLE,
    'admin.users.manage',
    'admin.parties.manage',
    'admin.memberships.manage',
    'admin.roles.assign',
  ],
  compliance_admin: [
    ...READ_BUNDLE,
    'admin.inbox.act',
    'admin.vetting.manage',
    'admin.contracts.legal_review',
    'admin.audit.export',
  ],
  finance_admin: [
    ...READ_BUNDLE,
    'admin.commercial_agreements.approve',
    'admin.commercial_agreements.award',
  ],
  content_admin: [
    ...READ_BUNDLE,
    'admin.settings.manage',
    'settings.general.manage',
    'settings.localization.manage',
    'settings.branding.manage',
    'settings.notifications.manage',
    'feature-flags.manage',
  ],
  support_admin: [
    ...READ_BUNDLE,
    'admin.inbox.act',
    'admin.users.manage',
    'admin.negotiations.transcript',
  ],
  moderator: [
    ...READ_BUNDLE,
    'admin.inbox.act',
    'admin.opportunities.moderate',
    'admin.vetting.manage',
    'admin.matching.execute',
    'admin.platform.execute',
    'settings.marketplace.manage',
    'settings.vetting.manage',
  ],
  auditor: [
    ...READ_BUNDLE,
    'admin.negotiations.transcript',
    'admin.audit.export',
  ],
  read_only_analyst: READ_BUNDLE,
}

export function capabilitiesForRole(
  role: string | undefined | null,
): readonly AdminCapability[] {
  if (!isPlatformStaffRole(role)) return []
  const unified = toUnifiedAdminRole(role)
  if (unified === 'user' || unified === 'company_owner') return []
  if (unified === 'platform_admin' || role?.toLowerCase() === 'admin') {
    return ALL_CAPABILITIES
  }
  return STAFF_BUNDLES[unified as PlatformStaffRole] ?? READ_BUNDLE
}

export function hasAdminCapability(
  role: string | undefined | null,
  capability: AdminCapability,
): boolean {
  if (!isPlatformStaffRole(role)) return false
  const caps = capabilitiesForRole(role)
  if ((caps as readonly string[]).includes('*')) return true
  return caps.includes(capability)
}

export function canMutateAsAdmin(role: string | undefined | null): boolean {
  return isMutatingAdminRole(role)
}

export function defaultScopeForRole(
  role: string | undefined | null,
): AdminPermissionScope {
  const unified = toUnifiedAdminRole(role)
  if (unified === 'auditor' || unified === 'read_only_analyst') return 'read_only'
  if (unified === 'support_admin') return 'assigned'
  return 'global'
}
