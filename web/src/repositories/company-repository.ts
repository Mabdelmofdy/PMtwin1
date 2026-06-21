import type { Company } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class CompanyRepository extends BaseRepository<Company> {
  constructor(storage: IStorageAdapter, loadSeed: () => Company[]) {
    super(storage, 'applications', loadSeed)
  }
}
