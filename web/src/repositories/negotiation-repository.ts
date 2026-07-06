import type { Negotiation } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { toCanonical } from '@pm-twin/lifecycle'
import { BaseRepository } from './base-repository.ts'

const NEGOTIATION_ENTITY = 'negotiation' as const
const ACTIVE_NEGOTIATION_STATUSES = new Set(['active', 'countered'])

function isActiveStatus(status: string | undefined): boolean {
  const canonical = toCanonical(NEGOTIATION_ENTITY, status ?? '') ?? ''
  return ACTIVE_NEGOTIATION_STATUSES.has(canonical)
}

function resolvePostMatchId(negotiation: Negotiation): string | undefined {
  return negotiation.postMatchId ?? negotiation.matchId
}

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
    const patched = base.map((n) => ({ ...n, ...patchMap[n.id] }))
    return [...patched, ...(overrides.newNegotiations ?? [])]
  }

  getByOpportunity(opportunityId: string): Negotiation[] {
    return this.getAll().filter(
      (n) =>
        n.opportunityId === opportunityId ||
        n.needOpportunityId === opportunityId ||
        n.offerOpportunityId === opportunityId,
    )
  }

  getByParty(userId: string): Negotiation[] {
    return this.getAll().filter((n) =>
      (n.participants ?? n.parties)?.some((p) => p.userId === userId),
    )
  }

  getByPostMatchId(postMatchId: string): Negotiation[] {
    return this.getAll().filter(
      (n) => resolvePostMatchId(n) === postMatchId,
    )
  }

  findActiveByPostMatchId(postMatchId: string): Negotiation | undefined {
    return this.getByPostMatchId(postMatchId).find((n) =>
      isActiveStatus(n.status),
    )
  }

  getByApplicationId(applicationId: string): Negotiation[] {
    return this.getAll().filter((n) => n.applicationId === applicationId)
  }

  findActiveByApplicationId(applicationId: string): Negotiation | undefined {
    return this.getByApplicationId(applicationId).find((n) =>
      isActiveStatus(n.status),
    )
  }

  create(
    data: Omit<Negotiation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Negotiation {
    const overrides = this.readOverrides()
    const now = new Date().toISOString()
    const negotiation: Negotiation = {
      ...data,
      id: `neg-${Date.now()}`,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    }
    overrides.newNegotiations = [
      ...(overrides.newNegotiations ?? []),
      negotiation,
    ]
    this.writeOverrides(overrides)
    return negotiation
  }

  update(id: string, patch: Partial<Negotiation>): void {
    const overrides = this.readOverrides()
    const newNegotiations = overrides.newNegotiations ?? []
    const isNew = newNegotiations.some((n) => n.id === id)
    if (isNew) {
      overrides.newNegotiations = newNegotiations.map((n) =>
        n.id === id
          ? { ...n, ...patch, updatedAt: new Date().toISOString() }
          : n,
      )
    } else {
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
      }
    }
    this.writeOverrides(overrides)
  }
}
