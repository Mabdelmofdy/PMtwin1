import type { IStorageAdapter } from '@/types/storage.ts'
import type { ProductLanguageSettings } from '@/types/domain.ts'
import type {
  ProductLanguageLocale,
  ProductLanguageOverrides,
} from '../../../packages/product-language/src/index.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'

function keyFor(tenantId: string, locale: ProductLanguageLocale): string {
  return `${tenantId}:${locale}`
}

export class ProductLanguageSettingsRepository {
  private readonly storage: IStorageAdapter

  constructor(storage: IStorageAdapter) {
    this.storage = storage
  }

  private readOverrides(): Record<string, unknown> & {
    productLanguageSettings?: Record<string, ProductLanguageSettings>
  } {
    return (this.storage.get(OVERRIDES_KEY) ?? {}) as Record<string, unknown> & {
      productLanguageSettings?: Record<string, ProductLanguageSettings>
    }
  }

  private writeOverrides(overrides: Record<string, unknown>): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  getAll(): ProductLanguageSettings[] {
    const overrides = this.readOverrides()
    return Object.values(overrides.productLanguageSettings ?? {})
  }

  getByTenantLocale(
    tenantId: string,
    locale: ProductLanguageLocale,
  ): ProductLanguageSettings | undefined {
    const overrides = this.readOverrides()
    return overrides.productLanguageSettings?.[keyFor(tenantId, locale)]
  }

  upsert(input: {
    tenantId: string
    locale: ProductLanguageLocale
    overrides: ProductLanguageOverrides
    updatedBy: string
  }): ProductLanguageSettings {
    const settings: ProductLanguageSettings = {
      tenantId: input.tenantId,
      locale: input.locale,
      overrides: input.overrides,
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString(),
    }
    const allOverrides = this.readOverrides()
    allOverrides.productLanguageSettings = {
      ...allOverrides.productLanguageSettings,
      [keyFor(input.tenantId, input.locale)]: settings,
    }
    this.writeOverrides(allOverrides)
    return settings
  }
}
