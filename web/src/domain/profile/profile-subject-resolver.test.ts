import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Party } from '@pm-twin/party'
import type { BusinessWorkspace } from '@pm-twin/identity'
import type { PlatformUser } from '@/types/domain.ts'
import {
  resolveProfileSubject,
  type ProfileSubjectResolverDeps,
} from '@/domain/profile/profile-subject-resolver.ts'

const user: PlatformUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'user',
  status: 'active',
  profile: { name: 'Professional' },
}
const company: PlatformUser = {
  id: 'company-1',
  email: 'company@example.com',
  role: 'company',
  status: 'active',
  profile: { name: 'Company' },
}
const companyParty: Party = {
  id: 'party-company-1',
  partyType: 'company',
  displayName: 'Company',
  status: 'active',
  sourceEntityId: company.id,
  sourceEntityType: 'company',
  companyProfileId: company.id,
  workspaceId: 'workspace-company-1',
}
const workspace = {
  id: 'workspace-company-1',
  ownerPartyId: companyParty.id,
} as BusinessWorkspace

function createDeps(): ProfileSubjectResolverDeps {
  return {
    getPartyById: (id) => (id === companyParty.id ? companyParty : undefined),
    getWorkspaceById: (id) => (id === workspace.id ? workspace : undefined),
    getUserById: (id) => (id === user.id ? user : undefined),
    getCompanyById: (id) => (id === company.id ? company : undefined),
  }
}

describe('resolveProfileSubject', () => {
  it('resolves a company Party to its source company record', () => {
    const subject = resolveProfileSubject(
      { partyId: companyParty.id, legacyAccountId: user.id },
      createDeps(),
    )

    assert.equal(subject?.profileKind, 'company')
    assert.equal(subject?.sourceEntityId, company.id)
    assert.equal(subject?.account.profile?.name, 'Company')
  })

  it('resolves a workspace through its owner Party', () => {
    const subject = resolveProfileSubject(
      { workspaceId: workspace.id },
      createDeps(),
    )

    assert.equal(subject?.partyId, companyParty.id)
    assert.equal(subject?.workspaceId, workspace.id)
    assert.equal(subject?.sourceEntityId, company.id)
  })

  it('uses a legacy user ID only when canonical references are absent', () => {
    const subject = resolveProfileSubject(
      { legacyAccountId: user.id },
      createDeps(),
    )

    assert.equal(subject?.profileKind, 'individual')
    assert.equal(subject?.sourceEntityId, user.id)
  })
})
