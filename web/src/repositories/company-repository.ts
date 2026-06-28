import type { Company } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { BaseRepository } from './base-repository.ts'

export class CompanyRepository extends BaseRepository<Company> {
  constructor(storage: IStorageAdapter, loadSeed: () => Company[]) {
    super(storage, REPOSITORY_ENTITY_KEYS.company, loadSeed)
  }
}
