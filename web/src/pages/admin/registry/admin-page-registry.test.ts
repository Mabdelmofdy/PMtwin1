import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ADMIN_PAGE_REGISTRY,
  getAdminCapabilityForPath,
  getAdminPageByHref,
} from './admin-page-registry.ts'

describe('admin-page-registry', () => {
  it('registers unique hrefs', () => {
    const hrefs = ADMIN_PAGE_REGISTRY.map((p) => p.href)
    assert.equal(new Set(hrefs).size, hrefs.length)
  })

  it('resolves executive command center', () => {
    const page = getAdminPageByHref('/admin')
    assert.equal(page?.id, 'executive')
    assert.equal(page?.title, 'Executive Command Center')
  })

  it('resolves capability for nested paths', () => {
    assert.equal(getAdminCapabilityForPath('/admin/users/u-1'), 'admin.users.read')
    assert.equal(getAdminCapabilityForPath('/admin'), 'admin.command_center.read')
    assert.equal(getAdminCapabilityForPath('/not-admin'), 'admin.portal.access')
  })
})
