import type { PlatformUser } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { BaseRepository } from './base-repository.ts'

export class UserRepository extends BaseRepository<PlatformUser> {
  constructor(storage: IStorageAdapter, loadSeed: () => PlatformUser[]) {
    super(storage, REPOSITORY_ENTITY_KEYS.user, loadSeed)
  }
}
