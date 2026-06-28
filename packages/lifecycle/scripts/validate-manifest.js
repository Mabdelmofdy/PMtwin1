import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_STATES,
  ENTITY_TYPES,
  getLegacyAliases,
  isCanonicalState,
  isEntityType,
  toCanonical,
} from '../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const registryDir = join(__dirname, '..', 'src', 'registry')
const manifestPath = join(registryDir, 'manifest.json')

/** ADR-001 authority — validation must match exactly */
const ADR_001_CANONICAL = {
  opportunity: [
    'draft',
    'published',
    'matched',
    'negotiating',
    'contracted',
    'executing',
    'completed',
    'cancelled',
  ],
  application: [
    'submitted',
    'reviewing',
    'shortlisted',
    'negotiating',
    'accepted',
    'rejected',
    'withdrawn',
  ],
  match: [
    'discovered',
    'accepted',
    'confirmed',
    'declined',
    'expired',
    'superseded',
  ],
  negotiation: ['active', 'countered', 'agreed', 'expired', 'cancelled'],
  deal: ['draft', 'review', 'signing', 'executing', 'completed', 'cancelled'],
  contract: [
    'draft',
    'pending_signature',
    'active',
    'completed',
    'terminated',
  ],
}

/** ADR-001 legacy alias requirements */
const ADR_001_ALIASES = {
  opportunity: {
    in_negotiation: 'negotiating',
    in_execution: 'executing',
    closed: 'completed',
  },
  application: {
    pending: 'submitted',
    in_negotiation: 'negotiating',
  },
  match: {
    pending: 'discovered',
  },
  negotiation: {
    open: 'active',
    counter_offered: 'countered',
    failed: 'cancelled',
  },
  deal: {
    negotiating: 'draft',
    active: 'executing',
    execution: 'executing',
    delivery: 'executing',
    closed: 'completed',
  },
  contract: {
    pending: 'pending_signature',
  },
}

const REQUIRED_ENTITIES = Object.keys(ADR_001_CANONICAL)

/** @type {string[]} */
const errors = []

/**
 * @param {boolean} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    errors.push(message)
  }
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateManifestFile() {
  assert(existsSync(manifestPath), `Missing manifest: ${manifestPath}`)

  const raw = readFileSync(manifestPath, 'utf8')
  /** @type {unknown} */
  let manifest
  try {
    manifest = JSON.parse(raw)
  } catch {
    assert(false, 'manifest.json is not valid JSON')
    return
  }

  assert(isRecord(manifest), 'manifest.json root must be an object')
  if (!isRecord(manifest)) {
    return
  }

  assert(isRecord(manifest.entities), 'manifest.json must contain entities object')

  if (!isRecord(manifest.entities)) {
    return
  }

  for (const entityType of REQUIRED_ENTITIES) {
    assert(
      Object.prototype.hasOwnProperty.call(manifest.entities, entityType),
      `manifest.json missing entity: ${entityType}`,
    )
  }

  for (const entityType of Object.keys(manifest.entities)) {
    const entity = manifest.entities[entityType]
    assert(isRecord(entity), `Entity "${entityType}" must be an object`)

    if (!isRecord(entity)) {
      continue
    }

    const states = entity.canonicalStates
    assert(
      Array.isArray(states),
      `Entity "${entityType}" must define canonicalStates array`,
    )

    if (!Array.isArray(states)) {
      continue
    }

    const expected = ADR_001_CANONICAL[entityType]
    assert(
      JSON.stringify(states) === JSON.stringify(expected),
      `Entity "${entityType}" canonicalStates do not match ADR-001`,
    )

    const aliasesFile = entity.aliasesFile
    assert(
      typeof aliasesFile === 'string' && aliasesFile.length > 0,
      `Entity "${entityType}" must define aliasesFile`,
    )

    if (typeof aliasesFile !== 'string') {
      continue
    }

    const aliasPath = join(registryDir, aliasesFile)
    assert(
      existsSync(aliasPath),
      `Entity "${entityType}" aliases file missing: ${aliasesFile}`,
    )

    if (!existsSync(aliasPath)) {
      continue
    }

    /** @type {unknown} */
    let aliases
    try {
      aliases = JSON.parse(readFileSync(aliasPath, 'utf8'))
    } catch {
      assert(false, `Entity "${entityType}" aliases file is not valid JSON`)
      continue
    }

    assert(
      isRecord(aliases),
      `Entity "${entityType}" aliases file must be an object`,
    )

    if (!isRecord(aliases)) {
      continue
    }

    const requiredAliases = ADR_001_ALIASES[entityType] ?? {}
    for (const [legacy, canonical] of Object.entries(requiredAliases)) {
      assert(
        aliases[legacy] === canonical,
        `Entity "${entityType}" missing or incorrect alias: ${legacy} → ${canonical}`,
      )
    }

    for (const [legacy, canonical] of Object.entries(aliases)) {
      assert(
        typeof canonical === 'string',
        `Entity "${entityType}" alias "${legacy}" must map to a string`,
      )
      if (typeof canonical !== 'string') {
        continue
      }
      assert(
        expected.includes(canonical),
        `Entity "${entityType}" alias "${legacy}" maps to non-canonical state "${canonical}"`,
      )
      assert(
        legacy !== canonical,
        `Entity "${entityType}" alias "${legacy}" must not be an identity mapping`,
      )
    }
  }
}

function validateRuntimeRegistry() {
  assert(
    ENTITY_TYPES.length === REQUIRED_ENTITIES.length,
    'Runtime ENTITY_TYPES count does not match ADR-001',
  )

  for (const entityType of REQUIRED_ENTITIES) {
    assert(isEntityType(entityType), `Runtime registry missing entity: ${entityType}`)

    const states = CANONICAL_STATES[entityType]
    assert(
      JSON.stringify(states) === JSON.stringify(ADR_001_CANONICAL[entityType]),
      `Runtime CANONICAL_STATES for "${entityType}" do not match ADR-001`,
    )

    const aliases = getLegacyAliases(entityType)
    const requiredAliases = ADR_001_ALIASES[entityType] ?? {}
    for (const [legacy, canonical] of Object.entries(requiredAliases)) {
      assert(
        aliases[legacy] === canonical,
        `Runtime legacy aliases for "${entityType}" missing: ${legacy} → ${canonical}`,
      )
      assert(
        toCanonical(entityType, legacy) === canonical,
        `toCanonical("${entityType}", "${legacy}") expected "${canonical}"`,
      )
    }

    for (const state of ADR_001_CANONICAL[entityType]) {
      assert(
        isCanonicalState(entityType, state),
        `isCanonicalState("${entityType}", "${state}") should be true`,
      )
      assert(
        toCanonical(entityType, state) === state,
        `toCanonical("${entityType}", "${state}") should be identity`,
      )
    }
  }
}

validateManifestFile()
validateRuntimeRegistry()

if (errors.length > 0) {
  for (const error of errors) {
    process.stderr.write(`ERROR: ${error}\n`)
  }
  process.exit(1)
}

process.stdout.write(
  `OK: manifest.json validates ADR-001 (${REQUIRED_ENTITIES.length} entities)\n`,
)
process.exit(0)
