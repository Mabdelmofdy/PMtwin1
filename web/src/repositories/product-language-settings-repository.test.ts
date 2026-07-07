import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ProductLanguageSettingsRepository } from '@/repositories/product-language-settings-repository.ts'
import type { IStorageAdapter } from '@/types/storage.ts'

function createMemoryStorage(): IStorageAdapter {
  const bag = new Map<string, unknown>()
  return {
    get<T>(key: string): T | null {
      return (bag.get(key) as T | undefined) ?? null
    },
    set<T>(key: string, value: T): void {
      bag.set(key, value)
    },
    remove(key: string): void {
      bag.delete(key)
    },
    clear(): void {
      bag.clear()
    },
  }
}

describe('ProductLanguageSettingsRepository', () => {
  it('stores and resolves tenant/locale scoped overrides', () => {
    const repository = new ProductLanguageSettingsRepository(createMemoryStorage())
    repository.upsert({
      tenantId: 'tenant-a',
      locale: 'en',
      updatedBy: 'admin-1',
      overrides: {
        entities: { opportunity: { label: 'Project' } },
      },
    })

    const entry = repository.getByTenantLocale('tenant-a', 'en')
    assert.equal(entry?.tenantId, 'tenant-a')
    assert.equal(entry?.locale, 'en')
    assert.equal(entry?.overrides.entities?.opportunity?.label, 'Project')
  })
})
