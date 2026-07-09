import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { IStorageAdapter } from '@/types/storage.ts'
import { loadCompanies, loadUsers } from '@/infrastructure/seed/seed-loader.ts'
import { PartyRepository } from '@/repositories/party-repository.ts'
import { PartyMembershipRepository } from '@/repositories/party-membership-repository.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import { CompanyRepository } from '@/repositories/company-repository.ts'
import { registerLocalAccount } from '@/lib/local-registration-service.ts'

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

function createPartyApi(stack: {
  userRepository: UserRepository
  companyRepository: CompanyRepository
  partyRepository: PartyRepository
  partyMembershipRepository: PartyMembershipRepository
}) {
  return {
    resolveActivePartyId(userId: string) {
      return (
        stack.partyMembershipRepository.getPrimaryForUser(userId)?.partyId ?? userId
      )
    },
    resolveActiveParty(userId: string) {
      const partyId = stack.partyMembershipRepository.getPrimaryForUser(userId)?.partyId ?? userId
      return stack.partyRepository.getById(partyId)
    },
  }
}

describe('parties api resolution', () => {
  it('resolveActivePartyId uses primary membership party', () => {
    const storage = new MemoryStorageAdapter()
    const userRepository = new UserRepository(storage, loadUsers)
    const companyRepository = new CompanyRepository(storage, loadCompanies)
    const partyRepository = new PartyRepository(storage, loadUsers, loadCompanies)
    const partyMembershipRepository = new PartyMembershipRepository(
      storage,
      () => userRepository.getAll(),
      () => companyRepository.getAll(),
    )

    const signup = registerLocalAccount(
      {
        accountType: 'company',
        email: 'party.api@test',
        password: 'StrongPass1',
        profile: {
          displayName: 'Party API Co',
          contactPerson: 'Party Owner',
        },
      },
      {
        userRepository,
        companyRepository,
        partyRepository,
        partyMembershipRepository,
      },
    )

    const partiesApi = createPartyApi({
      userRepository,
      companyRepository,
      partyRepository,
      partyMembershipRepository,
    })

    assert.equal(partiesApi.resolveActivePartyId(signup.userId), signup.partyId)
    assert.equal(partiesApi.resolveActiveParty(signup.userId)?.partyType, 'company')
  })
})
