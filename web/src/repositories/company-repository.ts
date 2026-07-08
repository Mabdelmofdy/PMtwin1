import type { Company } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

export class CompanyRepository extends BaseRepository<Company> {
  constructor(storage: IStorageAdapter, loadSeed: () => Company[]) {
    super(storage, REPOSITORY_ENTITY_KEYS.company, loadSeed)
  }

  override getAll(): Company[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: overrides.companies,
      newItems: overrides.newCompanies ?? [],
      deletedIds: overrides.deletedCompanies ?? [],
    })
  }

  override getById(id: string): Company | undefined {
    return this.getAll().find((item) => item.id === id)
  }
}
