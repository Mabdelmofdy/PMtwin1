import type { NegotiationMessage } from '@/types/negotiation-discussion.ts'
import { NEGOTIATION_MESSAGES_STORAGE_KEY } from '@/types/negotiation-discussion.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'

export class NegotiationMessageRepository {
  private readonly storage: IStorageAdapter
  private readonly loadSeed: () => NegotiationMessage[]

  constructor(
    storage: IStorageAdapter,
    loadSeed: () => NegotiationMessage[] = () => [],
  ) {
    this.storage = storage
    this.loadSeed = loadSeed
  }

  private readAll(): NegotiationMessage[] {
    const stored =
      this.storage.get<NegotiationMessage[]>(NEGOTIATION_MESSAGES_STORAGE_KEY)
    if (stored) return stored
    const seeded = this.loadSeed()
    if (seeded.length > 0) {
      this.storage.set(NEGOTIATION_MESSAGES_STORAGE_KEY, seeded)
      return seeded
    }
    return []
  }

  private writeAll(messages: NegotiationMessage[]): void {
    this.storage.set(NEGOTIATION_MESSAGES_STORAGE_KEY, messages)
    notifyDataStore()
  }

  getByNegotiationId(negotiationId: string): NegotiationMessage[] {
    return this.readAll()
      .filter((message) => message.negotiationId === negotiationId && !message.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  getById(id: string): NegotiationMessage | undefined {
    return this.readAll().find((message) => message.id === id)
  }

  append(message: NegotiationMessage): NegotiationMessage {
    this.writeAll([...this.readAll(), message])
    return message
  }

  update(id: string, patch: Partial<NegotiationMessage>): NegotiationMessage | undefined {
    const all = this.readAll()
    const index = all.findIndex((message) => message.id === id)
    if (index < 0) return undefined
    const updated = { ...all[index], ...patch }
    all[index] = updated
    this.writeAll(all)
    return updated
  }
}
