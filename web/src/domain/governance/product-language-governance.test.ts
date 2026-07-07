import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const HARDCODED_LABEL_ALLOWLIST = [
  'lib/product-language.ts',
  'lib/product-language.test.ts',
  'domain/governance/product-language-governance.test.ts',
] as const

const ACTIVE_UI_FILES = [
  'components/layout/app-sidebar.tsx',
  'components/layout/workspace-dashboard-composition.tsx',
  'components/collaboration/match-card.tsx',
  'components/collaboration/matches-list-section.tsx',
  'pages/workspace/people-pages.tsx',
  'pages/workspace/pipeline-pages.tsx',
  'pages/workspace/commercial-agreements-pages.tsx',
  'pages/workspace/contracts-pages.tsx',
  'pages/admin/admin-pages.tsx',
] as const

const FORBIDDEN_LABELS = [
  /['"`][^'"`\n]*\b(Commercial Agreement|Commercial Agreements)\b[^'"`\n]*['"`]/,
  /['"`][^'"`\n]*\b(Deal|Deals)\b[^'"`\n]*['"`]/,
  /['"`][^'"`\n]*\b(Negotiation|Negotiations)\b[^'"`\n]*['"`]/,
  /['"`][^'"`\n]*\b(Contract|Contracts)\b[^'"`\n]*['"`]/,
  /['"`][^'"`\n]*\b(Opportunity|Opportunities)\b[^'"`\n]*['"`]/,
  /['"`][^'"`\n]*\bExecution\b[^'"`\n]*['"`]/,
]

function listSourceFiles(root: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = join(root, entry.name)
    if (entry.isDirectory()) {
      results.push(...listSourceFiles(absolute))
      continue
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue
    if (/\.test\.(ts|tsx)$/.test(entry.name)) continue
    results.push(absolute)
  }
  return results
}

describe('product language governance', () => {
  it('prevents hardcoded core product labels in active UI files', () => {
    const files = listSourceFiles(webRoot)
    const violations: string[] = []

    for (const absolutePath of files) {
      const path = relative(webRoot, absolutePath).replaceAll('\\', '/')
      if (HARDCODED_LABEL_ALLOWLIST.includes(path as (typeof HARDCODED_LABEL_ALLOWLIST)[number])) {
        continue
      }

      const source = readFileSync(absolutePath, 'utf8')
      if (!ACTIVE_UI_FILES.includes(path as (typeof ACTIVE_UI_FILES)[number])) {
        continue
      }
      for (const pattern of FORBIDDEN_LABELS) {
        if (pattern.test(source)) {
          violations.push(`${path}: ${pattern}`)
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Use product language registry in UI instead of hardcoded labels.\n${violations.join('\n')}`,
    )
  })
})
