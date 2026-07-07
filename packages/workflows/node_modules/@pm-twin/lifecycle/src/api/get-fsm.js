import transitions from '../registry/transitions.json' with { type: 'json' }
import {
  ENTITY_TYPE_LEGACY_ALIASES,
  getCanonicalStates,
  isEntityType,
  toCanonical,
} from '../status-map.js'

/**
 * @typedef {import('../status-map.js').EntityType} EntityType
 * @typedef {{
 *   entityType: EntityType,
 *   states: readonly string[],
 *   terminalStates: readonly string[],
 *   transitions: Readonly<Record<string, readonly string[]>>,
 * }} EntityFsm
 */

/**
 * @param {string} entityType
 * @returns {EntityFsm | null}
 */
export function getFsm(entityType) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType
  if (!isEntityType(resolvedEntityType)) {
    return null
  }

  const fsm = transitions[resolvedEntityType]
  if (!fsm) {
    return null
  }

  /** @type {Record<string, readonly string[]>} */
  const frozenTransitions = {}
  for (const [from, targets] of Object.entries(fsm.transitions)) {
    frozenTransitions[from] = Object.freeze([...targets])
  }

  return Object.freeze({
    entityType: resolvedEntityType,
    states: getCanonicalStates(resolvedEntityType),
    terminalStates: Object.freeze([...fsm.terminalStates]),
    transitions: Object.freeze(frozenTransitions),
  })
}

/**
 * @param {string} entityType
 * @param {string | null | undefined} status
 * @returns {boolean}
 */
export function isTerminal(entityType, status) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType
  const canonical = toCanonical(resolvedEntityType, status)
  if (!canonical) {
    return false
  }

  const fsm = transitions[resolvedEntityType]
  if (!fsm) {
    return false
  }

  return fsm.terminalStates.includes(canonical)
}

/**
 * @param {string} entityType
 * @param {string | null | undefined} fromStatus
 * @returns {readonly string[]}
 */
export function allowedTransitions(entityType, fromStatus) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType
  const from = toCanonical(resolvedEntityType, fromStatus)
  if (!from) {
    return Object.freeze([])
  }

  const fsm = transitions[resolvedEntityType]
  if (!fsm) {
    return Object.freeze([])
  }

  const allowed = fsm.transitions[from]
  if (!allowed) {
    return Object.freeze([])
  }

  return Object.freeze([...allowed])
}

/**
 * @param {string} entityType
 * @param {string | null | undefined} fromStatus
 * @returns {readonly string[]}
 */
export function forbiddenTransitions(entityType, fromStatus) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType
  const from = toCanonical(resolvedEntityType, fromStatus)
  if (!from) {
    return Object.freeze([])
  }

  const allowed = new Set(allowedTransitions(entityType, from))
  return Object.freeze(
    getCanonicalStates(resolvedEntityType).filter(
      (state) => state !== from && !allowed.has(state),
    ),
  )
}
