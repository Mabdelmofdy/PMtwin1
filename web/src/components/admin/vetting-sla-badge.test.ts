import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('vetting sla badge source', () => {
  it('shows badge with relative and target SLA labels and aria-label', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/admin/vetting-sla-badge.tsx'),
      'utf8',
    )
    assert.equal(source.includes('formatVettingSlaDisplay'), true)
    assert.equal(source.includes('relativeLabel'), true)
    assert.equal(source.includes('targetLabel'), true)
    assert.equal(source.includes('aria-label'), true)
    assert.equal(source.includes('formatVettingSlaDisplay'), true)
  })
})
