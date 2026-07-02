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

/**
 * Entity tone utilities (DS v2) — lifecycle identity colors.
 * CSS vars: --entity-* in index.css. Used by page headers, lifecycle maps, topology.
 */
export const pmEntityTone = {
  mission: 'text-entity-mission',
  opportunity: 'text-entity-opportunity',
  match: 'text-entity-match',
  negotiation: 'text-entity-negotiation',
  deal: 'text-entity-deal',
  contract: 'text-entity-contract',
} as const

/** Entity tone soft-surface backgrounds (headers, hero panels). */
export const pmEntitySurface = {
  mission: 'from-entity-mission/[0.11] via-surface to-surface/95',
  opportunity: 'from-entity-opportunity/[0.13] via-surface to-surface/95',
  match: 'from-entity-match/[0.12] via-surface to-surface/95',
  negotiation: 'from-entity-negotiation/[0.11] via-surface to-surface/95',
  deal: 'from-entity-deal/[0.12] via-surface to-surface/95',
  contract: 'from-entity-contract/[0.16] via-surface to-surface/95',
} as const

/** Entity tone badge/chip fills. */
export const pmEntityBackground = {
  mission: 'bg-entity-mission/12 text-entity-mission',
  opportunity: 'bg-entity-opportunity/12 text-entity-opportunity',
  match: 'bg-entity-match/12 text-entity-match',
  negotiation: 'bg-entity-negotiation/12 text-entity-negotiation',
  deal: 'bg-entity-deal/12 text-entity-deal',
  contract: 'bg-entity-contract/12 text-entity-contract',
} as const

export type PmSurfaceTone = keyof typeof pmSurfaceTone
export type PmTextTone = keyof typeof pmTextTone
export type PmStatusBackground = keyof typeof pmStatusBackground
export type PmEntityTone = keyof typeof pmEntityTone
