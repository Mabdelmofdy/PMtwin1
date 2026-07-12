import type { Opportunity } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { normalizeOpportunityCollaboration } from '@/domain/collaboration/opportunity-collaboration.ts'
import {
  resolveOpportunityOwnership,
  withCanonicalOpportunityOwnership,
  type OpportunityOwnershipContext,
} from '@/domain/identity/ownership-adapters.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

function createOpportunityId(): string {
  return `opp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export class OpportunityRepository extends BaseRepository<Opportunity> {
  private readonly loadOwnershipContext: () => OpportunityOwnershipContext

  constructor(
    storage: IStorageAdapter,
    loadSeed: () => Opportunity[],
    loadOwnershipContext: () => OpportunityOwnershipContext = () => ({
      companyIds: new Set<string>(),
      userIds: new Set<string>(),
    }),
  ) {
    super(storage, 'opportunities', loadSeed)
    this.loadOwnershipContext = loadOwnershipContext
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

  listByWorkspaceId(workspaceId: string): Opportunity[] {
    const context = this.loadOwnershipContext()
    return this.getAll().filter(
      (item) =>
        resolveOpportunityOwnership(item, context).workspaceId === workspaceId,
    )
  }

  listByOwnerPartyId(ownerPartyId: string): Opportunity[] {
    const context = this.loadOwnershipContext()
    return this.getAll().filter(
      (item) =>
        resolveOpportunityOwnership(item, context).ownerPartyId === ownerPartyId,
    )
  }

  update(id: string, patch: Partial<Opportunity>): void {
    const overrides = this.readOverrides()
    const existing = this.getById(id)
    if (!existing) return
    const canonical = withCanonicalOpportunityOwnership(
      { ...existing, ...patch },
      this.loadOwnershipContext(),
    )
    const canonicalPatch: Partial<Opportunity> = {
      ...patch,
      workspaceId: canonical.workspaceId,
      ownerPartyId: canonical.ownerPartyId,
      createdByUserId: canonical.createdByUserId,
      createdByActorType: canonical.createdByActor.actorType,
    }
    const isNew = overrides.newOpportunities?.some((o) => o.id === id)
    if (isNew) {
      overrides.newOpportunities = overrides.newOpportunities!.map((o) =>
        o.id === id
          ? { ...o, ...canonicalPatch, updatedAt: new Date().toISOString() }
          : o,
      )
    } else {
      overrides.opportunities = {
        ...overrides.opportunities,
        [id]: {
          ...overrides.opportunities?.[id],
          ...canonicalPatch,
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
    const canonical = withCanonicalOpportunityOwnership(
      data,
      this.loadOwnershipContext(),
    )
    const opportunity: Opportunity = {
      ...data,
      workspaceId: canonical.workspaceId,
      ownerPartyId: canonical.ownerPartyId,
      createdByUserId: canonical.createdByUserId,
      createdByActorType: canonical.createdByActor.actorType,
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

  /** Soft-delete via deletedOpportunities override list (draft lifecycle only). */
  softDelete(id: string): void {
    const overrides = this.readOverrides()
    const deleted = new Set(overrides.deletedOpportunities ?? [])
    deleted.add(id)
    overrides.deletedOpportunities = [...deleted]
    overrides.newOpportunities = (overrides.newOpportunities ?? []).filter(
      (item) => item.id !== id,
    )
    if (overrides.opportunities?.[id]) {
      const nextPatches = { ...overrides.opportunities }
      delete nextPatches[id]
      overrides.opportunities = nextPatches
    }
    this.writeOverrides(overrides)
  }
}
