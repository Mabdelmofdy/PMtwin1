import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('admin vetting workflow page source', () => {
  it('renders required workflow queues and actions', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/pages/admin/admin-pages.tsx'),
      'utf8',
    )
    assert.equal(source.includes('Pending review'), true)
    assert.equal(source.includes('Changes requested'), true)
    assert.equal(source.includes('Resubmitted'), true)
    assert.equal(source.includes('Approved / rejected history'), true)
    assert.equal(source.includes('requestVettingChanges'), true)
    assert.equal(source.includes('approveVetting'), true)
    assert.equal(source.includes('rejectVetting'), true)
  })

  it('shows governance metadata fields in review column', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/pages/admin/admin-pages.tsx'),
      'utf8',
    )
    assert.equal(source.includes('requestedChanges ?? vetting?.requestedItems ?? []'), true)
    assert.equal(source.includes('reviewNotes ?? vetting?.reason'), true)
    assert.equal(source.includes('Reviewed by'), true)
    assert.equal(source.includes('VettingSlaBadge'), true)
  })
})
