import type { PlatformUser } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class UserRepository extends BaseRepository<PlatformUser> {
  constructor(storage: IStorageAdapter, loadSeed: () => PlatformUser[]) {
    super(storage, 'applications', loadSeed)
  }
}
