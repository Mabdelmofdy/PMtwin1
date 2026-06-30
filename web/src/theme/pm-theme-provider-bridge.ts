/**
 * Pure bridge between legacy ThemeProvider state and PM theme registry (DDS-004 / Phase 5).
 * No React, no DOM — testable without jsdom.
 */
import type {
  LegacyThemePreference,
  PmThemeDefinition,
  ThemeId,
  ThemeMode,
} from '@/theme/pm-theme-contract'
import {
  resolveThemeById,
  resolveThemeIdFromLegacyMode,
  resolveThemeIdFromLegacyPreference,
} from '@/theme/pm-theme-utils'

export type ThemeProviderBridgeState = {
  /** User preference — light, dark, or system. */
  readonly preference: LegacyThemePreference
  /** Resolved color mode applied to the document. */
  readonly resolvedTheme: ThemeMode
  /** Alias for resolvedTheme — matches ThemeMode in theme contract. */
  readonly themeMode: ThemeMode
  /** Canonical PM theme id for the resolved mode. */
  readonly pmThemeId: ThemeId
  /** Full theme metadata from registry. */
  readonly pmTheme: PmThemeDefinition
}

export function resolveSystemThemeMode(
  prefersDark: boolean,
): ThemeMode {
  return prefersDark ? 'dark' : 'light'
}

/** Resolve preference + system hint into bridged provider state. */
export function resolveThemeProviderBridge(
  preference: LegacyThemePreference,
  systemMode: ThemeMode,
): ThemeProviderBridgeState {
  const resolvedTheme =
    preference === 'system' ? systemMode : preference
  const pmThemeId = resolveThemeIdFromLegacyPreference(preference, systemMode)
  const pmTheme = resolveThemeById(pmThemeId)

  return {
    preference,
    resolvedTheme,
    themeMode: resolvedTheme,
    pmThemeId,
    pmTheme,
  }
}

/** Document class names to apply for a resolved color mode. */
export function resolveDocumentThemeClasses(mode: ThemeMode): {
  readonly rootClasses: readonly ThemeMode[]
  readonly pmThemeId: ThemeId
  readonly dataThemeAttribute: string | undefined
} {
  const pmThemeId = resolveThemeIdFromLegacyMode(mode)
  const pmTheme = resolveThemeById(pmThemeId)
  const rootClass = pmTheme.cssRootClass

  return {
    rootClasses: rootClass ? [rootClass] : [],
    pmThemeId,
    dataThemeAttribute: pmTheme.dataThemeAttribute,
  }
}

/** Map explicit color mode preference to legacy storage value. */
export function themeModeToPreference(mode: ThemeMode): LegacyThemePreference {
  return mode
}
