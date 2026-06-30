/**
 * Layer 9 — RTL / logical layout tokens (DDS-005 Phase 9.5D).
 * Prefer these over physical left/right utilities in PM workspace UI.
 */

/** Logical text alignment. */
export const pmLogicalAlign = {
  start: 'text-start',
  end: 'text-end',
  center: 'text-center',
} as const

/** Common logical spacing patterns for PM workspace chrome. */
export const pmLogical = {
  /** Push to inline end (was ml-auto). */
  marginStartAuto: 'ms-auto',
  /** Inline-start padding for lists (was pl-5). */
  listIndent: 'ps-5',
  /** Inline-start border + padding for timeline rails. */
  timelineRail: 'border-s border-border/40 ps-3',
  /** Hero metric separator (was border-l pl-6). */
  heroMetricSeparator: 'sm:border-s sm:border-border/50 sm:ps-6',
  /** Shell border on sidebar trailing edge (was border-r). */
  sidebarBorder: 'border-e border-sidebar-border/80',
  /** Skip link / overlay close inset (was left-2 / right-4). */
  skipLinkInset: 'focus:start-2',
  overlayCloseInset: 'end-4',
  /** Search input icon inset (was left-3 pl-9). */
  searchIconInset: 'start-3',
  searchInputPadding: 'ps-9',
  /** Notification badge (was -right-0.5). */
  badgeInlineEnd: '-end-0.5',
} as const

/** RTL typography utilities — applied via [dir="rtl"] in index.css. */
export const pmRtlTypography = {
  root: 'pm-rtl-root',
  body: 'pm-rtl-body',
  heading: 'pm-rtl-heading',
  table: 'pm-rtl-table',
  badge: 'pm-rtl-badge',
} as const

export type DocumentDirection = 'ltr' | 'rtl'
