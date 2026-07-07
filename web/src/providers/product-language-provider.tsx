import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useAuth } from '@/providers/auth-provider.tsx'
import { usePmDirection } from '@/components/layout/pm-direction-provider.tsx'
import { resolvePublicLocale } from '@/config/public-i18n.ts'
import { productLanguageSettingsRepository } from '@/repositories/index.ts'
import {
  configureProductLanguageRuntime,
  productLanguage,
} from '@/lib/product-language.ts'
import { canManageProductLanguageForRole } from '@/domain/rbac/admin-access.ts'
import { updateProductLanguageSettings } from '@/services/product-language-settings-service.ts'
import type { ProductLanguageSettings } from '@/types/domain.ts'
import type {
  ProductLanguageLocale,
  ProductLanguageOverrides,
} from '../../../packages/product-language/src/index.ts'

type ProductLanguageContextValue = {
  locale: ProductLanguageLocale
  tenantId: string
  canEdit: boolean
  settings: ProductLanguageSettings | null
  productLanguage: typeof productLanguage
  updateSettings: (overrides: ProductLanguageOverrides) => ProductLanguageSettings | null
}

const ProductLanguageContext = createContext<ProductLanguageContextValue | null>(null)

export function ProductLanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { direction } = usePmDirection()

  const locale = resolvePublicLocale(direction)
  const tenantId = user?.tenantId ?? user?.organizationId ?? 'default'
  const canEdit = canManageProductLanguageForRole(user?.role)
  const settings = productLanguageSettingsRepository.getByTenantLocale(tenantId, locale)

  configureProductLanguageRuntime({
    locale,
    tenantId,
    overrides: settings?.overrides,
  })

  const updateSettings = useCallback(
    (overrides: ProductLanguageOverrides) => {
      if (!user?.id || !canEdit) return null
      const updated = updateProductLanguageSettings({
        tenantId,
        locale,
        overrides,
        updatedBy: user.id,
        role: user.role,
      })
      if (!updated) return null
      configureProductLanguageRuntime({
        locale,
        tenantId,
        overrides: updated.overrides,
      })
      return updated
    },
    [canEdit, locale, tenantId, user?.id],
  )

  const value = useMemo<ProductLanguageContextValue>(
    () => ({
      locale,
      tenantId,
      canEdit,
      settings: settings ?? null,
      productLanguage,
      updateSettings,
    }),
    [locale, tenantId, canEdit, settings, updateSettings],
  )

  return <ProductLanguageContext.Provider value={value}>{children}</ProductLanguageContext.Provider>
}

export function useProductLanguage() {
  const context = useContext(ProductLanguageContext)
  if (!context) {
    throw new Error('useProductLanguage must be used within ProductLanguageProvider')
  }
  return context
}
