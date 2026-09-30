import type { ExchangeMode } from '@pm-twin/collaboration-models'
import { getSubModel } from '@pm-twin/collaboration-models'
import {
  COMMERCIAL_COMPONENT_TYPES,
  type CommercialComponentType,
} from './types.ts'

/**
 * Map sub-model allowedExchangeModes onto selectable commercial component types.
 * `hybrid` is derived when multiple components are enabled — it is not a button.
 * `revenue_sharing` and `custom` are commercial components, not ExchangeMode values.
 * When hybrid is allowed, both stay selectable and serialize to hybrid.
 */
export function allowedCommercialComponentTypesForSubModel(
  subModelType: string | null | undefined,
): readonly CommercialComponentType[] {
  const sub = subModelType?.trim() ? getSubModel(subModelType.trim()) : undefined
  if (!sub) return COMMERCIAL_COMPONENT_TYPES

  return filterCommercialComponentTypesByExchangeModes(sub.allowedExchangeModes)
}

export function filterCommercialComponentTypesByExchangeModes(
  allowedExchangeModes: readonly ExchangeMode[],
): readonly CommercialComponentType[] {
  if (allowedExchangeModes.length === 0) return COMMERCIAL_COMPONENT_TYPES

  const allowed = new Set<CommercialComponentType>()
  for (const mode of allowedExchangeModes) {
    if (mode === 'hybrid') continue
    if ((COMMERCIAL_COMPONENT_TYPES as readonly string[]).includes(mode)) {
      allowed.add(mode as CommercialComponentType)
    }
  }
  if (allowedExchangeModes.includes('hybrid')) {
    allowed.add('custom')
    allowed.add('revenue_sharing')
  }

  if (allowed.size === 0) return COMMERCIAL_COMPONENT_TYPES
  return COMMERCIAL_COMPONENT_TYPES.filter((type) => allowed.has(type))
}
