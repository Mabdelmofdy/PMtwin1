import type { IStorageAdapter } from '@/types/storage.ts'
import type { RuntimeMode } from '@/config/runtime-environment.ts'

export const DEMO_NAMESPACE_PREFIX = 'PMTWIN_DEMO_'
export const UAT_NAMESPACE_PREFIX = 'PMTWIN_UAT_'

export function getLocalStorageNamespacePrefix(mode: RuntimeMode): string | null {
  if (mode === 'demo') return DEMO_NAMESPACE_PREFIX
  if (mode === 'uat') return UAT_NAMESPACE_PREFIX
  return null
}

export class NamespacedStorageAdapter implements IStorageAdapter {
  private readonly storage: IStorageAdapter
  private readonly prefix: string

  constructor(storage: IStorageAdapter, prefix: string) {
    this.storage = storage
    this.prefix = prefix
  }

  get<T>(key: string): T | null {
    return this.storage.get<T>(this.toKey(key))
  }

  set<T>(key: string, value: T): void {
    this.storage.set(this.toKey(key), value)
  }

  remove(key: string): void {
    this.storage.remove(this.toKey(key))
  }

  clear(): void {
    if (typeof window === 'undefined') return

    const keysToRemove: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key)
    }
  }

  private toKey(key: string): string {
    return `${this.prefix}${key}`
  }
}

