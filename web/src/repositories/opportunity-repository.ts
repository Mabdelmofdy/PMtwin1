import type { Opportunity } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { normalizeOpportunityCollaboration } from '@/domain/collaboration/opportunity-collaboration.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

function createOpportunityId(): string {
  return `opp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export class OpportunityRepository extends BaseRepository<Opportunity> {
  constructor(storage: IStorageAdapter, loadSeed: () => Opportunity[]) {
    super(storage, 'opportunities', loadSeed)
  }

  override getAll(): Opportunity[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: overrides.opportunities,
      newItems: overrides.newOpportunities ?? [],
      deletedIds: overrides.deletedOpportunities ?? [],
      normalize: normalizeOpportunityCollaboration,
    })
  }

  override getById(id: string): Opportunity | undefined {
    return this.getAll().find((item) => item.id === id)
  }

  listPublishedForMarketplace(): Opportunity[] {
    return this.getAll().filter(
      (item) => (item.visibilityStatus ?? '').toLowerCase() === 'published',
    )
  }

  update(id: string, patch: Partial<Opportunity>): void {
    const overrides = this.readOverrides()
    const isNew = overrides.newOpportunities?.some((o) => o.id === id)
    if (isNew) {
      overrides.newOpportunities = overrides.newOpportunities!.map((o) =>
        o.id === id
          ? { ...o, ...patch, updatedAt: new Date().toISOString() }
          : o,
      )
    } else {
      overrides.opportunities = {
        ...overrides.opportunities,
        [id]: {
          ...overrides.opportunities?.[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }
    }
    this.writeOverrides(overrides)
  }

  create(
    data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Opportunity {
    const overrides = this.readOverrides()
    const now = new Date().toISOString()
    const opportunity: Opportunity = {
      ...data,
      id: data.id ?? createOpportunityId(),
      status: data.status || 'draft',
      visibilityStatus: data.visibilityStatus,
      createdAt: now,
      updatedAt: now,
    }
    overrides.newOpportunities = [
      ...(overrides.newOpportunities ?? []),
      opportunity,
    ]
    this.writeOverrides(overrides)
    return opportunity
  }
}
