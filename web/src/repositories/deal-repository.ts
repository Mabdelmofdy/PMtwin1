import type { Deal } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

function resolvePostMatchId(deal: Deal): string | undefined {
  return deal.postMatchId ?? deal.matchId ?? undefined
}

export class DealRepository extends BaseRepository<Deal> {
  constructor(storage: IStorageAdapter, loadSeed: () => Deal[]) {
    super(storage, 'deals', loadSeed)
  }

  override getAll(): Deal[] {
    const base = this.loadSeed()
    const overrides = this.readOverrides()
    const patchMap = (overrides.deals ?? {}) as Record<
      string,
      Partial<Deal>
    >
    const patched = base.map((d) => ({ ...d, ...patchMap[d.id] }))
    const newDeals = (overrides.newDeals ?? []) as Deal[]
    return [...patched, ...newDeals]
  }

  findByPostMatchId(postMatchId: string): Deal | undefined {
    return this.getAll().find((deal) => resolvePostMatchId(deal) === postMatchId)
  }

  findByNegotiationId(negotiationId: string): Deal | undefined {
    return this.getAll().find((deal) => deal.negotiationId === negotiationId)
  }

  create(data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Deal {
    const overrides = this.readOverrides()
    const deal: Deal = {
      ...data,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const existing = (overrides.newDeals ?? []) as Deal[]
    overrides.newDeals = [...existing, deal] as typeof overrides.newDeals
    this.writeOverrides(overrides)
    return deal
  }

  update(id: string, patch: Partial<Deal>): void {
    const overrides = this.readOverrides()
    const newDeals = (overrides.newDeals ?? []) as Deal[]
    const isNew = newDeals.some((d) => d.id === id)
    if (isNew) {
      overrides.newDeals = newDeals.map((d) =>
        d.id === id
          ? { ...d, ...patch, updatedAt: new Date().toISOString() }
          : d,
      ) as typeof overrides.newDeals
    } else {
      const existing = (overrides.deals ?? {}) as Record<
        string,
        Partial<Deal>
      >
      overrides.deals = {
        ...existing,
        [id]: {
          ...existing[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      } as typeof overrides.deals
    }
    this.writeOverrides(overrides)
  }
}
