import { canManageProductLanguageForRole } from '@/domain/rbac/admin-access.ts'
import { productLanguageSettingsRepository } from '@/repositories/index.ts'
import type { ProductLanguageSettings } from '@/types/domain.ts'
import type {
  ProductLanguageLocale,
  ProductLanguageOverrides,
} from '../../../packages/product-language/src/index.ts'

export function updateProductLanguageSettings(input: {
  tenantId: string
  locale: ProductLanguageLocale
  overrides: ProductLanguageOverrides
  updatedBy: string
  role?: string | null
}): ProductLanguageSettings | null {
  if (!canManageProductLanguageForRole(input.role)) {
    return null
  }
  return productLanguageSettingsRepository.upsert({
    tenantId: input.tenantId,
    locale: input.locale,
    overrides: input.overrides,
    updatedBy: input.updatedBy,
  })
}
