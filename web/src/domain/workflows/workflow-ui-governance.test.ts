import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const WORKFLOW_UI_SURFACES = [
  'components/opportunity/applications-panel.tsx',
  'components/negotiation/create-deal-button.tsx',
  'components/negotiation/start-negotiation-button.tsx',
  'components/deal/create-contract-button.tsx',
  'components/contract/sign-contract-button.tsx',
  'components/contract/complete-contract-button.tsx',
  'pages/workspace/deals-pages.tsx',
  'pages/workspace/contracts-pages.tsx',
  'pages/workspace/pipeline-pages.tsx',
]

const WORKFLOW_GATE_PATTERNS: readonly {
  readonly name: string
  readonly pattern: RegExp
}[] = [
  {
    name: 'inline agreed negotiation gate',
    pattern: /if\s*\([^)]*\.status\s*===\s*['"]agreed['"]/,
  },
  {
    name: 'inline accepted application gate',
    pattern: /if\s*\([^)]*\.status\s*===\s*['"]accepted['"]/,
  },
  {
    name: 'inline draft deal gate for contract creation',
    pattern: /if\s*\([^)]*deal[^)]*\.status\s*===\s*['"]draft['"]/,
  },
]

const ORCHESTRATOR_DELEGATION_PATTERN =
  /workflow-bridge|[\w-]+-ui-actions|deal-detail-read-model|contract-detail-read-model|opportunity-matches-read-model|application-hiring-ui-actions/

describe('workflow UI governance', () => {
  for (const relativePath of WORKFLOW_UI_SURFACES) {
    it(`${relativePath} avoids duplicated workflow transition gates`, () => {
      const source = readFileSync(join(webRoot, relativePath), 'utf8')
      for (const rule of WORKFLOW_GATE_PATTERNS) {
        assert.equal(
          rule.pattern.test(source),
          false,
          `${relativePath} must not contain ${rule.name}`,
        )
      }
    })

    it(`${relativePath} routes workflow visibility through orchestrator helpers`, () => {
      const source = readFileSync(join(webRoot, relativePath), 'utf8')
      assert.match(
        source,
        ORCHESTRATOR_DELEGATION_PATTERN,
        `${relativePath} should delegate to workflow-bridge, *-ui-actions, or orchestrator-backed read models`,
      )
    })
  }
})
