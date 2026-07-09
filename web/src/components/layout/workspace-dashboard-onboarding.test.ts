import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('workspace dashboard onboarding widgets', () => {
  it('renders pending onboarding widgets and hides by isVettingRestricted guard', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/layout/workspace-dashboard-composition.tsx'),
      'utf8',
    )
    assert.equal(source.includes('isVettingRestricted ? ('), true)
    assert.equal(source.includes('Onboarding widgets'), true)
    assert.equal(source.includes('Profile completion'), true)
    assert.equal(source.includes('Pending documents'), true)
  })
})
