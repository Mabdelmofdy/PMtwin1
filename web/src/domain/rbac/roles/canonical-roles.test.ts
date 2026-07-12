import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ADMIN_PORTAL_ROLES,
  PLATFORM_STAFF_ROLES,
  adminRoleDisplayLabel,
  isMutatingAdminRole,
  isPlatformStaffRole,
  toUnifiedAdminRole,
} from './canonical-roles.ts'

describe('canonical-roles', () => {
  it('maps legacy admin to platform_admin', () => {
    assert.equal(toUnifiedAdminRole('admin'), 'platform_admin')
    assert.equal(toUnifiedAdminRole('Admin'), 'platform_admin')
  })

  it('treats staff roles as portal-eligible', () => {
    assert.equal(isPlatformStaffRole('admin'), true)
    assert.equal(isPlatformStaffRole('auditor'), true)
    assert.equal(isPlatformStaffRole('professional'), false)
  })

  it('excludes auditor from mutating roles', () => {
    assert.equal(isMutatingAdminRole('admin'), true)
    assert.equal(isMutatingAdminRole('auditor'), false)
    assert.equal(isMutatingAdminRole('read_only_analyst'), false)
  })

  it('exposes display labels for platform staff roles', () => {
    for (const role of PLATFORM_STAFF_ROLES) {
      assert.ok(adminRoleDisplayLabel(role).length > 0)
    }
    assert.equal(ADMIN_PORTAL_ROLES.has('admin'), true)
  })
})
