import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveAdminStatusTone } from '@/pages/admin/admin-display.tsx'

describe('admin-display', () => {
  it('maps success statuses to success tone', () => {
    assert.equal(resolveAdminStatusTone('published', 'opportunity'), 'success')
    assert.equal(resolveAdminStatusTone('active'), 'success')
  })

  it('maps danger statuses to danger tone', () => {
    assert.equal(resolveAdminStatusTone('cancelled', 'deal'), 'danger')
    assert.equal(resolveAdminStatusTone('rejected', 'application'), 'danger')
  })

  it('maps draft to muted tone', () => {
    assert.equal(resolveAdminStatusTone('draft', 'opportunity'), 'muted')
  })

  it('falls back to neutral for unknown statuses', () => {
    assert.equal(resolveAdminStatusTone('unknown_status'), 'neutral')
  })
})
