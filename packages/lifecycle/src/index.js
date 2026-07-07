export {
  CANONICAL_STATES,
  ENTITY_TYPE_LEGACY_ALIASES,
  ENTITY_TYPES,
  getCanonicalStates,
  getLegacyAliases,
  isCanonicalState,
  isEntityType,
  LEGACY_ALIASES,
  MANIFEST,
  toCanonical,
} from './status-map.js'

export {
  allowedTransitions,
  forbiddenTransitions,
  getFsm,
  isTerminal,
} from './api/get-fsm.js'
