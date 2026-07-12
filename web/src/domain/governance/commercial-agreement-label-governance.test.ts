import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { adminNavigationGroups, mainNavigation, routeLabels } from '@/config/navigation'
import {
  CREATE_COMMERCIAL_AGREEMENT_LABEL,
} from '@/components/negotiation/create-commercial-agreement-button.tsx'
import {
  NEGOTIATION_LINKED_COMMERCIAL_AGREEMENT_LABEL,
} from '@/components/negotiation/negotiation-room-panel.tsx'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

const USER_FACING_SCAN_ROOTS = [
  'config',
  'components',
  'pages',
  'lib',
] as const

const LABEL_ALLOWLIST = [
  'lib/create-deal-ui-actions.ts',
  'lib/application-hiring-ui-actions.ts',
] as const

const FORBIDDEN_DEAL_LABEL = /['"`][^'"`\n]*\b(Deal|Deals)\b[^'"`\n]*['"`]/

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

describe('commercial agreement label governance', () => {
  it('uses Commercial Agreements in navigation labels', () => {
    const workspaceCommercialAgreementsItem = mainNavigation
      .flatMap((group) => group.items)
      .find((item) => item.href === '/commercial-agreements')
    assert.equal(workspaceCommercialAgreementsItem?.title, 'My Commercial Agreements')
    assert.equal(routeLabels.deals, 'Commercial Agreements')
  })

  it('uses Create Commercial Agreement CTA text', () => {
    assert.equal(CREATE_COMMERCIAL_AGREEMENT_LABEL, 'Create Commercial Agreement')
  })

  it('uses Commercial Agreement label in negotiation room linked records', () => {
    assert.equal(
      NEGOTIATION_LINKED_COMMERCIAL_AGREEMENT_LABEL,
      'Commercial Agreement',
    )
  })

  it('uses Commercial Agreement wording on admin surfaces', () => {
    const adminGroup = adminNavigationGroups.find((group) =>
      group.items.some((item) => item.href === '/admin/commercial-agreements'))
    assert.equal(adminGroup?.title, 'Commercial Operations')

    const adminItem = adminGroup?.items.find(
      (item) => item.href === '/admin/commercial-agreements',
    )
    assert.equal(adminItem?.title, 'Commercial Agreements')

    const adminPagesSource = readFileSync(
      join(webRoot, 'pages/admin/admin-pages.tsx'),
      'utf8',
    )
    assert.match(adminPagesSource, /commercial agreements/i)
    assert.doesNotMatch(adminPagesSource, /\bplatform deals\b/i)
  })

  it('prevents user-facing Deal/Deals labels outside explicit allowlist', () => {
    const violations: string[] = []

    for (const root of USER_FACING_SCAN_ROOTS) {
      const files = listSourceFiles(join(webRoot, root))
      for (const absolutePath of files) {
        const path = relative(webRoot, absolutePath).replaceAll('\\', '/')
        if (LABEL_ALLOWLIST.includes(path as (typeof LABEL_ALLOWLIST)[number])) {
          continue
        }

        const source = readFileSync(absolutePath, 'utf8')
        if (FORBIDDEN_DEAL_LABEL.test(source)) {
          violations.push(path)
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      `User-facing label regression: found Deal/Deals.\n${violations.join('\n')}`,
    )
  })
})
