/**
 * Layer 5 — Typography Tokens
 * Type scale, weights, and responsive scaling policy.
 * CSS source: web/src/index.css (@layer components .pm-text-*)
 */

export const pmFontFamily = {
  heading: 'var(--font-heading)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)',
  sans: 'var(--font-sans)',
} as const

/** Typography utility class names. */
export const pmTypography = {
  display: 'pm-text-display',
  h1: 'pm-text-h1',
  h2: 'pm-text-h2',
  h3: 'pm-text-h3',
  body: 'pm-text-body',
  bodySm: 'pm-text-body-sm',
  caption: 'pm-text-caption',
  label: 'pm-text-label',
  badge: 'pm-text-badge',
  mono: 'pm-text-mono',
  overline: 'pm-text-overline',
  stat: 'pm-text-stat',
  statLabel: 'pm-text-stat-label',
  tableHeader: 'pm-text-table-header',
} as const

/**
 * Responsive scaling policy — documented for theme evolution.
 * Fixed at all breakpoints: body, bodySm, caption, label, badge, mono, stat, statLabel, overline, tableHeader.
 */
export const pmTypographyScale = {
  display: { base: '2.25rem', md: '3rem' },
  h1: { base: '1.5rem', md: '1.875rem' },
  h2: { base: '1.25rem', md: '1.5rem' },
  h3: { base: '1.125rem', md: '1.125rem' },
  body: { base: '1rem', md: '1rem' },
  bodySm: { base: '0.875rem', md: '0.875rem' },
  caption: { base: '0.75rem', md: '0.75rem' },
  label: { base: '0.875rem', md: '0.875rem' },
  badge: { base: '0.75rem', md: '0.75rem' },
  mono: { base: '0.875rem', md: '0.875rem' },
  stat: { base: '1.5rem', md: '1.75rem' },
  statLabel: { base: '0.75rem', md: '0.75rem' },
  overline: { base: '0.6875rem', md: '0.6875rem' },
  tableHeader: { base: '0.75rem', md: '0.75rem' },
} as const

export const pmTypographyWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
} as const

export type PmTypographyRole = keyof typeof pmTypography
