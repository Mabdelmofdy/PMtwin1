/**
 * Layer 10 — Responsive layout tokens (Phase 9.5E).
 * Cross-device containment, scroll rows, and toolbar bleed alignment.
 */

/** CSS utility class names — pair with rules in web/src/index.css */
export const pmResponsive = {
  /** Prevent shell-level horizontal scroll from nested content. */
  shellInset: 'pm-shell-inset',
  /** Page chrome overflow containment. */
  pageChrome: 'pm-page-chrome',
  /** Horizontal scroll row (pipeline stages, breadcrumbs). */
  scrollX: 'pm-responsive-scroll-x',
  /** Toolbar / sticky footer bleed aligned to page padding token. */
  toolbarBleed:
    '-mx-[var(--pm-space-page-x)] px-[var(--pm-space-page-x)]',
} as const

/** Breakpoint widths used in QA matrix (documentation + tests). */
export const pmResponsiveViewports = {
  mobile: [360, 390, 430] as const,
  tablet: [768, 834] as const,
  laptop: [1024, 1280] as const,
  desktop: [1440, 1920] as const,
} as const

export type PmResponsiveViewportGroup = keyof typeof pmResponsiveViewports
