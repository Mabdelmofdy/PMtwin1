import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ApplicationRepository } from '@/repositories/application-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import { CompanyRepository } from '@/repositories/company-repository.ts'
import { ContractRepository } from '@/repositories/contract-repository.ts'
import { DealRepository } from '@/repositories/deal-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { NotificationRepository } from '@/repositories/notification-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import {
  REPOSITORY_ENTITY_KEYS,
  READ_ONLY_SEED_REPOSITORY_KEYS,
} from '@/repositories/repository-entity-keys.ts'
import { MemoryStorageAdapter } from '@/commands/test-helpers/command-gateway-test-stack.ts'

type RepositorySpec = {
  readonly name: string
  readonly entityKey: string
  readonly factory: (storage: MemoryStorageAdapter) => { getEntityKey: () => string }
}

const REPOSITORY_SPECS: readonly RepositorySpec[] = [
  {
    name: 'ApplicationRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.application,
    factory: (storage) => new ApplicationRepository(storage, () => []),
  },
  {
    name: 'OpportunityRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.opportunity,
    factory: (storage) => new OpportunityRepository(storage, () => []),
  },
  {
    name: 'UserRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.user,
    factory: (storage) => new UserRepository(storage, () => []),
  },
  {
    name: 'CompanyRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.company,
    factory: (storage) => new CompanyRepository(storage, () => []),
  },
  {
    name: 'AuditRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.audit,
    factory: (storage) => new AuditRepository(storage, () => []),
  },
  {
    name: 'PostMatchRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.postMatch,
    factory: (storage) => new PostMatchRepository(storage, () => []),
  },
  {
    name: 'DealRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.deal,
    factory: (storage) => new DealRepository(storage, () => []),
  },
  {
    name: 'NegotiationRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.negotiation,
    factory: (storage) => new NegotiationRepository(storage, () => []),
  },
  {
    name: 'ContractRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.contract,
    factory: (storage) => new ContractRepository(storage, () => []),
  },
  {
    name: 'NotificationRepository',
    entityKey: REPOSITORY_ENTITY_KEYS.notification,
    factory: (storage) => new NotificationRepository(storage, () => []),
  },
]

describe('repository entityKey registry', () => {
  it('assigns a unique entityKey to each repository', () => {
    const keys = REPOSITORY_SPECS.map((spec) => spec.entityKey)
    assert.equal(keys.length, new Set(keys).size)
  })

  for (const spec of REPOSITORY_SPECS) {
    it(`${spec.name} uses entityKey "${spec.entityKey}"`, () => {
      const storage = new MemoryStorageAdapter()
      const repository = spec.factory(storage)
      assert.equal(repository.getEntityKey(), spec.entityKey)
    })
  }

  it('user, company, and audit repositories do not use applications key', () => {
    const forbidden = REPOSITORY_ENTITY_KEYS.application
    const guarded = REPOSITORY_SPECS.filter((spec) =>
      ['UserRepository', 'CompanyRepository', 'AuditRepository'].includes(spec.name),
    )

    for (const spec of guarded) {
      assert.notEqual(spec.entityKey, forbidden)
    }
  })

  it('read-only seed repositories use dedicated keys', () => {
    const userSpec = REPOSITORY_SPECS.find((spec) => spec.name === 'UserRepository')
    const companySpec = REPOSITORY_SPECS.find((spec) => spec.name === 'CompanyRepository')

    assert.equal(userSpec?.entityKey, READ_ONLY_SEED_REPOSITORY_KEYS[0])
    assert.equal(companySpec?.entityKey, READ_ONLY_SEED_REPOSITORY_KEYS[1])
  })
})
