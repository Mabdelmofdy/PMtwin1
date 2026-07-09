import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('vetting timeline source', () => {
  it('contains onboarding lifecycle labels without persistent resubmitted status', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/onboarding/vetting-timeline.tsx'),
      'utf8',
    )
    assert.equal(source.includes('Registered'), true)
    assert.equal(source.includes('Pending Review'), true)
    assert.equal(source.includes('Changes Requested'), true)
    assert.equal(source.includes('Resubmitted'), true)
    assert.equal(source.includes('Approved'), true)
  })
})
