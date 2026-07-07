import type { NegotiationOffer } from '@/types/negotiation-discussion.ts'
import { NEGOTIATION_OFFERS_STORAGE_KEY } from '@/types/negotiation-discussion.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'

export class NegotiationOfferRepository {
  private readonly storage: IStorageAdapter
  private readonly loadSeed: () => NegotiationOffer[]

  constructor(
    storage: IStorageAdapter,
    loadSeed: () => NegotiationOffer[] = () => [],
  ) {
    this.storage = storage
    this.loadSeed = loadSeed
  }

  private readAll(): NegotiationOffer[] {
    const stored = this.storage.get<NegotiationOffer[]>(NEGOTIATION_OFFERS_STORAGE_KEY)
    if (stored) return stored
    const seeded = this.loadSeed()
    if (seeded.length > 0) {
      this.storage.set(NEGOTIATION_OFFERS_STORAGE_KEY, seeded)
      return seeded
    }
    return []
  }

  private writeAll(offers: NegotiationOffer[]): void {
    this.storage.set(NEGOTIATION_OFFERS_STORAGE_KEY, offers)
    notifyDataStore()
  }

  getByNegotiationId(negotiationId: string): NegotiationOffer[] {
    return this.readAll()
      .filter((offer) => offer.negotiationId === negotiationId)
      .sort((a, b) => a.version - b.version || a.createdAt.localeCompare(b.createdAt))
  }

  getById(id: string): NegotiationOffer | undefined {
    return this.readAll().find((offer) => offer.id === id)
  }

  getLatestVersion(negotiationId: string): number {
    const offers = this.getByNegotiationId(negotiationId)
    return offers.reduce((max, offer) => Math.max(max, offer.version), 0)
  }

  getAcceptedOffer(negotiationId: string): NegotiationOffer | undefined {
    return this.getByNegotiationId(negotiationId).find((offer) => offer.status === 'accepted')
  }

  append(offer: NegotiationOffer): NegotiationOffer {
    this.writeAll([...this.readAll(), offer])
    return offer
  }

  updateMany(
    ids: readonly string[],
    patch: Partial<NegotiationOffer>,
  ): void {
    const idSet = new Set(ids)
    const all = this.readAll().map((offer) =>
      idSet.has(offer.id) ? { ...offer, ...patch } : offer,
    )
    this.writeAll(all)
  }
}
