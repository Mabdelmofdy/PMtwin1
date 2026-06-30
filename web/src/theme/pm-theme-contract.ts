/**
 * PM-Twin theme contract (DDS-004).
 * Pure types — no business logic, no React, no DOM side effects.
 */

/** Canonical theme identifiers in the PM-Twin theme registry. */
export type ThemeId =
  | 'enterprise-light'
  | 'enterprise-dark'
  | 'high-contrast'
  | 'compact'
  | 'future-refresh-placeholder'

/** Color mode resolved on the document root. */
export type ThemeMode = 'light' | 'dark'

/** Layout density profile — affects spacing and typography scale when active. */
export type ThemeDensity = 'comfortable' | 'compact'

/** Contrast profile — affects semantic token contrast when active. */
export type ThemeContrast = 'standard' | 'high'

/** Text direction — RTL support is future; LTR is current default. */
export type ThemeDirection = 'ltr' | 'rtl'

/**
 * Lifecycle status of a theme definition.
 * - active: maps to current production behavior
 * - planned: registered but not user-selectable
 * - experimental: internal preview only (future)
 */
export type ThemeStatus = 'active' | 'planned' | 'experimental'

/** Legacy theme-provider values — preserved for backward compatibility. */
export type LegacyThemePreference = 'light' | 'dark' | 'system'

/** Capability flags exposed to future theme UI and tenant configuration. */
export type ThemeCapabilities = {
  /** Theme can be selected by end users today. */
  readonly selectable: boolean
  /** Theme CSS token block is implemented in index.css. */
  readonly tokensImplemented: boolean
  /** Theme applies color mode (light/dark) to document root. */
  readonly appliesColorMode: boolean
  /** Theme adjusts layout density tokens when active. */
  readonly adjustsDensity: boolean
  /** Theme adjusts contrast tokens when active. */
  readonly adjustsContrast: boolean
  /** Theme is intended for multi-tenant white-label (future). */
  readonly supportsWhiteLabel: boolean
}

/** Full theme definition — metadata and CSS wiring contract. */
export type PmThemeDefinition = {
  readonly id: ThemeId
  readonly label: string
  readonly description: string
  readonly status: ThemeStatus
  readonly mode: ThemeMode
  readonly density: ThemeDensity
  readonly contrast: ThemeContrast
  readonly direction: ThemeDirection
  readonly capabilities: ThemeCapabilities
  /**
   * CSS class applied to `document.documentElement` when this theme is active.
   * Empty string means no additional class beyond `:root` defaults.
   */
  readonly cssRootClass: '' | 'light' | 'dark'
  /**
   * Optional data attribute for future multi-theme CSS selectors.
   * e.g. `data-pm-theme="high-contrast"`
   */
  readonly dataThemeAttribute?: string
  /** Maps to legacy ThemeProvider resolved preference when applicable. */
  readonly legacyResolvedMode?: ThemeMode
}
