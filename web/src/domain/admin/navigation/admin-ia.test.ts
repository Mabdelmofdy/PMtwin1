import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ADMIN_IA_SECTIONS, allAdminIaHrefs } from './admin-ia.ts'

describe('admin-ia', () => {
  it('includes command center and system sections', () => {
    const ids = ADMIN_IA_SECTIONS.map((s) => s.id)
    assert.ok(ids.includes('command_center'))
    assert.ok(ids.includes('system'))
    assert.ok(ids.includes('commercial'))
  })

  it('uses Commercial Agreements terminology', () => {
    const commercial = ADMIN_IA_SECTIONS.find((s) => s.id === 'commercial')
    assert.ok(commercial?.items.some((i) => i.title.includes('Commercial Agreement')))
    assert.equal(commercial?.items.some((i) => i.title === 'Deals'), false)
  })

  it('exposes unique hrefs', () => {
    const hrefs = allAdminIaHrefs()
    assert.equal(new Set(hrefs).size, hrefs.length)
  })
})
