import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadCompanies, loadUsers, loadPartyDocuments } from '@/infrastructure/seed/seed-loader.ts'
import { resolveVettingCaseStatus } from '@/types/vetting.ts'
import {
  workspaceIdForSource,
  membershipIdFor,
  projectIdentityFromLegacyAccounts,
} from '@pm-twin/identity'

describe('demo/UAT seed certification', () => {
  it('has 15+ companies and 30+ people users all approved/active', () => {
    const companies = loadCompanies()
    const users = loadUsers()
    assert.ok(companies.length >= 15, `expected >=15 companies, got ${companies.length}`)
    assert.ok(users.length >= 30, `expected >=30 users, got ${users.length}`)

    for (const company of companies) {
      assert.equal(company.status, 'active', `company ${company.id} not active`)
    }
    for (const user of users) {
      if (user.role === 'admin') continue
      assert.equal(user.status, 'active', `user ${user.id} not active`)
      const caseStatus = resolveVettingCaseStatus(user.profile?.vetting, user.status)
      assert.equal(caseStatus, 'approved', `user ${user.id} caseStatus=${caseStatus}`)
    }
  })

  it('projects employee memberships onto company workspaces', () => {
    const companies = loadCompanies()
    const users = loadUsers()
    const companyIds = new Set(companies.map((c) => c.id))
    const employees = users.filter((user) => {
      const employer =
        (user as { employerCompanyId?: string }).employerCompanyId ??
        (user.profile as { employerCompanyId?: string } | undefined)?.employerCompanyId
      return Boolean(employer && companyIds.has(employer))
    })
    assert.ok(employees.length >= 12, `expected >=12 employees, got ${employees.length}`)

    const employeeLinks = employees.map((user) => {
      const employer =
        (user as { employerCompanyId?: string }).employerCompanyId ??
        (user.profile as { employerCompanyId?: string } | undefined)?.employerCompanyId!
      return { userId: user.id, companyId: employer, role: 'member' as const }
    })

    const projection = projectIdentityFromLegacyAccounts({
      users,
      companies,
      companyOwnerLinks: employeeLinks,
    })

    for (const link of employeeLinks) {
      const workspaceId = workspaceIdForSource(link.companyId, 'company')
      const membershipId = membershipIdFor(link.userId, workspaceId)
      const membership = projection.memberships.find((m) => m.id === membershipId)
      assert.ok(membership, `missing membership ${membershipId}`)
      assert.equal(membership?.status, 'active')
    }
  })

  it('loads approved party documents for seed personas', () => {
    const docs = loadPartyDocuments()
    assert.ok(docs.length > 0, 'expected party documents')
    const approved = docs.filter((d) => d.status === 'approved')
    assert.ok(approved.length > 0, 'expected approved documents')
  })
})
