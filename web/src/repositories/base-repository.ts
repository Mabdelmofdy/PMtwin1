import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'

export abstract class BaseRepository<T extends { id: string }> {
  protected readonly storage: IStorageAdapter
  protected readonly entityKey: keyof Overrides
  protected readonly loadSeed: () => T[]

  constructor(
    storage: IStorageAdapter,
    entityKey: keyof Overrides,
    loadSeed: () => T[],
  ) {
    this.storage = storage
    this.entityKey = entityKey
    this.loadSeed = loadSeed
  }

  protected readOverrides(): Overrides {
    return this.storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  }

  protected writeOverrides(overrides: Overrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  getAll(): T[] {
    return this.loadSeed()
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item) => item.id === id)
  }
}
