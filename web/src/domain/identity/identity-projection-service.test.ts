import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  IDENTITY_SCHEMA_VERSION,
  OWNERSHIP_SCHEMA_VERSION,
  workspaceIdForSource,
} from '@pm-twin/identity'
import type { PlatformUser } from '@/types/domain.ts'
import {
  buildIdentityProjection,
  ensureIdentityProjection,
} from './identity-projection-service.ts'
import {
  OVERRIDES_KEY,
  type IStorageAdapter,
  type Overrides,
} from '@/types/storage.ts'

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

const timestamp = '2026-07-12T00:00:00.000Z'
const users: PlatformUser[] = [
  {
    id: 'platform-admin',
    email: 'admin@example.test',
    role: 'admin',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'person-1',
    email: 'person@example.test',
    role: 'user',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'company-1',
    email: 'owner@example.test',
    role: 'company_owner',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]
const companies: PlatformUser[] = [
  {
    id: 'company-1',
    email: 'company@example.test',
    role: 'company',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]
const userRepository = { getAll: () => users }
const companyRepository = { getAll: () => companies }

describe('identity projection service', () => {
  it('excludes platform staff and links company owners', () => {
    const projection = buildIdentityProjection(
      userRepository,
      companyRepository,
    )

    assert.equal(
      projection.workspaces.some(
        (workspace) =>
          workspace.id === workspaceIdForSource('platform-admin', 'personal'),
      ),
      false,
    )
    assert.ok(
      projection.workspaces.some(
        (workspace) =>
          workspace.id === workspaceIdForSource('person-1', 'personal'),
      ),
    )
    assert.ok(
      projection.memberships.some(
        (membership) =>
          membership.userId === 'company-1' &&
          membership.workspaceId ===
            workspaceIdForSource('company-1', 'company'),
      ),
    )
  })

  it('writes missing overrides once and records schema versions', () => {
    const storage = new MemoryStorageAdapter()
    ensureIdentityProjection(storage, userRepository, companyRepository)
    const first = storage.get<Overrides>(OVERRIDES_KEY)
    assert.ok(first?.newWorkspaces?.length)
    assert.ok(first?.newWorkspaceMemberships?.length)
    assert.equal(first?.identitySchemaVersion, IDENTITY_SCHEMA_VERSION)
    assert.equal(first?.ownershipSchemaVersion, OWNERSHIP_SCHEMA_VERSION)

    ensureIdentityProjection(storage, userRepository, companyRepository)
    const second = storage.get<Overrides>(OVERRIDES_KEY)
    assert.deepEqual(second, first)
  })
})
