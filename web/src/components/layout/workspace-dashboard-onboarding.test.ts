import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('workspace dashboard pending vetting routing', () => {
  it('hard-routes pending users to PendingVettingDashboard', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/layout/workspace-dashboard-composition.tsx'),
      'utf8',
    )
    assert.equal(source.includes('isPendingApproval'), true)
    assert.equal(source.includes('<PendingVettingDashboard user={user} />'), true)
    assert.equal(source.includes('isVettingRestricted ? ('), false)
  })
})
