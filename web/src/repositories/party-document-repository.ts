import type { PartyDocument } from '@/types/party-document.ts'
import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'
import { partyIdLookupAliases } from '@/domain/party/party-projection.ts'

function createPartyDocumentId(): string {
  return `pdoc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export class PartyDocumentRepository {
  private readonly storage: IStorageAdapter
  private readonly loadSeed: () => PartyDocument[]

  constructor(storage: IStorageAdapter, loadSeed: () => PartyDocument[] = () => []) {
    this.storage = storage
    this.loadSeed = loadSeed
  }

  private readOverrides(): Overrides {
    return this.storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  }

  private writeOverrides(overrides: Overrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  getAll(): PartyDocument[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: overrides.partyDocuments,
      newItems: overrides.newPartyDocuments ?? [],
      deletedIds: overrides.deletedPartyDocuments ?? [],
    })
  }

  listForParty(ownerPartyId: string): PartyDocument[] {
    const aliases = new Set(partyIdLookupAliases(ownerPartyId))
    return this.getAll().filter((document) => aliases.has(document.ownerPartyId))
  }

  getById(id: string): PartyDocument | undefined {
    return this.getAll().find((document) => document.id === id)
  }

  create(
    data: Omit<PartyDocument, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string },
  ): PartyDocument {
    const overrides = this.readOverrides()
    const document: PartyDocument = {
      ...data,
      id: data.id ?? createPartyDocumentId(),
      uploadedAt: data.uploadedAt ?? new Date().toISOString(),
    }
    overrides.newPartyDocuments = [...(overrides.newPartyDocuments ?? []), document]
    this.writeOverrides(overrides)
    return document
  }

  update(id: string, patch: Partial<PartyDocument>): PartyDocument | undefined {
    const overrides = this.readOverrides()
    const existing = this.getById(id)
    if (!existing) return undefined

    const isNew = overrides.newPartyDocuments?.some((document) => document.id === id)
    const updated = { ...existing, ...patch }

    if (isNew) {
      overrides.newPartyDocuments = overrides.newPartyDocuments!.map((document) =>
        document.id === id ? updated : document,
      )
    } else {
      overrides.partyDocuments = {
        ...overrides.partyDocuments,
        [id]: {
          ...overrides.partyDocuments?.[id],
          ...patch,
        },
      }
    }

    this.writeOverrides(overrides)
    return updated
  }
}
