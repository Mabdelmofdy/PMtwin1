/**
 * Layer 2 — Semantic Tokens
 * Meaning-based roles. Components consume semantic tokens — not brand directly.
 * CSS source: web/src/index.css
 */

/** CSS custom property names for semantic roles. */
export const pmSemanticVars = {
  background: '--background',
  foreground: '--foreground',
  surface: '--surface',
  surfaceMuted: '--surface-muted',
  surfaceElevated: '--surface-elevated',
  border: '--border',
  borderStrong: '--border-strong',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  focusRing: '--focus-ring',
  ring: '--ring',
  input: '--input',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  sidebar: '--sidebar',
  sidebarForeground: '--sidebar-foreground',
  sidebarBorder: '--sidebar-border',
  sidebarRing: '--sidebar-ring',
} as const

/** Semantic surface background utilities (Tailwind v4 token mapping). */
export const pmSurfaceTone = {
  default: 'bg-surface text-foreground',
  muted: 'bg-surface-muted text-foreground',
  elevated: 'bg-surface-elevated text-foreground',
  card: 'bg-card text-card-foreground',
} as const

/** Semantic text roles. */
export const pmTextTone = {
  primary: 'text-foreground',
  secondary: 'text-muted-foreground',
  muted: 'text-muted-foreground',
} as const

/** Semantic status background patterns (badge / alert fills). */
export const pmStatusBackground = {
  success: 'bg-success/14 text-success',
  warning: 'bg-warning/14 text-warning',
  danger: 'bg-danger/14 text-danger',
  info: 'bg-info/14 text-info',
  neutral: 'bg-neutral/14 text-neutral',
  primary: 'bg-primary/14 text-primary',
} as const

export type PmSurfaceTone = keyof typeof pmSurfaceTone
export type PmTextTone = keyof typeof pmTextTone
export type PmStatusBackground = keyof typeof pmStatusBackground
