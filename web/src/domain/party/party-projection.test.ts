import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildCompanyIdSet,
  projectAccountToParty,
  projectPrimaryMembership,
} from '@/domain/party/party-projection.ts'
import type { PlatformUser } from '@/types/domain.ts'

const companyAccount: PlatformUser = {
  id: 'seed-co-corp-001',
  email: 'corp@example.com',
  role: 'company_owner',
  status: 'active',
  profile: { name: 'ABC Construction', type: 'company' },
}

const individualAccount: PlatformUser = {
  id: 'seed-user-001',
  email: 'consultant@example.com',
  role: 'individual',
  status: 'active',
  profile: { name: 'Independent Structural Consultant' },
}

describe('party projection', () => {
  it('projects company account to company party with sourceEntity fields', () => {
    const companyIds = buildCompanyIdSet(['seed-co-corp-001'])
    const party = projectAccountToParty(companyAccount, companyIds)
    assert.equal(party.partyType, 'company')
    assert.equal(party.sourceEntityId, 'seed-co-corp-001')
    assert.equal(party.sourceEntityType, 'company')
    assert.equal(party.displayName, 'ABC Construction')
  })

  it('projects individual account to individual party', () => {
    const companyIds = buildCompanyIdSet(['seed-co-corp-001'])
    const party = projectAccountToParty(individualAccount, companyIds)
    assert.equal(party.partyType, 'individual')
    assert.equal(party.sourceEntityType, 'individual')
  })

  it('synthesizes primary membership for session account', () => {
    const companyIds = buildCompanyIdSet(['seed-co-corp-001'])
    const membership = projectPrimaryMembership(individualAccount, companyIds)
    assert.equal(membership.userId, 'seed-user-001')
    assert.equal(membership.partyId, 'seed-user-001')
    assert.equal(membership.isPrimary, true)
  })
})
