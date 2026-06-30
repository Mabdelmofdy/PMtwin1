/**
 * PM-Twin theme utilities (DDS-004).
 * Pure functions — no DOM mutations in Phase 4.
 */
import type {
  LegacyThemePreference,
  PmThemeDefinition,
  ThemeCapabilities,
  ThemeId,
  ThemeMode,
} from '@/theme/pm-theme-contract'
import {
  PM_ACTIVE_THEME_IDS,
  PM_DEFAULT_THEME_ID,
  PM_PLANNED_THEME_IDS,
  PM_THEME_REGISTRY,
} from '@/theme/pm-theme-registry'

const LEGACY_MODE_TO_THEME_ID: Record<ThemeMode, ThemeId> = {
  light: 'enterprise-light',
  dark: 'enterprise-dark',
}

const THEME_ID_ALIASES: Record<string, ThemeId> = {
  light: 'enterprise-light',
  dark: 'enterprise-dark',
  'enterprise-light': 'enterprise-light',
  'enterprise-dark': 'enterprise-dark',
  'high-contrast': 'high-contrast',
  compact: 'compact',
  'future-refresh-placeholder': 'future-refresh-placeholder',
  'future-refresh': 'future-refresh-placeholder',
}

/**
 * Normalize arbitrary input to a canonical ThemeId.
 * Unknown values fall back to enterprise-light (current default).
 */
export function normalizeThemeId(value: string | null | undefined): ThemeId {
  if (value == null || value === '') {
    return PM_DEFAULT_THEME_ID
  }
  const key = value.trim().toLowerCase()
  return THEME_ID_ALIASES[key] ?? PM_DEFAULT_THEME_ID
}

/** Resolve a theme definition by id (normalized). */
export function resolveThemeById(id: string | ThemeId): PmThemeDefinition {
  const normalized = normalizeThemeId(id)
  return PM_THEME_REGISTRY[normalized]
}

/** Whether a theme is registered and active (user-selectable in future theme UI). */
export function isThemeSupported(id: string | ThemeId): boolean {
  const normalized = normalizeThemeId(id)
  const theme = PM_THEME_REGISTRY[normalized]
  return theme.status === 'active' && theme.capabilities.selectable
}

/** Whether a theme id exists in the registry (any status). */
export function isRegisteredThemeId(id: string): id is ThemeId {
  return id in PM_THEME_REGISTRY
}

/** Capability flags for a theme. */
export function resolveThemeCapabilities(id: string | ThemeId): ThemeCapabilities {
  return resolveThemeById(id).capabilities
}

/**
 * CSS class name(s) to apply on document root for a theme.
 * Matches current ThemeProvider behavior for active themes only.
 */
export function resolveThemeClassName(id: string | ThemeId): string {
  const theme = resolveThemeById(id)
  if (theme.status !== 'active') {
    return ''
  }
  return theme.cssRootClass
}

/**
 * Map legacy ThemeProvider resolved mode to canonical theme id.
 * Preserves current light/dark behavior without changing ThemeProvider.
 */
export function resolveThemeIdFromLegacyMode(mode: ThemeMode): ThemeId {
  return LEGACY_MODE_TO_THEME_ID[mode]
}

/**
 * Map legacy user preference (including system) to a resolved theme id.
 * System resolves via caller-supplied resolved mode.
 */
export function resolveThemeIdFromLegacyPreference(
  preference: LegacyThemePreference,
  systemResolvedMode: ThemeMode,
): ThemeId {
  if (preference === 'system') {
    return resolveThemeIdFromLegacyMode(systemResolvedMode)
  }
  return resolveThemeIdFromLegacyMode(preference)
}

/** Active theme ids — enterprise-light and enterprise-dark only in Phase 4. */
export function listActiveThemeIds(): readonly ThemeId[] {
  return PM_ACTIVE_THEME_IDS
}

/** Planned theme ids — not active by default. */
export function listPlannedThemeIds(): readonly ThemeId[] {
  return PM_PLANNED_THEME_IDS
}

/**
 * Data attribute value for `data-pm-theme` (future CSS selectors).
 * Returns undefined for themes without an attribute contract.
 */
export function resolveThemeDataAttribute(
  id: string | ThemeId,
): string | undefined {
  const theme = resolveThemeById(id)
  if (theme.status !== 'active') {
    return undefined
  }
  return theme.dataThemeAttribute
}
