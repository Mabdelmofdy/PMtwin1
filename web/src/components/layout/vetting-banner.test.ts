import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('vetting banner source', () => {
  it('hides duplicate banner on pending dashboard routes', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/layout/vetting-banner.tsx'),
      'utf8',
    )
    assert.equal(source.includes('useLocation'), true)
    assert.equal(source.includes('isPendingApproval'), true)
    assert.equal(source.includes('/dashboard'), true)
    assert.equal(source.includes('/company-dashboard'), true)
  })
})
