import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolvePostLoginPath } from '@/domain/rbac/resolve-post-login-path.ts'

describe('resolvePostLoginPath', () => {
  it('sends admin accounts to the Admin Portal by default', () => {
    assert.equal(resolvePostLoginPath({ userRole: 'admin' }), '/admin')
    assert.equal(
      resolvePostLoginPath({ userRole: 'admin', from: '/dashboard' }),
      '/admin',
    )
  })

  it('preserves an explicit admin deep link for staff', () => {
    assert.equal(
      resolvePostLoginPath({
        userRole: 'admin',
        from: '/admin/vetting',
      }),
      '/admin/vetting',
    )
  })

  it('does not send marketplace users to the Admin Portal', () => {
    assert.equal(
      resolvePostLoginPath({ userRole: 'professional', from: '/dashboard' }),
      '/dashboard',
    )
    assert.equal(
      resolvePostLoginPath({
        userRole: 'company_owner',
        isCompanyUser: true,
      }),
      '/company-dashboard',
    )
  })

  it('preserves non-admin deep links after login', () => {
    assert.equal(
      resolvePostLoginPath({
        userRole: 'professional',
        from: '/opportunities/opp-1',
      }),
      '/opportunities/opp-1',
    )
  })

  it('blocks admin deep links for non-staff and falls back to workspace home', () => {
    assert.equal(
      resolvePostLoginPath({
        userRole: 'professional',
        from: '/admin/users',
      }),
      '/dashboard',
    )
  })
})
