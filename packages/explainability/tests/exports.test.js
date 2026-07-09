import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import * as explainability from '../dist/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(__dirname, '..', 'src')

const REQUIRED_EXPORTS = [
  'ENGINE_ID',
  'HEALTH',
  'EXPLANATION_SEVERITY',
  'RECOMMENDATION_PRIORITY',
  'TIMELINE_EVENT_STATUS',
  'PROFILE_REASON_CODES',
  'DOCUMENT_REASON_CODES',
  'READINESS_REASON_CODES',
  'MATCH_REASON_CODES',
  'NEGOTIATION_REASON_CODES',
  'COMMERCIAL_REASON_CODES',
  'CONTRACT_REASON_CODES',
  'VETTING_REASON_CODES',
  'DASHBOARD_REASON_CODES',
  'ANALYTICS_REASON_CODES',
  'AGREEMENT_REASON_CODES',
  'REASON_CODE_PREFIX',
  'ALL_REASON_CODES',
  'AI_EXPLANATION_PAYLOAD_VERSION',
  'EXPLANATION_BUNDLE_KEYS',
  'isReasonCode',
  'assertReasonCode',
  'isExplanationBundle',
  'serializeExplanationBundle',
  'deserializeExplanationBundle',
  'toAIExplanationPayload',
  'fromAIExplanationPayload',
  'serializeAIExplanationPayload',
  'deserializeAIExplanationPayload',
]

function listSourceFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath))
      continue
    }

    if (entry.name.endsWith('.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

describe('Public export surface', () => {
  it('exports the explainability contract API', () => {
    for (const exportName of REQUIRED_EXPORTS) {
      assert.ok(
        exportName in explainability,
        `Missing export: ${exportName}`,
      )
    }
  })
})

describe('Circular dependency guard', () => {
  it('does not import the package barrel from internal modules', () => {
    const sourceFiles = listSourceFiles(srcRoot)

    for (const filePath of sourceFiles) {
      const contents = readFileSync(filePath, 'utf8')
      assert.equal(
        contents.includes("from './index.ts'") ||
          contents.includes('from "./index.ts"') ||
          contents.includes("from '../index.ts'") ||
          contents.includes('from "../index.ts"'),
        false,
        `Circular barrel import detected in ${filePath}`,
      )
    }
  })
})
