/**
 * Canonical product vocabulary for UI copy (presentation layer).
 * Prefer these constants over ad-hoc strings for navigation and row actions.
 *
 * @see docs/ui/PM-TWIN-PRODUCT-IDENTITY.md
 */
export const PRODUCT_LANGUAGE = {
  /** Primary navigation / row action — opens an entity detail. */
  OPEN: 'Open',
  OPEN_MATCH: 'Open match',
  OPEN_NEGOTIATION: 'Open negotiation',
  OPEN_DEAL: 'Open deal',
  OPEN_CONTRACT: 'Open contract',
  OPEN_PROFILE: 'Open profile',
  OPEN_OPPORTUNITIES: 'Open opportunities',
  OPEN_PIPELINE: 'Open pipeline',
  /** List-level affordance — shows full collection. */
  VIEW_ALL: 'View all',
  VIEW_ALL_MATCHES: 'View all matches',
} as const

export type ProductLanguageKey = keyof typeof PRODUCT_LANGUAGE
