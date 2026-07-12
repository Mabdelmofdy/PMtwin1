import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import type { AdminSettingsDocument } from '@/domain/admin/settings/types.ts'
import { createDefaultAdminSettingsDocument } from '@/domain/admin/settings/defaults.ts'
import { ADMIN_SETTINGS_SCHEMA_VERSION } from '@/domain/admin/settings/types.ts'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'

function isDocument(value: unknown): value is AdminSettingsDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sections' in value &&
    'schemaVersion' in value
  )
}

export class AdminSettingsRepository {
  private readonly storage: IStorageAdapter

  constructor(storage: IStorageAdapter) {
    this.storage = storage
  }

  private readOverrides(): Overrides {
    return (this.storage.get<Overrides>(OVERRIDES_KEY) ?? {}) as Overrides
  }

  private writeOverrides(overrides: Overrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  /** Effective document — defaults when unset (does not write). */
  get(): AdminSettingsDocument {
    const stored = this.readOverrides().adminSettings
    if (isDocument(stored)) {
      const defaults = createDefaultAdminSettingsDocument(stored.updatedBy)
      return {
        ...defaults,
        ...stored,
        sections: {
          ...defaults.sections,
          ...stored.sections,
          general: { ...defaults.sections.general, ...stored.sections.general },
          access: { ...defaults.sections.access, ...stored.sections.access },
          vetting: { ...defaults.sections.vetting, ...stored.sections.vetting },
          marketplace: { ...defaults.sections.marketplace, ...stored.sections.marketplace },
          matching: { ...defaults.sections.matching, ...stored.sections.matching },
          readiness: { ...defaults.sections.readiness, ...stored.sections.readiness },
          commercial: { ...defaults.sections.commercial, ...stored.sections.commercial },
          contract: { ...defaults.sections.contract, ...stored.sections.contract },
          notifications: {
            ...defaults.sections.notifications,
            ...stored.sections.notifications,
          },
          localization: {
            ...defaults.sections.localization,
            ...stored.sections.localization,
          },
          branding: { ...defaults.sections.branding, ...stored.sections.branding },
        },
        featureFlagOverrides: stored.featureFlagOverrides ?? {},
        sectionMeta: stored.sectionMeta ?? {},
        schemaVersion: stored.schemaVersion || ADMIN_SETTINGS_SCHEMA_VERSION,
      }
    }
    return createDefaultAdminSettingsDocument('system')
  }

  hasOverride(): boolean {
    return isDocument(this.readOverrides().adminSettings)
  }

  save(document: AdminSettingsDocument): AdminSettingsDocument {
    const next: AdminSettingsDocument = {
      ...document,
      schemaVersion: ADMIN_SETTINGS_SCHEMA_VERSION,
      updatedAt: document.updatedAt || new Date().toISOString(),
    }
    const overrides = this.readOverrides()
    overrides.adminSettings = next
    this.writeOverrides(overrides)
    return next
  }

  clear(): void {
    const overrides = this.readOverrides()
    delete overrides.adminSettings
    this.writeOverrides(overrides)
  }

  resetToDefaults(updatedBy: string): AdminSettingsDocument {
    const doc = createDefaultAdminSettingsDocument(updatedBy)
    return this.save(doc)
  }
}

export let adminSettingsRepository = new AdminSettingsRepository(
  environmentContext.storageAdapter ?? localStorageAdapter,
)

/** Test-only: point settings persistence at an isolated memory adapter. */
export function replaceAdminSettingsRepositoryForTests(
  next: AdminSettingsRepository,
): void {
  adminSettingsRepository = next
}
