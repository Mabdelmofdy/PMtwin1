import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { projectIdentityFromLegacyAccounts } from '@pm-twin/identity'

describe('identity migration idempotency', () => {
  it('migrate twice yields identical canonical identity state', () => {
    const input = {
      users: [
        { id: 'u-1', email: 'a@test.com', profile: { name: 'A' } },
        { id: 'u-2', email: 'b@test.com', profile: { name: 'B' } },
      ],
      companies: [
        { id: 'c-1', email: 'c@test.com', profile: { name: 'Co', type: 'company' } },
      ],
      companyOwnerLinks: [
        { userId: 'u-1', companyId: 'c-1', role: 'workspace_owner' as const },
        { userId: 'u-2', companyId: 'c-1', role: 'legal' as const },
      ],
      platformUserIds: new Set(['admin-1']),
    }

    const once = projectIdentityFromLegacyAccounts(input)
    const twice = projectIdentityFromLegacyAccounts(input)

    assert.deepEqual(
      once.workspaces.map((w) => w.id).sort(),
      twice.workspaces.map((w) => w.id).sort(),
    )
    assert.deepEqual(
      once.parties.map((p) => p.id).sort(),
      twice.parties.map((p) => p.id).sort(),
    )
    assert.deepEqual(
      once.memberships.map((m) => m.id).sort(),
      twice.memberships.map((m) => m.id).sort(),
    )
    assert.equal(once.parties.filter((p) => p.type === 'company').length, 1)
    assert.ok(
      once.memberships.filter((m) => m.workspaceId.includes('company-c-1')).length >= 2,
    )
  })
})
