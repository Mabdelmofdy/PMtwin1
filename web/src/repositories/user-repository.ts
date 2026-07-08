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
}
