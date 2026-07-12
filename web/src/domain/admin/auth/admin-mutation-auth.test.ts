import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  authorizeAdminMutation,
  denyUnlessAuthorized,
} from '@/domain/admin/auth/admin-mutation-auth.ts'

describe('admin-mutation-auth', () => {
  it('allows platform admin for user manage', () => {
    const result = authorizeAdminMutation('admin', 'admin.users.manage')
    assert.equal(result.allowed, true)
  })

  it('denies auditor for all mutations', () => {
    assert.equal(authorizeAdminMutation('auditor', 'admin.users.manage').allowed, false)
    assert.equal(authorizeAdminMutation('auditor', 'admin.vetting.manage').allowed, false)
    assert.equal(authorizeAdminMutation('auditor', 'admin.environment.manage').allowed, false)
    assert.ok(denyUnlessAuthorized('auditor', 'admin.memberships.manage'))
  })

  it('allows moderator vetting but not memberships', () => {
    assert.equal(authorizeAdminMutation('moderator', 'admin.vetting.manage').allowed, true)
    assert.equal(authorizeAdminMutation('moderator', 'admin.memberships.manage').allowed, false)
  })
})
