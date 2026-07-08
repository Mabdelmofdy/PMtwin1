import type { Party } from '@pm-twin/party'
import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import type { PlatformUser } from '@/types/domain.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'
import {
  buildCompanyIdSet,
  projectAccountsToParties,
} from '@/domain/party/party-projection.ts'

export class PartyRepository {
  private readonly storage: IStorageAdapter
  private readonly loadUsers: () => PlatformUser[]
  private readonly loadCompanies: () => PlatformUser[]

  constructor(
    storage: IStorageAdapter,
    loadUsers: () => PlatformUser[],
    loadCompanies: () => PlatformUser[],
  ) {
    this.storage = storage
    this.loadUsers = loadUsers
    this.loadCompanies = loadCompanies
  }

  private readOverrides(): Overrides {
    return this.storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  }

  private synthesizedParties(): Party[] {
    const companies = this.loadCompanies()
    const users = this.loadUsers()
    const companyIds = buildCompanyIdSet(companies.map((company) => company.id))
    return projectAccountsToParties([...companies, ...users], companyIds)
  }

  getAll(): Party[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.synthesizedParties(),
      patches: overrides[REPOSITORY_ENTITY_KEYS.party],
      newItems: overrides.newParties ?? [],
      deletedIds: overrides.deletedParties ?? [],
    })
  }

  getById(id: string): Party | undefined {
    return this.getAll().find((party) => party.id === id)
  }
}
