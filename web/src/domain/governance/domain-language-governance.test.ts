import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const LEGACY_COMPAT_ALLOWLIST = [
  'api/deals.ts',
  'repositories/deal-repository.ts',
  'services/deal-service.ts',
  'services/deal-command-service.ts',
  'commands/handlers/deal-command-handler.ts',
  'lib/create-deal-ui-actions.ts',
  'lib/deal-detail-read-model.ts',
  'lib/deal-transition-ui-actions.ts',
  'components/negotiation/create-deal-button.tsx',
  'pages/workspace/deals-pages.tsx',
  'domain/rbac/policies/deal.policy.ts',
  'commands/default-command-gateway.ts',
  'commands/handlers/contract-command-handler.ts',
  'repositories/index.ts',
  'services/lifecycle-orchestrator.ts',
] as const

const FORBIDDEN_PATTERNS: readonly { readonly label: string; readonly regex: RegExp }[] = [
  { label: 'DealRepository', regex: /\bDealRepository\b/ },
  { label: 'CreateDeal command', regex: /\bCreateDeal[A-Za-z]+\b/ },
  { label: 'deal.created audit event', regex: /\bdeal\.created\b/ },
  { label: 'legacy workflow action create_deal_from_*', regex: /\bcreate_deal_from_[a-z_]+\b/ },
  { label: 'legacy workflow action create_contract_from_deal', regex: /\bcreate_contract_from_deal\b/ },
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

describe('domain language governance', () => {
  it('prevents new legacy Deal terminology in active business runtime code', () => {
    const files = listSourceFiles(webRoot)
    const violations: string[] = []

    for (const absolutePath of files) {
      const path = relative(webRoot, absolutePath).replaceAll('\\', '/')
      if (LEGACY_COMPAT_ALLOWLIST.includes(path as (typeof LEGACY_COMPAT_ALLOWLIST)[number])) {
        continue
      }

      const source = readFileSync(absolutePath, 'utf8')
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.regex.test(source)) {
          violations.push(`${path}: ${rule.label}`)
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Legacy Deal terminology is only allowed in explicit compatibility shims.\n${violations.join('\n')}`,
    )
  })
})
