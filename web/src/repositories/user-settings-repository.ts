import { createDefaultUserSettings } from '@/domain/user-settings/defaults.ts'
import type {
  UserSettingsDocument,
  UserSettingsPreferences,
} from '@/domain/user-settings/types.ts'
import { validateUserSettings } from '@/domain/user-settings/validation.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'

type UserSettingsOverrides = Record<string, unknown> & {
  userSettings?: Record<string, unknown>
}

function assertUserId(userId: string): void {
  if (userId.trim().length === 0) {
    throw new Error('User settings require a non-empty userId')
  }
}

export class UserSettingsRepository {
  private readonly storage: IStorageAdapter
  private readonly now: () => Date

  constructor(storage: IStorageAdapter, now: () => Date = () => new Date()) {
    this.storage = storage
    this.now = now
  }

  private readOverrides(): UserSettingsOverrides {
    const stored = this.storage.get<unknown>(OVERRIDES_KEY)
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {}
    return stored as UserSettingsOverrides
  }

  private writeOverrides(overrides: UserSettingsOverrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  get(userId: string): UserSettingsDocument {
    assertUserId(userId)
    const stored = this.readOverrides().userSettings?.[userId]
    const result = validateUserSettings(stored)
    if (result.valid && result.value.userId === userId) return result.value
    return createDefaultUserSettings(userId, this.now().toISOString())
  }

  upsert(userId: string, preferences: UserSettingsPreferences): UserSettingsDocument {
    assertUserId(userId)
    const overrides = this.readOverrides()
    const existing = validateUserSettings(overrides.userSettings?.[userId])
    const timestamp = this.now().toISOString()
    const defaults = createDefaultUserSettings(userId, timestamp)
    const next: UserSettingsDocument = {
      ...defaults,
      privacy: {
        contactOptIns: { ...preferences.privacy.contactOptIns },
        publicProfile: { ...preferences.privacy.publicProfile },
      },
      notifications: {
        inApp: { ...preferences.notifications.inApp },
      },
      interface: { ...preferences.interface },
      matching: { ...preferences.matching },
      createdAt:
        existing.valid && existing.value.userId === userId
          ? existing.value.createdAt
          : timestamp,
      updatedAt: timestamp,
    }
    const validation = validateUserSettings(next)
    if (!validation.valid) {
      throw new Error(`Invalid user settings: ${validation.errors.join('; ')}`)
    }

    this.writeOverrides({
      ...overrides,
      userSettings: {
        ...overrides.userSettings,
        [userId]: validation.value,
      },
    })
    return validation.value
  }
}
