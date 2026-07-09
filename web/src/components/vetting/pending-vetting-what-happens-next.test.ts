import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('pending vetting what happens next source', () => {
  it('documents reassurance copy for pending users', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/pending-vetting-what-happens-next.tsx'),
      'utf8',
    )
    assert.equal(source.includes('What happens next?'), true)
    assert.equal(source.includes('Admin will review your account.'), true)
    assert.equal(source.includes('you will receive a notification.'), true)
    assert.equal(source.includes('create and publish opportunities.'), true)
  })
})
