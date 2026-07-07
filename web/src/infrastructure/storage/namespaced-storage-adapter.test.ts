import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { IStorageAdapter } from '@/types/storage.ts'
import {
  DEMO_NAMESPACE_PREFIX,
  UAT_NAMESPACE_PREFIX,
  getLocalStorageNamespacePrefix,
  NamespacedStorageAdapter,
} from '@/infrastructure/storage/namespaced-storage-adapter.ts'

class MemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value)
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

describe('getLocalStorageNamespacePrefix', () => {
  it('returns the expected prefix for demo and uat', () => {
    assert.equal(getLocalStorageNamespacePrefix('demo'), DEMO_NAMESPACE_PREFIX)
    assert.equal(getLocalStorageNamespacePrefix('uat'), UAT_NAMESPACE_PREFIX)
  })

  it('returns null for production', () => {
    assert.equal(getLocalStorageNamespacePrefix('production'), null)
  })
})

describe('NamespacedStorageAdapter', () => {
  it('prefixes get/set/remove keys through the wrapped adapter', () => {
    const storage = new MemoryStorageAdapter()
    const namespaced = new NamespacedStorageAdapter(storage, DEMO_NAMESPACE_PREFIX)

    namespaced.set('pmtwin_web_overrides', { users: {} })
    assert.deepEqual(
      storage.get('PMTWIN_DEMO_pmtwin_web_overrides'),
      { users: {} },
    )

    assert.deepEqual(
      namespaced.get('pmtwin_web_overrides'),
      { users: {} },
    )

    namespaced.remove('pmtwin_web_overrides')
    assert.equal(storage.get('PMTWIN_DEMO_pmtwin_web_overrides'), null)
  })
})

