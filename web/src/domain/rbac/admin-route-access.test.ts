import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import { evaluateAdminRouteAccess } from '@/domain/rbac/admin-route-access.ts'

describe('canAccessAdminForRole', () => {
  it('allows admin, moderator, and auditor', () => {
    assert.equal(canAccessAdminForRole('admin'), true)
    assert.equal(canAccessAdminForRole('moderator'), true)
    assert.equal(canAccessAdminForRole('auditor'), true)
  })

  it('denies company_owner, professional, and user roles', () => {
    assert.equal(canAccessAdminForRole('company_owner'), false)
    assert.equal(canAccessAdminForRole('professional'), false)
    assert.equal(canAccessAdminForRole('user'), false)
  })
})

describe('evaluateAdminRouteAccess', () => {
  it('unauthenticated user cannot access /admin', () => {
    assert.equal(
      evaluateAdminRouteAccess({
        isLoading: false,
        isAuthenticated: false,
        userRole: null,
      }),
      'redirect-login',
    )
  })

  it('normal authenticated user cannot access /admin', () => {
    assert.equal(
      evaluateAdminRouteAccess({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'professional',
      }),
      'access-denied',
    )
  })

  it('company_owner cannot access /admin', () => {
    assert.equal(
      evaluateAdminRouteAccess({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'company_owner',
      }),
      'access-denied',
    )
  })

  it('admin can access /admin', () => {
    assert.equal(
      evaluateAdminRouteAccess({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'admin',
      }),
      'allow',
    )
  })

  it('direct /admin/vetting URL blocked for non-admin', () => {
    assert.equal(
      evaluateAdminRouteAccess({
        isLoading: false,
        isAuthenticated: true,
        userRole: 'company_owner',
      }),
      'access-denied',
    )
  })

  it('returns loading while auth restores', () => {
    assert.equal(
      evaluateAdminRouteAccess({
        isLoading: true,
        isAuthenticated: false,
        userRole: null,
      }),
      'loading',
    )
  })
})
