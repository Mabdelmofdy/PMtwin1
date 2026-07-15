import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createDefaultUserSettings } from '@/domain/user-settings/defaults.ts'
import type { UserSettingsPreferences } from '@/domain/user-settings/types.ts'
import { subscribeDataStore } from '@/hooks/use-data-store.ts'
import { UserSettingsRepository } from '@/repositories/user-settings-repository.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'

class MemoryStorageAdapter implements IStorageAdapter {
  private readonly values = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.values.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.values.set(key, value)
  }

  remove(key: string): void {
    this.values.delete(key)
  }

  clear(): void {
    this.values.clear()
  }
}

function preferencesFor(
  userId: string,
  overrides: Partial<UserSettingsPreferences> = {},
): UserSettingsPreferences {
  const defaults = createDefaultUserSettings(userId)
  return {
    privacy: overrides.privacy ?? defaults.privacy,
    notifications: overrides.notifications ?? defaults.notifications,
    interface: overrides.interface ?? defaults.interface,
    matching: overrides.matching ?? defaults.matching,
  }
}

describe('UserSettingsRepository', () => {
  it('returns per-user defaults without writing storage', () => {
    const storage = new MemoryStorageAdapter()
    const repository = new UserSettingsRepository(
      storage,
      () => new Date('2026-07-15T08:00:00.000Z'),
    )

    const settings = repository.get('user-a')

    assert.equal(settings.userId, 'user-a')
    assert.equal(settings.createdAt, '2026-07-15T08:00:00.000Z')
    assert.equal(storage.get(OVERRIDES_KEY), null)
  })

  it('upserts users independently, preserves timestamps and notifies subscribers', () => {
    const storage = new MemoryStorageAdapter()
    storage.set(OVERRIDES_KEY, { unrelated: { preserved: true } })
    let now = '2026-07-15T08:00:00.000Z'
    const repository = new UserSettingsRepository(storage, () => new Date(now))
    let notifications = 0
    const unsubscribe = subscribeDataStore(() => {
      notifications += 1
    })

    const first = repository.upsert('user-a', preferencesFor('user-a'))
    repository.upsert('user-b', preferencesFor('user-b'))
    now = '2026-07-15T09:00:00.000Z'
    const updated = repository.upsert(
      'user-a',
      preferencesFor('user-a', {
        interface: {
          direction: 'rtl',
          theme: 'dark',
          density: 'compact',
        },
      }),
    )
    unsubscribe()

    assert.equal(first.createdAt, '2026-07-15T08:00:00.000Z')
    assert.equal(updated.createdAt, first.createdAt)
    assert.equal(updated.updatedAt, '2026-07-15T09:00:00.000Z')
    assert.equal(repository.get('user-a').interface.direction, 'rtl')
    assert.equal(repository.get('user-b').interface.direction, 'auto')
    assert.equal(notifications, 3)

    const persisted = storage.get<Record<string, unknown>>(OVERRIDES_KEY)
    assert.deepEqual(persisted?.unrelated, { preserved: true })
  })

  it('rejects malformed runtime input instead of persisting it', () => {
    const storage = new MemoryStorageAdapter()
    const repository = new UserSettingsRepository(storage)
    const valid = preferencesFor('user-a')
    const malformed = {
      ...valid,
      interface: {
        ...valid.interface,
        density: 'oversized',
      },
    } as unknown as UserSettingsPreferences

    assert.throws(
      () => repository.upsert('user-a', malformed),
      /Invalid user settings/,
    )
    assert.equal(storage.get(OVERRIDES_KEY), null)
  })

  it('migrates stored privacy settings created before social visibility existed', () => {
    const storage = new MemoryStorageAdapter()
    const legacy = createDefaultUserSettings(
      'user-a',
      '2026-07-15T08:00:00.000Z',
    )
    storage.set(OVERRIDES_KEY, {
      userSettings: {
        'user-a': {
          ...legacy,
          privacy: {
            ...legacy.privacy,
            publicProfile: {
              published: true,
              showPhone: false,
              showWebsite: true,
              showLinkedIn: false,
            },
          },
        },
      },
    })

    const settings = new UserSettingsRepository(storage).get('user-a')

    assert.equal(settings.privacy.publicProfile.published, true)
    assert.equal(settings.privacy.publicProfile.showWebsite, true)
    assert.equal(settings.privacy.publicProfile.showSocialLinks, false)
  })
})
