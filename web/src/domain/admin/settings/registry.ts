import type { AdminSettingsDefinition, AdminSettingsSectionId } from '@/domain/admin/settings/types.ts'

export const ADMIN_SETTINGS_REGISTRY: readonly AdminSettingsDefinition[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Platform identity, locale defaults, and registration.',
    capability: 'settings.general.manage',
    auditAction: 'settings.general.updated',
  },
  {
    id: 'access',
    title: 'User & Access',
    description: 'Invitation, session, and sensitive-action confirmation preferences.',
    capability: 'settings.access.manage',
    auditAction: 'settings.access.updated',
  },
  {
    id: 'vetting',
    title: 'Vetting',
    description: 'SLA and clarification preferences consumed by Admin Vetting.',
    capability: 'settings.vetting.manage',
    auditAction: 'settings.vetting.updated',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Admin marketplace display and moderation preferences.',
    capability: 'settings.marketplace.manage',
    auditAction: 'settings.marketplace.updated',
  },
  {
    id: 'matching',
    title: 'Matching',
    description: 'Safe matching adapter thresholds (algorithm unchanged).',
    capability: 'settings.matching.manage',
    auditAction: 'settings.matching.updated',
  },
  {
    id: 'readiness',
    title: 'Readiness',
    description: 'Admin presentation preferences for readiness warnings.',
    capability: 'settings.readiness.manage',
    auditAction: 'settings.readiness.updated',
  },
  {
    id: 'commercial',
    title: 'Commercial',
    description: 'Currency, VAT display, and award confirmation preferences.',
    capability: 'settings.commercial.manage',
    auditAction: 'settings.commercial.updated',
  },
  {
    id: 'contract',
    title: 'Contract',
    description: 'Numbering and legal-review display preferences.',
    capability: 'settings.contract.manage',
    auditAction: 'settings.contract.updated',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'In-app notification preferences (external delivery is preview-only).',
    capability: 'settings.notifications.manage',
    auditAction: 'settings.notifications.updated',
  },
  {
    id: 'localization',
    title: 'Localization',
    description: 'Language and direction preferences for Demo/UAT.',
    capability: 'settings.localization.manage',
    auditAction: 'settings.localization.updated',
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Brand colors and logo references consumed by Admin chrome.',
    capability: 'settings.branding.manage',
    auditAction: 'settings.branding.updated',
  },
] as const

export function getAdminSettingsDefinition(
  id: AdminSettingsSectionId,
): AdminSettingsDefinition | undefined {
  return ADMIN_SETTINGS_REGISTRY.find((entry) => entry.id === id)
}

export const FEATURE_FLAGS_CAPABILITY = 'feature-flags.manage'
export const FEATURE_FLAGS_AUDIT_ACTION = 'feature_flag.updated'
