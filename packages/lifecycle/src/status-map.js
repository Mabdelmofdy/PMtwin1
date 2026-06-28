import manifest from './registry/manifest.json' with { type: 'json' }
import opportunityAliases from './registry/aliases/opportunity.json' with { type: 'json' }
import applicationAliases from './registry/aliases/application.json' with { type: 'json' }
import matchAliases from './registry/aliases/match.json' with { type: 'json' }
import negotiationAliases from './registry/aliases/negotiation.json' with { type: 'json' }
import dealAliases from './registry/aliases/deal.json' with { type: 'json' }
import contractAliases from './registry/aliases/contract.json' with { type: 'json' }

/** @typedef {keyof typeof manifest.entities} EntityType */

const ALIAS_FILES = {
  opportunity: opportunityAliases,
  application: applicationAliases,
  match: matchAliases,
  negotiation: negotiationAliases,
  deal: dealAliases,
  contract: contractAliases,
}

/**
 * @param {Record<string, { canonicalStates: string[], aliasesFile: string }>} entities
 * @param {Record<string, Record<string, string>>} aliasFiles
 */
function buildStatusMaps(entities, aliasFiles) {
  /** @type {Record<string, readonly string[]>} */
  const canonicalStates = {}
  /** @type {Record<string, Readonly<Record<string, string>>>} */
  const legacyAliases = {}
  /** @type {Record<string, Readonly<Record<string, string>>>} */
  const resolveMap = {}

  for (const [entityType, entity] of Object.entries(entities)) {
    const states = Object.freeze([...entity.canonicalStates])
    canonicalStates[entityType] = states

    const aliases = aliasFiles[entityType] ?? {}
    legacyAliases[entityType] = Object.freeze({ ...aliases })

    /** @type {Record<string, string>} */
    const map = {}
    for (const state of states) {
      map[state] = state
    }
    for (const [legacy, canonical] of Object.entries(aliases)) {
      map[legacy] = canonical
    }
    resolveMap[entityType] = Object.freeze(map)
  }

  return {
    canonicalStates: Object.freeze(canonicalStates),
    legacyAliases: Object.freeze(legacyAliases),
    resolveMap: Object.freeze(resolveMap),
  }
}

const registry = buildStatusMaps(manifest.entities, ALIAS_FILES)

/** @type {readonly EntityType[]} */
export const ENTITY_TYPES = Object.freeze(
  /** @type {EntityType[]} */ (Object.keys(manifest.entities)),
)

export const MANIFEST = Object.freeze(manifest)

export const CANONICAL_STATES = registry.canonicalStates
export const LEGACY_ALIASES = registry.legacyAliases

/**
 * @param {string} entityType
 * @returns {entityType is EntityType}
 */
export function isEntityType(entityType) {
  return Object.prototype.hasOwnProperty.call(manifest.entities, entityType)
}

/**
 * @param {string} entityType
 * @returns {readonly string[]}
 */
export function getCanonicalStates(entityType) {
  const states = registry.canonicalStates[entityType]
  if (!states) {
    return []
  }
  return states
}

/**
 * @param {string} entityType
 * @param {string | null | undefined} status
 * @returns {boolean}
 */
export function isCanonicalState(entityType, status) {
  if (status == null || status === '') {
    return false
  }
  const states = registry.canonicalStates[entityType]
  if (!states) {
    return false
  }
  return states.includes(String(status).toLowerCase())
}

/**
 * @param {string} entityType
 * @returns {Readonly<Record<string, string>>}
 */
export function getLegacyAliases(entityType) {
  return registry.legacyAliases[entityType] ?? Object.freeze({})
}

/**
 * Map a stored or legacy status to its ADR-001 canonical state.
 *
 * @param {string} entityType
 * @param {string | null | undefined} status
 * @returns {string}
 */
export function toCanonical(entityType, status) {
  if (status == null || status === '') {
    return ''
  }
  const key = String(status).toLowerCase()
  const map = registry.resolveMap[entityType]
  if (!map) {
    return key
  }
  return map[key] ?? key
}

export { manifest, registry }
