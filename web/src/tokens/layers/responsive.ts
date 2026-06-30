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

/** Breakpoint widths used in production QA matrix (Phase 9.5H). */
export const pmResponsiveViewports = {
  mobile: [360, 375, 390, 430] as const,
  tablet: [768, 820, 834, 1024] as const,
  laptop: [1280, 1366] as const,
  desktop: [1440, 1600, 1920] as const,
} as const

/** All production QA widths in ascending order. */
export const pmResponsiveProductionWidths = [
  ...pmResponsiveViewports.mobile,
  ...pmResponsiveViewports.tablet,
  ...pmResponsiveViewports.laptop,
  ...pmResponsiveViewports.desktop,
] as const

export type PmResponsiveViewportGroup = keyof typeof pmResponsiveViewports
