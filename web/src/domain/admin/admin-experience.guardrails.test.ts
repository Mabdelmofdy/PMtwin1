import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  adminRoleDisplayLabel,
  isMutatingAdminRole,
  isPlatformStaffRole,
  toUnifiedAdminRole,
} from '@/domain/rbac/roles/canonical-roles.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { ADMIN_PAGE_REGISTRY } from '@/pages/admin/registry/admin-page-registry.ts'
import { ADMIN_IA_SECTIONS, allAdminIaHrefs } from '@/domain/admin/navigation/admin-ia.ts'
import { ADMIN_QUICK_ACTION_CATALOGUE } from '@/domain/admin/actions/quick-action-catalogue.ts'

describe('admin experience guardrails', () => {
  it('unifies staff roles for portal access', () => {
    assert.equal(isPlatformStaffRole('admin'), true)
    assert.equal(isPlatformStaffRole('moderator'), true)
    assert.equal(isPlatformStaffRole('auditor'), true)
    assert.equal(isPlatformStaffRole('professional'), false)
    assert.equal(toUnifiedAdminRole('admin'), 'platform_admin')
    assert.equal(toUnifiedAdminRole('auditor'), 'auditor')
    assert.equal(isMutatingAdminRole('auditor'), false)
    assert.equal(isMutatingAdminRole('admin'), true)
    assert.equal(adminRoleDisplayLabel('admin'), 'Platform Admin')
  })

  it('auditor can read audit but not manage users', () => {
    assert.equal(hasAdminCapability('auditor', 'admin.audit.read'), true)
    assert.equal(hasAdminCapability('auditor', 'admin.users.manage'), false)
    assert.equal(hasAdminCapability('admin', 'admin.users.manage'), true)
  })

  it('page registry covers IA hrefs without fake mutation catalogues', () => {
    const registryHrefs = new Set(ADMIN_PAGE_REGISTRY.map((p) => p.href))
    for (const href of allAdminIaHrefs()) {
      assert.ok(registryHrefs.has(href), `missing registry entry for ${href}`)
    }
    assert.ok(ADMIN_IA_SECTIONS.some((s) => s.id === 'command_center'))
    assert.ok(ADMIN_IA_SECTIONS.some((s) => s.id === 'workspaces'))
    assert.ok(ADMIN_IA_SECTIONS.some((s) => s.id === 'explore'))
    assert.ok(
      ADMIN_IA_SECTIONS.find((s) => s.id === 'system')?.items.some(
        (i) => i.href === '/admin/environments',
      ),
    )
  })

  it('quick actions never expose Match Type selection', () => {
    const joined = ADMIN_QUICK_ACTION_CATALOGUE.map((a) => a.label).join(' ').toLowerCase()
    assert.equal(joined.includes('match type'), false)
  })
})
