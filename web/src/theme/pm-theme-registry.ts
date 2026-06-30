/**
 * PM-Twin theme registry (DDS-004).
 * Only enterprise-light and enterprise-dark are active in Phase 4.
 */
import type { PmThemeDefinition, ThemeId } from '@/theme/pm-theme-contract'

const ACTIVE_CAPABILITIES = {
  selectable: true,
  tokensImplemented: true,
  appliesColorMode: true,
  adjustsDensity: false,
  adjustsContrast: false,
  supportsWhiteLabel: false,
} as const

const PLANNED_CAPABILITIES = {
  selectable: false,
  tokensImplemented: false,
  appliesColorMode: false,
  adjustsDensity: false,
  adjustsContrast: false,
  supportsWhiteLabel: false,
} as const

/** Default active theme — matches current `:root` / `.light` production behavior. */
export const ENTERPRISE_LIGHT: PmThemeDefinition = {
  id: 'enterprise-light',
  label: 'Enterprise Light',
  description: 'Default professional workspace theme. Maps to current light mode.',
  status: 'active',
  mode: 'light',
  density: 'comfortable',
  contrast: 'standard',
  direction: 'ltr',
  capabilities: ACTIVE_CAPABILITIES,
  cssRootClass: 'light',
  dataThemeAttribute: 'enterprise-light',
  legacyResolvedMode: 'light',
}

/** Active dark theme — maps to current `.dark` block in index.css. */
export const ENTERPRISE_DARK: PmThemeDefinition = {
  id: 'enterprise-dark',
  label: 'Enterprise Dark',
  description: 'Low-light workspace theme. Maps to current dark mode.',
  status: 'active',
  mode: 'dark',
  density: 'comfortable',
  contrast: 'standard',
  direction: 'ltr',
  capabilities: ACTIVE_CAPABILITIES,
  cssRootClass: 'dark',
  dataThemeAttribute: 'enterprise-dark',
  legacyResolvedMode: 'dark',
}

/** Planned — accessibility contrast overrides (DDS-004 §5). */
export const HIGH_CONTRAST: PmThemeDefinition = {
  id: 'high-contrast',
  label: 'High Contrast',
  description: 'Enhanced contrast for accessibility and procurement compliance. Planned.',
  status: 'planned',
  mode: 'light',
  density: 'comfortable',
  contrast: 'high',
  direction: 'ltr',
  capabilities: {
    ...PLANNED_CAPABILITIES,
    adjustsContrast: true,
  },
  cssRootClass: '',
  dataThemeAttribute: 'high-contrast',
}

/** Planned — increased data density for power users (DDS-004 §6). */
export const COMPACT: PmThemeDefinition = {
  id: 'compact',
  label: 'Compact',
  description: 'Reduced spacing and tighter typography for data-heavy workflows. Planned.',
  status: 'planned',
  mode: 'light',
  density: 'compact',
  contrast: 'standard',
  direction: 'ltr',
  capabilities: {
    ...PLANNED_CAPABILITIES,
    adjustsDensity: true,
  },
  cssRootClass: '',
  dataThemeAttribute: 'compact',
}

/** Placeholder — future brand refresh without component rebuild (DDS-004 §7). */
export const FUTURE_REFRESH_PLACEHOLDER: PmThemeDefinition = {
  id: 'future-refresh-placeholder',
  label: 'Future Brand Refresh',
  description: 'Reserved slot for a future brand token update. Not user-facing.',
  status: 'planned',
  mode: 'light',
  density: 'comfortable',
  contrast: 'standard',
  direction: 'ltr',
  capabilities: {
    ...PLANNED_CAPABILITIES,
    supportsWhiteLabel: true,
  },
  cssRootClass: '',
  dataThemeAttribute: 'future-refresh',
}

/** Canonical registry — source of truth for all theme metadata. */
export const PM_THEME_REGISTRY: Record<ThemeId, PmThemeDefinition> = {
  'enterprise-light': ENTERPRISE_LIGHT,
  'enterprise-dark': ENTERPRISE_DARK,
  'high-contrast': HIGH_CONTRAST,
  compact: COMPACT,
  'future-refresh-placeholder': FUTURE_REFRESH_PLACEHOLDER,
}

export const PM_THEME_IDS = Object.keys(PM_THEME_REGISTRY) as ThemeId[]

export const PM_ACTIVE_THEME_IDS: ThemeId[] = PM_THEME_IDS.filter(
  (id) => PM_THEME_REGISTRY[id].status === 'active',
)

export const PM_PLANNED_THEME_IDS: ThemeId[] = PM_THEME_IDS.filter(
  (id) => PM_THEME_REGISTRY[id].status === 'planned',
)

export const PM_DEFAULT_THEME_ID: ThemeId = 'enterprise-light'
