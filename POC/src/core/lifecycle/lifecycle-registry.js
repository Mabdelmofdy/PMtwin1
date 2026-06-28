/**
 * ADR-001 lifecycle registry bridge for legacy POC scripts.
 * Static bundle source: vendor/@pm-twin/lifecycle/index.js (built from @pm-twin/lifecycle).
 */
import * as lifecycle from '../../../vendor/@pm-twin/lifecycle/index.js'

export const {
  CANONICAL_STATES,
  ENTITY_TYPES,
  LEGACY_ALIASES,
  MANIFEST,
  getCanonicalStates,
  getLegacyAliases,
  isCanonicalState,
  isEntityType,
  toCanonical,
} = lifecycle

if (typeof window !== 'undefined') {
  window.PmTwinLifecycle = lifecycle
}
