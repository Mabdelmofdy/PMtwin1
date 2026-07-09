import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('pending vetting secondary actions source', () => {
  it('shows secondary, additional, and waiting tiers without primary heading', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-secondary-actions.tsx'),
      'utf8',
    )
    assert.equal(source.includes('Secondary action'), true)
    assert.equal(source.includes('Additional recommendations'), true)
    assert.equal(source.includes('actionQueue.waiting'), true)
    assert.equal(source.includes('Primary action'), false)
    assert.equal(source.includes('role="list"'), true)
  })
})
