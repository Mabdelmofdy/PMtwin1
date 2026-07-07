import type { NegotiationTranscriptEvent } from '@/types/negotiation-discussion.ts'
import { NEGOTIATION_TRANSCRIPT_STORAGE_KEY } from '@/types/negotiation-discussion.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'

export class NegotiationTranscriptRepository {
  private readonly storage: IStorageAdapter
  private readonly loadSeed: () => NegotiationTranscriptEvent[]

  constructor(
    storage: IStorageAdapter,
    loadSeed: () => NegotiationTranscriptEvent[] = () => [],
  ) {
    this.storage = storage
    this.loadSeed = loadSeed
  }

  private readAll(): NegotiationTranscriptEvent[] {
    const stored = this.storage.get<NegotiationTranscriptEvent[]>(
      NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
    )
    if (stored) return stored
    const seeded = this.loadSeed()
    if (seeded.length > 0) {
      this.storage.set(NEGOTIATION_TRANSCRIPT_STORAGE_KEY, seeded)
      return seeded
    }
    return []
  }

  /** Append-only — updates and deletes are intentionally unsupported. */
  append(event: NegotiationTranscriptEvent): NegotiationTranscriptEvent {
    const all = this.readAll()
    this.storage.set(NEGOTIATION_TRANSCRIPT_STORAGE_KEY, [...all, event])
    notifyDataStore()
    return event
  }

  getByNegotiationId(negotiationId: string): NegotiationTranscriptEvent[] {
    return this.readAll()
      .filter((event) => event.negotiationId === negotiationId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  isLocked(negotiationId: string): boolean {
    return this.getByNegotiationId(negotiationId).some(
      (event) => event.eventType === 'transcript.locked',
    )
  }
}
