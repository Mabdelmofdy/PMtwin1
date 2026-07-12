/**
 * Feature flag classification for Demo/UAT Admin.
 * Editable flags persist in adminSettings.featureFlagOverrides.
 * Locked flags remain read-only with an explicit reason.
 */

export type FeatureFlagKind = 'editable' | 'locked'

export type FeatureFlagDefinition = {
  readonly key: string
  readonly label: string
  readonly kind: FeatureFlagKind
  readonly defaultValue: boolean | string
  readonly reason?: string
  readonly group: 'product' | 'runtime'
}

export const FEATURE_FLAG_REGISTRY: readonly FeatureFlagDefinition[] = [
  {
    key: 'showLegacyApplications',
    label: 'Show legacy applications workflow',
    kind: 'editable',
    defaultValue: false,
    group: 'product',
  },
  {
    key: 'showEnvironmentBanner',
    label: 'Show environment banner (customer surfaces)',
    kind: 'editable',
    defaultValue: false,
    group: 'runtime',
  },
  {
    key: 'runtimeMode',
    label: 'Runtime mode',
    kind: 'locked',
    defaultValue: 'demo',
    reason: 'Bootstrapped from VITE_RUNTIME_MODE — changing it would break namespace isolation.',
    group: 'runtime',
  },
  {
    key: 'usesNamespacedLocalStorage',
    label: 'Namespaced LocalStorage',
    kind: 'locked',
    defaultValue: true,
    reason: 'Architectural persistence contract for Demo/UAT isolation.',
    group: 'runtime',
  },
  {
    key: 'storageTypeLabel',
    label: 'Storage type label',
    kind: 'locked',
    defaultValue: 'LocalStorage',
    reason: 'Derived from runtime mode; not a user-editable product setting.',
    group: 'runtime',
  },
] as const

export function getEditableFeatureFlagKeys(): readonly string[] {
  return FEATURE_FLAG_REGISTRY.filter((f) => f.kind === 'editable').map((f) => f.key)
}

export function isLockedFeatureFlag(key: string): boolean {
  return FEATURE_FLAG_REGISTRY.some((f) => f.key === key && f.kind === 'locked')
}

export function getFeatureFlagDefinition(key: string): FeatureFlagDefinition | undefined {
  return FEATURE_FLAG_REGISTRY.find((f) => f.key === key)
}
