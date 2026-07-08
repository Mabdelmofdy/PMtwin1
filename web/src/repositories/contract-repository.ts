import type { Contract } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

export class ContractRepository extends BaseRepository<Contract> {
  constructor(storage: IStorageAdapter, loadSeed: () => Contract[]) {
    super(storage, 'contracts', loadSeed)
  }

  override getAll(): Contract[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: (overrides.contracts ?? {}) as Record<string, Partial<Contract>>,
      newItems: (overrides.newContracts ?? []) as Contract[],
      deletedIds: overrides.deletedContracts ?? [],
    })
  }

  findByDealId(dealId: string): Contract[] {
    return this.getAll().filter((contract) => contract.dealId === dealId)
  }

  create(
    data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>,
  ): Contract {
    const overrides = this.readOverrides()
    const contract: Contract = {
      ...data,
      id: `contract-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const existing = (overrides.newContracts ?? []) as Contract[]
    overrides.newContracts = [...existing, contract] as typeof overrides.newContracts
    this.writeOverrides(overrides)
    return contract
  }

  update(id: string, patch: Partial<Contract>): void {
    const overrides = this.readOverrides()
    const newContracts = (overrides.newContracts ?? []) as Contract[]
    const isNew = newContracts.some((contract) => contract.id === id)
    if (isNew) {
      overrides.newContracts = newContracts.map((contract) =>
        contract.id === id
          ? { ...contract, ...patch, updatedAt: new Date().toISOString() }
          : contract,
      ) as typeof overrides.newContracts
    } else {
      const existing = (overrides.contracts ?? {}) as Record<
        string,
        Partial<Contract>
      >
      overrides.contracts = {
        ...existing,
        [id]: {
          ...existing[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      } as typeof overrides.contracts
    }
    this.writeOverrides(overrides)
  }
}
