import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('admin vetting workflow page source', () => {
  it('renders required workflow queues and domain vetting commands', () => {
    // Canonical contract: Admin vetting mutations go through domain execute*
    // commands (vetting-admin-commands), not legacy adminApi.approveVetting helpers.
    const source = readFileSync(
      path.join(process.cwd(), 'src/pages/admin/admin-pages.tsx'),
      'utf8',
    )
    assert.equal(source.includes('Pending review'), true)
    assert.equal(source.includes('Changes requested'), true)
    assert.equal(source.includes('Resubmitted'), true)
    assert.equal(source.includes('Approved / rejected history'), true)
    assert.equal(source.includes('executeRequestVettingClarification'), true)
    assert.equal(source.includes('executeApproveVetting'), true)
    assert.equal(source.includes('executeRejectVetting'), true)
    assert.equal(source.includes('admin.vetting.manage'), true)
  })

  it('shows governance metadata fields in review column and KPI strip', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/pages/admin/admin-pages.tsx'),
      'utf8',
    )
    assert.equal(source.includes('requestedChanges ?? vetting?.requestedItems ?? []'), true)
    assert.equal(source.includes('reviewNotes ?? vetting?.reason'), true)
    assert.equal(source.includes('Reviewed by'), true)
    assert.equal(source.includes('VettingSlaBadge'), true)
    assert.equal(source.includes('AdminVettingKpiStrip'), true)
    assert.equal(source.includes('computeAdminVettingKpiMetrics'), true)
    assert.equal(source.includes('opacity-90'), true)
  })
})
