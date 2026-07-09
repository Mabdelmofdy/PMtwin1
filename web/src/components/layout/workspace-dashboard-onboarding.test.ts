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

  it('does not expose business dashboard widgets on pending path', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/layout/workspace-dashboard-composition.tsx'),
      'utf8',
    )
    const pendingReturn = source.indexOf('<PendingVettingDashboard user={user} />')
    const mainDashboardReturn = source.indexOf('Good morning')
    assert.ok(pendingReturn >= 0)
    assert.ok(mainDashboardReturn > pendingReturn)
    assert.equal(source.includes('buildNeedsActionItems'), true)
    assert.equal(source.slice(0, pendingReturn).includes('Executive intelligence'), false)
  })
})
