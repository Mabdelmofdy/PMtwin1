import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { IStorageAdapter } from '@/types/storage.ts'
import { loadCompanies, loadUsers } from '@/infrastructure/seed/seed-loader.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import { CompanyRepository } from '@/repositories/company-repository.ts'
import { PartyRepository } from '@/repositories/party-repository.ts'
import { PartyMembershipRepository } from '@/repositories/party-membership-repository.ts'
import { registerLocalAccount } from '@/lib/local-registration-service.ts'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'

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

function createStack() {
  const storage = new MemoryStorageAdapter()
  const userRepository = new UserRepository(storage, loadUsers)
  const companyRepository = new CompanyRepository(storage, loadCompanies)
  const partyRepository = new PartyRepository(storage, loadUsers, loadCompanies)
  const partyMembershipRepository = new PartyMembershipRepository(storage, loadUsers, loadCompanies)
  return {
    userRepository,
    companyRepository,
    deps: { userRepository, companyRepository, partyRepository, partyMembershipRepository },
  }
}

describe('signup zero baseline', () => {
  it('starts individual signup with pending_vetting and zero profile/vetting', () => {
    const stack = createStack()
    const result = registerLocalAccount(
      {
        accountType: 'individual',
        email: 'zero-individual@test',
        password: 'Password123!',
        profile: { displayName: 'Zero User' },
      },
      stack.deps,
    )
    const user = stack.userRepository.getById(result.userId)
    assert.ok(user)
    assert.equal(user?.status, 'pending_vetting')

    const profile = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: user?.profile ?? {},
    })
    const vetting = evaluateVettingReadiness({
      accountStatus: user?.status,
      reviewProgress: 'not_started',
      documents: [],
    })
    assert.equal(profile.score, 0)
    assert.equal(vetting.score < 100, true)
  })

  it('starts company signup with pending_vetting and locked profile completion', () => {
    const stack = createStack()
    const result = registerLocalAccount(
      {
        accountType: 'company',
        email: 'zero-company@test',
        password: 'Password123!',
        profile: { displayName: 'Zero Company', contactPerson: 'Owner' },
      },
      stack.deps,
    )

    const company = stack.companyRepository.getById(result.partyId)
    assert.ok(company)
    assert.equal(company?.status, 'pending_vetting')
    assert.equal(company?.profile?.profileCompletionUnlocked, false)
  })
})

