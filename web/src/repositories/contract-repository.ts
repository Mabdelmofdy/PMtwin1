import type { Contract } from '@/types/domain.ts'
import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class ContractRepository extends BaseRepository<Contract> {
  constructor(storage: IStorageAdapter, loadSeed: () => Contract[]) {
    super(storage, 'contracts' as keyof Overrides, loadSeed)
  }

  override getAll(): Contract[] {
    return this.loadSeed()
  }

  create(
    data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>,
  ): Contract {
    const contract: Contract = {
      ...data,
      id: `contract-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return contract
  }

  update(_id: string, _patch: Partial<Contract>): void {
    // placeholder for future persistence
  }
}
