import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { IStorageAdapter } from '@/types/storage.ts'
import {
  ensureEnvironmentBootstrap,
  readEnvironmentBootstrapMetadata,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'

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

describe('ensureEnvironmentBootstrap', () => {
  it('writes metadata on first bootstrap', () => {
    const storage = new MemoryStorageAdapter()
    const result = ensureEnvironmentBootstrap(storage, 'demo')
    assert.equal(result.didBootstrap, true)
    assert.equal(result.metadata.mode, 'demo')
    assert.equal(result.metadata.seedVersion, '1.0.0')
    assert.ok(result.metadata.bootstrappedAt.length > 0)
  })

  it('is idempotent after first bootstrap', () => {
    const storage = new MemoryStorageAdapter()
    const first = ensureEnvironmentBootstrap(storage, 'uat')
    const second = ensureEnvironmentBootstrap(storage, 'uat')

    assert.equal(first.didBootstrap, true)
    assert.equal(second.didBootstrap, false)
    assert.deepEqual(second.metadata, first.metadata)
  })

  it('exposes persisted metadata through the read helper', () => {
    const storage = new MemoryStorageAdapter()
    ensureEnvironmentBootstrap(storage, 'demo')

    const metadata = readEnvironmentBootstrapMetadata(storage)
    assert.equal(metadata?.mode, 'demo')
  })
})

