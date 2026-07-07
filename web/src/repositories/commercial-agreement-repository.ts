import type { CommercialAgreement } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'

function resolvePostMatchId(commercialAgreement: CommercialAgreement): string | undefined {
  return commercialAgreement.postMatchId ?? commercialAgreement.matchId ?? undefined
}

export class CommercialAgreementRepository extends BaseRepository<CommercialAgreement> {
  constructor(storage: IStorageAdapter, loadSeed: () => CommercialAgreement[]) {
    super(storage, 'commercialAgreements', loadSeed)
  }

  override getAll(): CommercialAgreement[] {
    const base = this.loadSeed()
    const overrides = this.readOverrides()
    const patchMap = ((overrides.commercialAgreements ?? overrides.deals ?? {}) as Record<
      string,
      Partial<CommercialAgreement>
    >)
    const patched = base.map((item) => ({ ...item, ...patchMap[item.id] }))
    const newItems = ((overrides.newCommercialAgreements ?? overrides.newDeals ?? []) as CommercialAgreement[])
    return [...patched, ...newItems]
  }

  findByPostMatchId(postMatchId: string): CommercialAgreement | undefined {
    return this.getAll().find((item) => resolvePostMatchId(item) === postMatchId)
  }

  findByNegotiationId(negotiationId: string): CommercialAgreement | undefined {
    return this.getAll().find((item) => item.negotiationId === negotiationId)
  }

  findByApplicationId(applicationId: string): CommercialAgreement | undefined {
    return this.getAll().find((item) => item.applicationId === applicationId)
  }

  create(data: Omit<CommercialAgreement, 'id' | 'createdAt' | 'updatedAt'>): CommercialAgreement {
    const overrides = this.readOverrides()
    const commercialAgreement: CommercialAgreement = {
      ...data,
      id: `ca-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const existing = (overrides.newCommercialAgreements ?? overrides.newDeals ?? []) as CommercialAgreement[]
    overrides.newCommercialAgreements = [...existing, commercialAgreement] as typeof overrides.newCommercialAgreements
    this.writeOverrides(overrides)
    return commercialAgreement
  }

  update(id: string, patch: Partial<CommercialAgreement>): void {
    const overrides = this.readOverrides()
    const newItems = (overrides.newCommercialAgreements ?? overrides.newDeals ?? []) as CommercialAgreement[]
    const isNew = newItems.some((item) => item.id === id)
    if (isNew) {
      overrides.newCommercialAgreements = newItems.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
      ) as typeof overrides.newCommercialAgreements
    } else {
      const existing = ((overrides.commercialAgreements ?? overrides.deals ?? {}) as Record<
        string,
        Partial<CommercialAgreement>
      >)
      overrides.commercialAgreements = {
        ...existing,
        [id]: {
          ...existing[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      } as typeof overrides.commercialAgreements
    }
    this.writeOverrides(overrides)
  }
}
