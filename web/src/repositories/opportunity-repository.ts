import type { Opportunity } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class OpportunityRepository extends BaseRepository<Opportunity> {
  constructor(storage: IStorageAdapter, loadSeed: () => Opportunity[]) {
    super(storage, 'opportunities', loadSeed)
  }

  override getAll(): Opportunity[] {
    const base = this.loadSeed()
    const overrides = this.readOverrides().opportunities ?? {}
    return base.map((o) => ({ ...o, ...overrides[o.id] }))
  }

  update(id: string, patch: Partial<Opportunity>): void {
    const overrides = this.readOverrides()
    overrides.opportunities = {
      ...overrides.opportunities,
      [id]: {
        ...overrides.opportunities?.[id],
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }
    this.writeOverrides(overrides)
  }
}
