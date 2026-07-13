import type { Party } from '@pm-twin/party'
import { workspaceIdForSource } from '@pm-twin/identity'
import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import type { PlatformUser } from '@/types/domain.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import { REPOSITORY_ENTITY_KEYS } from './repository-entity-keys.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'
import {
  buildCompanyIdSet,
  projectAccountsToParties,
  partyIdLookupAliases,
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

  private writeOverrides(overrides: Overrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  private synthesizedParties(): Party[] {
    const companies = this.loadCompanies()
    const users = this.loadUsers()
    const companyIds = buildCompanyIdSet(companies.map((company) => company.id))
    return projectAccountsToParties([...companies, ...users], companyIds).map(
      (party) => ({
        ...party,
        workspaceId: workspaceIdForSource(
          party.sourceEntityId,
          party.sourceEntityType === 'company' ? 'company' : 'personal',
        ),
      }),
    )
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
    const all = this.getAll()
    const direct = all.find((party) => party.id === id)
    if (direct) return direct

    // Identity session party ids must resolve even when overrides/docs use legacy ids.
    const aliases = new Set(partyIdLookupAliases(id))
    return all.find(
      (party) =>
        aliases.has(party.id) ||
        aliases.has(party.sourceEntityId) ||
        (party.sourceEntityId != null && aliases.has(party.sourceEntityId)),
    )
  }

  create(party: Party): Party {
    const overrides = this.readOverrides()
    overrides.newParties = [...(overrides.newParties ?? []), party]
    this.writeOverrides(overrides)
    return party
  }

  updateStatus(id: string, status: string): Party | undefined {
    const overrides = this.readOverrides()
    const existing = this.getById(id)
    if (!existing) return undefined

    const updated: Party = { ...existing, status }

    const isNew = overrides.newParties?.some((party) => party.id === id)
    if (isNew) {
      overrides.newParties = overrides.newParties!.map((party) =>
        party.id === id ? updated : party,
      )
    } else {
      overrides.parties = {
        ...overrides.parties,
        [id]: {
          ...overrides.parties?.[id],
          status,
        },
      }
    }

    this.writeOverrides(overrides)
    return updated
  }
}
