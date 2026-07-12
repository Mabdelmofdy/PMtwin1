import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import {
  FEATURE_FLAGS_AUDIT_ACTION,
  FEATURE_FLAGS_CAPABILITY,
  getAdminSettingsDefinition,
} from '@/domain/admin/settings/registry.ts'
import {
  validateAdminSettingsSection,
  validateFeatureFlagOverrides,
} from '@/domain/admin/settings/validate-admin-settings.ts'
import type {
  AdminSettingsDocument,
  AdminSettingsSectionId,
  AdminSettingsSections,
} from '@/domain/admin/settings/types.ts'
import { createDefaultAdminSettingsDocument } from '@/domain/admin/settings/defaults.ts'
import { isLockedFeatureFlag } from '@/domain/admin/settings/feature-flag-registry.ts'
import { adminSettingsRepository } from '@/repositories/admin-settings-repository.ts'
import { auditRepository } from '@/repositories/index.ts'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { resetMatchingEngineContextCacheForTests } from '@/infrastructure/matching/matching-engine-context.ts'
import type { AdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'

export type AdminSettingsCommandResult = {
  readonly ok: boolean
  readonly document?: AdminSettingsDocument
  readonly error?: string
  readonly fieldErrors?: Readonly<Record<string, string>>
}

function changedFields(previous: unknown, next: unknown): string[] {
  if (
    typeof previous !== 'object' ||
    previous === null ||
    typeof next !== 'object' ||
    next === null
  ) {
    return ['value']
  }
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])
  const changed: string[] = []
  for (const key of keys) {
    const a = (previous as Record<string, unknown>)[key]
    const b = (next as Record<string, unknown>)[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(key)
  }
  return changed
}

function resolveSectionCapability(
  role: string | undefined | null,
  sectionCapability: string,
): string | null {
  if (hasAdminCapability(role, 'admin.settings.manage')) return null
  return denyUnlessAuthorized(role, sectionCapability as AdminCapability)
}

export function executeUpdateAdminSettingsSection(input: {
  readonly sectionId: AdminSettingsSectionId
  readonly value: AdminSettingsSections[AdminSettingsSectionId]
  readonly actorId: string
  readonly actorRole: string | undefined | null
  readonly reason?: string
}): AdminSettingsCommandResult {
  const def = getAdminSettingsDefinition(input.sectionId)
  if (!def) return { ok: false, error: 'Unknown settings section' }

  const denied = resolveSectionCapability(input.actorRole, def.capability)
  if (denied) return { ok: false, error: denied }

  const validation = validateAdminSettingsSection(input.sectionId, input.value)
  if (!validation.ok) {
    return { ok: false, error: 'Validation failed', fieldErrors: validation.errors }
  }

  const current = adminSettingsRepository.get()
  const previousSection = current.sections[input.sectionId]
  const nextSections = {
    ...current.sections,
    [input.sectionId]: input.value,
  } as AdminSettingsSections

  const now = new Date().toISOString()
  const document: AdminSettingsDocument = {
    ...current,
    sections: nextSections,
    updatedAt: now,
    updatedBy: input.actorId,
    sectionMeta: {
      ...current.sectionMeta,
      [input.sectionId]: {
        updatedAt: now,
        updatedBy: input.actorId,
        updatedByRole: input.actorRole ?? undefined,
      },
    },
  }

  adminSettingsRepository.save(document)

  if (input.sectionId === 'matching') {
    resetMatchingEngineContextCacheForTests()
  }

  auditRepository.append({
    action: def.auditAction,
    userId: input.actorId,
    actorType: 'admin',
    entityType: 'admin_settings',
    entityId: input.sectionId,
    details: {
      environment: environmentContext.runtimeMode,
      actorRole: input.actorRole ?? null,
      section: input.sectionId,
      changedFields: changedFields(previousSection, input.value),
      previous: previousSection,
      next: input.value,
      reason: input.reason ?? null,
    },
  })

  return { ok: true, document }
}

export function executeResetAdminSettingsSection(input: {
  readonly sectionId: AdminSettingsSectionId
  readonly actorId: string
  readonly actorRole: string | undefined | null
  readonly reason?: string
}): AdminSettingsCommandResult {
  const defaults = createDefaultAdminSettingsDocument().sections[input.sectionId]
  return executeUpdateAdminSettingsSection({
    sectionId: input.sectionId,
    value: defaults,
    actorId: input.actorId,
    actorRole: input.actorRole,
    reason: input.reason ?? 'Reset section to defaults',
  })
}

export function executeUpdateFeatureFlag(input: {
  readonly key: string
  readonly value: boolean
  readonly actorId: string
  readonly actorRole: string | undefined | null
  readonly reason?: string
}): AdminSettingsCommandResult {
  if (isLockedFeatureFlag(input.key)) {
    return { ok: false, error: 'Locked architectural flag cannot be changed' }
  }

  const denied =
    hasAdminCapability(input.actorRole, 'admin.settings.manage')
      ? null
      : denyUnlessAuthorized(input.actorRole, FEATURE_FLAGS_CAPABILITY as AdminCapability)
  if (denied) return { ok: false, error: denied }

  const current = adminSettingsRepository.get()
  const nextOverrides = {
    ...current.featureFlagOverrides,
    [input.key]: input.value,
  }
  const validation = validateFeatureFlagOverrides(nextOverrides)
  if (!validation.ok) {
    return { ok: false, error: 'Validation failed', fieldErrors: validation.errors }
  }

  const previous = current.featureFlagOverrides[input.key]
  const now = new Date().toISOString()
  const document: AdminSettingsDocument = {
    ...current,
    featureFlagOverrides: nextOverrides,
    updatedAt: now,
    updatedBy: input.actorId,
    sectionMeta: {
      ...current.sectionMeta,
      feature_flags: {
        updatedAt: now,
        updatedBy: input.actorId,
        updatedByRole: input.actorRole ?? undefined,
      },
    },
  }
  adminSettingsRepository.save(document)

  auditRepository.append({
    action: FEATURE_FLAGS_AUDIT_ACTION,
    userId: input.actorId,
    actorType: 'admin',
    entityType: 'feature_flag',
    entityId: input.key,
    details: {
      environment: environmentContext.runtimeMode,
      actorRole: input.actorRole ?? null,
      key: input.key,
      previous: previous ?? null,
      next: input.value,
      reason: input.reason ?? null,
    },
  })

  return { ok: true, document }
}

export function executeResetAllAdminSettings(input: {
  readonly actorId: string
  readonly actorRole: string | undefined | null
}): AdminSettingsCommandResult {
  const denied = denyUnlessAuthorized(input.actorRole, 'admin.settings.manage')
  if (denied) return { ok: false, error: denied }
  const document = adminSettingsRepository.resetToDefaults(input.actorId)
  resetMatchingEngineContextCacheForTests()
  auditRepository.append({
    action: 'settings.reset_all',
    userId: input.actorId,
    actorType: 'admin',
    entityType: 'admin_settings',
    entityId: 'all',
    details: {
      environment: environmentContext.runtimeMode,
      actorRole: input.actorRole ?? null,
    },
  })
  return { ok: true, document }
}
