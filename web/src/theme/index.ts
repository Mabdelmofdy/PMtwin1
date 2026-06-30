/**
 * PM-Twin theme architecture — public API (DDS-004).
 */
export type {
  LegacyThemePreference,
  PmThemeDefinition,
  ThemeCapabilities,
  ThemeContrast,
  ThemeDensity,
  ThemeDirection,
  ThemeId,
  ThemeMode,
  ThemeStatus,
} from '@/theme/pm-theme-contract'

export {
  COMPACT,
  ENTERPRISE_DARK,
  ENTERPRISE_LIGHT,
  FUTURE_REFRESH_PLACEHOLDER,
  HIGH_CONTRAST,
  PM_ACTIVE_THEME_IDS,
  PM_DEFAULT_THEME_ID,
  PM_PLANNED_THEME_IDS,
  PM_THEME_IDS,
  PM_THEME_REGISTRY,
} from '@/theme/pm-theme-registry'

export {
  isRegisteredThemeId,
  isThemeSupported,
  listActiveThemeIds,
  listPlannedThemeIds,
  normalizeThemeId,
  resolveThemeById,
  resolveThemeCapabilities,
  resolveThemeClassName,
  resolveThemeDataAttribute,
  resolveThemeIdFromLegacyMode,
  resolveThemeIdFromLegacyPreference,
} from '@/theme/pm-theme-utils'

export {
  resolveDocumentThemeClasses,
  resolveSystemThemeMode,
  resolveThemeProviderBridge,
  themeModeToPreference,
  type ThemeProviderBridgeState,
} from '@/theme/pm-theme-provider-bridge'
