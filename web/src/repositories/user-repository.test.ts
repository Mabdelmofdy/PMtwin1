import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildEnvironmentSnapshotOverrides } from '@/infrastructure/environment/environment-snapshot-overrides.ts'
import { EXPORT_SCHEMA_VERSION, EXPORT_TYPE } from '@/infrastructure/environment/environment-export-service.ts'
import { loadUsers } from '@/infrastructure/seed/seed-loader.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import type { IStorageAdapter } from '@/types/storage.ts'

class MemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value)
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

describe('UserRepository snapshot merge', () => {
  it('restores imported users from snapshot overrides', () => {
    const storage = new MemoryStorageAdapter()
    const importedUsers = [
      {
        id: 'import-user-1',
        email: 'imported@test',
        role: 'admin' as const,
        status: 'active' as const,
      },
    ]

    storage.set(
      OVERRIDES_KEY,
      buildEnvironmentSnapshotOverrides({
        metadata: {
          exportType: EXPORT_TYPE,
          schemaVersion: EXPORT_SCHEMA_VERSION,
          applicationVersion: 'dev',
          seedVersion: '1.0.0',
          runtimeMode: 'demo',
          exportedBy: 'test',
          exportedAt: '2026-07-07T00:00:00.000Z',
        },
        users: importedUsers,
        companies: [],
        opportunities: [],
        postMatches: [],
        negotiations: [],
        negotiationMessages: [],
        negotiationOffers: [],
        negotiationTranscriptEvents: [],
        commercialAgreements: [],
        contracts: [],
        applications: [],
        audit: [],
        notifications: [],
      }),
    )

    const repository = new UserRepository(storage, loadUsers)
    const users = repository.getAll()

    assert.equal(users.length, 1)
    assert.equal(users[0]?.id, 'import-user-1')
    assert.equal(loadUsers().some((seedUser) => seedUser.id === 'import-user-1'), false)
  })
})
