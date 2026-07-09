import type { PlatformUser } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

export class UserRepository extends BaseRepository<PlatformUser> {
  constructor(storage: IStorageAdapter, loadSeed: () => PlatformUser[]) {
    super(storage, REPOSITORY_ENTITY_KEYS.user, loadSeed)
  }

  override getAll(): PlatformUser[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: overrides.users,
      newItems: overrides.newUsers ?? [],
      deletedIds: overrides.deletedUsers ?? [],
    })
  }

  override getById(id: string): PlatformUser | undefined {
    return this.getAll().find((item) => item.id === id)
  }

  create(
    data: Omit<PlatformUser, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string },
  ): PlatformUser {
    const overrides = this.readOverrides()
    const now = new Date().toISOString()
    const user: PlatformUser = {
      ...data,
      status: data.status || 'active',
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    }
    overrides.newUsers = [...(overrides.newUsers ?? []), user]
    this.writeOverrides(overrides)
    return user
  }

  update(id: string, patch: Partial<PlatformUser>): PlatformUser | undefined {
    const overrides = this.readOverrides()
    const existing = this.getById(id)
    if (!existing) return undefined

    const updated: PlatformUser = {
      ...existing,
      ...patch,
      profile: patch.profile ? { ...existing.profile, ...patch.profile } : existing.profile,
      updatedAt: new Date().toISOString(),
    }

    const isNew = overrides.newUsers?.some((user) => user.id === id)
    if (isNew) {
      overrides.newUsers = overrides.newUsers!.map((user) => (user.id === id ? updated : user))
    } else {
      overrides.users = {
        ...overrides.users,
        [id]: {
          ...overrides.users?.[id],
          ...patch,
          profile: updated.profile,
          updatedAt: updated.updatedAt,
        },
      }
    }

    this.writeOverrides(overrides)
    return updated
  }
}
