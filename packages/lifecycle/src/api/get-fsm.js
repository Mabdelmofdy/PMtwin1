import transitions from '../registry/transitions.json' with { type: 'json' }
import {
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
  if (!isEntityType(entityType)) {
    return null
  }

  const fsm = transitions[entityType]
  if (!fsm) {
    return null
  }

  /** @type {Record<string, readonly string[]>} */
  const frozenTransitions = {}
  for (const [from, targets] of Object.entries(fsm.transitions)) {
    frozenTransitions[from] = Object.freeze([...targets])
  }

  return Object.freeze({
    entityType,
    states: getCanonicalStates(entityType),
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
  const canonical = toCanonical(entityType, status)
  if (!canonical) {
    return false
  }

  const fsm = transitions[entityType]
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
  const from = toCanonical(entityType, fromStatus)
  if (!from) {
    return Object.freeze([])
  }

  const fsm = transitions[entityType]
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
  const from = toCanonical(entityType, fromStatus)
  if (!from) {
    return Object.freeze([])
  }

  const allowed = new Set(allowedTransitions(entityType, from))
  return Object.freeze(
    getCanonicalStates(entityType).filter(
      (state) => state !== from && !allowed.has(state),
    ),
  )
}
