import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
// @ts-expect-error — governance rules are ESM in scripts/
import {
  BASELINE_EXCEPTION_KEYS,
  checkLine,
  isBaselineException,
  isPageFile,
  isStyleAllowlisted,
} from '../../../scripts/design/design-governance-rules.mjs'

describe('design-governance-rules', () => {
  it('detects hex colors outside allowlist', () => {
    const hits = checkLine('components/foo.tsx', 1, 'className="text-[#ff0000]"')
    assert.ok(hits.some((h) => h.type === 'HEX_COLOR'))
  })

  it('allows hex in token layer files', () => {
    const hits = checkLine('tokens/layers/foo.ts', 1, 'const x = "#fff"')
    assert.equal(hits.length, 0)
  })

  it('detects page shadcn button import', () => {
    const hits = checkLine(
      'pages/public/auth-pages.tsx',
      6,
      "import { Button } from '@/components/ui/button'",
    )
    assert.ok(hits.some((h) => h.type === 'PAGE_SHADCN_BUTTON'))
  })

  it('detects deprecated page-primitives import', () => {
    const hits = checkLine(
      'pages/foo.tsx',
      1,
      "import { PageHeader } from '@/components/shared/page-primitives'",
    )
    assert.ok(hits.some((h) => h.type === 'DEPRECATED_PAGE_PRIMITIVES'))
  })

  it('detects tailwind palette colors', () => {
    const hits = checkLine('components/foo.tsx', 1, 'className="bg-emerald-500/10"')
    assert.ok(hits.some((h) => h.type === 'TAILWIND_PALETTE'))
  })

  it('allows shadow arbitrary with CSS var reference', () => {
    const hits = checkLine(
      'components/data/pm-data-table.tsx',
      1,
      'shadow-[0_1px_0_0_var(--border)]',
    )
    assert.equal(hits.length, 0)
  })

  it('flags shadow arbitrary without var()', () => {
    const hits = checkLine('components/foo.tsx', 1, 'className="shadow-[0_2px_4px_rgba(0,0,0,0.1)]"')
    assert.ok(hits.some((h) => h.type === 'SHADOW_ARBITRARY'))
  })

  it('classifies page paths', () => {
    assert.equal(isPageFile('pages/dashboard-page.tsx'), true)
    assert.equal(isPageFile('components/ui/button.tsx'), false)
  })

  it('allowlists shadcn ui wrappers', () => {
    assert.equal(isStyleAllowlisted('components/ui/sidebar.tsx'), true)
  })

  it('marks baseline exceptions', () => {
    assert.ok(
      isBaselineException('pages/public/auth-pages.tsx', 6, 'PAGE_SHADCN_BUTTON'),
    )
    assert.ok(!isBaselineException('pages/dashboard-page.tsx', 1, 'PAGE_SHADCN_BUTTON'))
  })

  it('has baseline registry entries', () => {
    assert.ok(BASELINE_EXCEPTION_KEYS.size >= 5)
  })
})
