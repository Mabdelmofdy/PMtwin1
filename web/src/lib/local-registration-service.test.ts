import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { IStorageAdapter } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { loadCompanies, loadUsers } from '@/infrastructure/seed/seed-loader.ts'
import {
  DEMO_NAMESPACE_PREFIX,
  NamespacedStorageAdapter,
} from '@/infrastructure/storage/namespaced-storage-adapter.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import { CompanyRepository } from '@/repositories/company-repository.ts'
import { PartyRepository } from '@/repositories/party-repository.ts'
import { PartyMembershipRepository } from '@/repositories/party-membership-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import { registerLocalAccount } from '@/lib/local-registration-service.ts'
import { resolveOpportunityOwnerPartyId } from '@/domain/party/ownership-adapters.ts'

class MemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value)
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

function createIsolatedRegistrationStack(namespace: string) {
  const rootStorage = new MemoryStorageAdapter()
  const storage = new NamespacedStorageAdapter(rootStorage, namespace)
  const userRepository = new UserRepository(storage, loadUsers)
  const companyRepository = new CompanyRepository(storage, loadCompanies)
  const partyRepository = new PartyRepository(storage, loadUsers, loadCompanies)
  const partyMembershipRepository = new PartyMembershipRepository(
    storage,
    () => userRepository.getAll(),
    () => companyRepository.getAll(),
  )
  const opportunityRepository = new OpportunityRepository(storage, () => [])

  return {
    storage,
    rootStorage,
    userRepository,
    companyRepository,
    partyRepository,
    partyMembershipRepository,
    opportunityRepository,
    deps: {
      userRepository,
      companyRepository,
      partyRepository,
      partyMembershipRepository,
    },
  }
}

describe('local registration service', () => {
  it('creates individual user party and primary membership in demo namespace', () => {
    const stack = createIsolatedRegistrationStack(DEMO_NAMESPACE_PREFIX)
    const result = registerLocalAccount(
      {
        accountType: 'individual',
        email: 'individual.demo@test',
        password: 'StrongPass1',
        profile: { displayName: 'Aisha Saleh', country: 'Saudi Arabia' },
      },
      stack.deps,
    )

    assert.equal(result.partyType, 'individual')
    assert.equal(result.partyId, result.userId)
    assert.equal(stack.userRepository.getById(result.userId)?.status, 'pending_vetting')
    assert.equal(stack.partyRepository.getById(result.partyId)?.status, 'pending_vetting')
    assert.equal(
      stack.partyMembershipRepository.getPrimaryForUser(result.userId)?.partyId,
      result.userId,
    )
    assert.equal(stack.rootStorage.get(`${DEMO_NAMESPACE_PREFIX}${OVERRIDES_KEY}`) != null, true)
    assert.equal(loadUsers().some((user) => user.email === 'individual.demo@test'), false)
  })

  it('creates company signup with user auth company party and owner membership in uat namespace', () => {
    const stack = createIsolatedRegistrationStack('PMTWIN_UAT_')
    const result = registerLocalAccount(
      {
        accountType: 'company',
        email: 'owner@acme.test',
        password: 'StrongPass1',
        profile: {
          displayName: 'Acme Projects',
          contactPerson: 'Faisal Omar',
          country: 'Saudi Arabia',
        },
      },
      stack.deps,
    )

    const authUser = stack.userRepository.getById(result.userId)
    const company = stack.companyRepository.getById(result.partyId)

    assert.equal(result.partyType, 'company')
    assert.notEqual(result.userId, result.partyId)
    assert.equal(authUser?.status, 'pending_vetting')
    assert.equal(company?.status, 'pending_vetting')
    assert.equal(stack.partyRepository.getById(result.partyId)?.status, 'pending_vetting')
    assert.equal(authUser?.email, 'owner@acme.test')
    assert.equal(authUser?.profile?.type, undefined)
    assert.equal(company?.profile?.type, 'company')
    assert.equal(company?.email.endsWith('@internal.pmtwin'), true)
    assert.equal(
      stack.partyMembershipRepository.getPrimaryForUser(result.userId)?.membershipRole,
      'owner',
    )
  })
})

describe('registration ownership integration', () => {
  it('company signup then opportunity creation keeps ownerPartyId aligned with active party', () => {
    const stack = createIsolatedRegistrationStack(DEMO_NAMESPACE_PREFIX)
    const signup = registerLocalAccount(
      {
        accountType: 'company',
        email: 'company.owner@test',
        password: 'StrongPass1',
        profile: {
          displayName: 'Riyadh Build Co',
          contactPerson: 'Owner Person',
        },
      },
      stack.deps,
    )

    const activePartyId = stack.partyMembershipRepository.getPrimaryForUser(signup.userId)?.partyId
    assert.equal(activePartyId, signup.partyId)

    const opportunity = stack.opportunityRepository.create({
      title: 'Company opportunity',
      status: 'draft',
      creatorId: signup.userId,
      ownerPartyId: activePartyId,
    })

    assert.equal(opportunity.ownerPartyId, activePartyId)
    assert.equal(
      resolveOpportunityOwnerPartyId(opportunity),
      activePartyId,
    )
  })

  it('individual signup then opportunity creation keeps ownerPartyId aligned with active party', () => {
    const stack = createIsolatedRegistrationStack(DEMO_NAMESPACE_PREFIX)
    const signup = registerLocalAccount(
      {
        accountType: 'individual',
        email: 'individual.owner@test',
        password: 'StrongPass1',
        profile: { displayName: 'Independent PM' },
      },
      stack.deps,
    )

    const activePartyId = stack.partyMembershipRepository.getPrimaryForUser(signup.userId)?.partyId
    assert.equal(activePartyId, signup.partyId)

    const opportunity = stack.opportunityRepository.create({
      title: 'Individual opportunity',
      status: 'draft',
      creatorId: signup.userId,
      ownerPartyId: activePartyId,
    })

    assert.equal(opportunity.ownerPartyId, activePartyId)
    assert.equal(
      resolveOpportunityOwnerPartyId(opportunity),
      activePartyId,
    )
  })
})

describe('parties api active party resolution', () => {
  it('resolveActiveParty returns the party created during signup', () => {
    const stack = createIsolatedRegistrationStack(DEMO_NAMESPACE_PREFIX)
    const signup = registerLocalAccount(
      {
        accountType: 'company',
        email: 'resolve@test',
        password: 'StrongPass1',
        profile: {
          displayName: 'Resolve Co',
          contactPerson: 'Resolver',
        },
      },
      stack.deps,
    )

    const party = stack.partyRepository.getById(signup.partyId)
    assert.equal(party?.partyType, 'company')
    assert.equal(
      stack.partyMembershipRepository.getPrimaryForUser(signup.userId)?.partyId,
      signup.partyId,
    )
  })
})
