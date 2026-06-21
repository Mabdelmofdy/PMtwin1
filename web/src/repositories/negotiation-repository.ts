import type { Negotiation } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

export class NegotiationRepository extends BaseRepository<Negotiation> {
  constructor(storage: IStorageAdapter, loadSeed: () => Negotiation[]) {
    super(storage, 'negotiations', loadSeed)
  }

  override getAll(): Negotiation[] {
    const base = this.loadSeed()
    const overrides = this.readOverrides()
    const patchMap = (overrides.negotiations ?? {}) as Record<
      string,
      Partial<Negotiation>
    >
    return base.map((n) => ({ ...n, ...patchMap[n.id] }))
  }

  getByOpportunity(opportunityId: string): Negotiation[] {
    return this.getAll().filter((n) => n.opportunityId === opportunityId)
  }

  getByParty(userId: string): Negotiation[] {
    return this.getAll().filter((n) =>
      n.parties?.some((p) => p.userId === userId),
    )
  }

  update(id: string, patch: Partial<Negotiation>): void {
    const overrides = this.readOverrides()
    const existing = (overrides.negotiations ?? {}) as Record<
      string,
      Partial<Negotiation>
    >
    overrides.negotiations = {
      ...existing,
      [id]: {
        ...existing[id],
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    } as typeof overrides.negotiations
    this.writeOverrides(overrides)
  }
}
