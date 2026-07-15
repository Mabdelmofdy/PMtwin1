import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { UpdateUserSettingsCommand } from '@pm-twin/commands'
import type { IStorageAdapter } from '@/types/storage.ts'
import { UserSettingsRepository } from '@/repositories/user-settings-repository.ts'
import { UserSettingsCommandHandler } from '@/commands/handlers/user-settings-command-handler.ts'

class MemoryStorage implements IStorageAdapter {
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

describe('UserSettingsCommandHandler', () => {
  it('persists settings for the authenticated user', () => {
    const repository = new UserSettingsRepository(new MemoryStorage())
    const handler = new UserSettingsCommandHandler({
      repository,
      resolveActor: () => ({
        userId: 'user-1',
        userRole: 'user',
        platformRoles: [],
      }),
    })

    const command: UpdateUserSettingsCommand = {
      commandType: 'UpdateUserSettings',
      aggregateId: 'user-1',
      clientRequestId: 'request-1',
      payload: {
        userId: 'user-1',
        settingsPatch: {
          matching: { receiveRecommendations: false },
        },
      },
    }
    const result = handler.handle(command)

    assert.equal(result.success, true)
    assert.equal(repository.get('user-1').matching.receiveRecommendations, false)
  })

  it('rejects updates for another user', () => {
    const repository = new UserSettingsRepository(new MemoryStorage())
    const handler = new UserSettingsCommandHandler({
      repository,
      resolveActor: () => ({
        userId: 'user-1',
        userRole: 'user',
        platformRoles: [],
      }),
    })

    const command: UpdateUserSettingsCommand = {
      commandType: 'UpdateUserSettings',
      aggregateId: 'user-2',
      clientRequestId: 'request-2',
      payload: { userId: 'user-2', settingsPatch: {} },
    }
    const result = handler.handle(command)

    assert.equal(result.success, false)
    assert.match(result.errors?.[0] ?? '', /own settings/i)
  })
})
