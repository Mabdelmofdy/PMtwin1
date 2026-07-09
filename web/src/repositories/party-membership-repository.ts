import type { PartyMembership } from '@pm-twin/party'
import { synthesizePrimaryMembership } from '@pm-twin/party'
import type { IStorageAdapter, Overrides } from '@/types/storage.ts'
import type { PlatformUser } from '@/types/domain.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import {
  buildCompanyIdSet,
  projectPrimaryMembership,
} from '@/domain/party/party-projection.ts'

export function formatMembershipId(
  membership: Pick<PartyMembership, 'userId' | 'partyId'>,
): string {
  return `${membership.userId}::${membership.partyId}`
}

export class PartyMembershipRepository {
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

  private synthesizedMemberships(): PartyMembership[] {
    const companies = this.loadCompanies()
    const users = this.loadUsers()
    const companyIds = buildCompanyIdSet(companies.map((company) => company.id))
    return [...companies, ...users].map((account) =>
      projectPrimaryMembership(account, companyIds),
    )
  }

  getAll(): PartyMembership[] {
    const overrides = this.readOverrides()
    const synthesized = this.synthesizedMemberships()
    const deleted = new Set(overrides.deletedPartyMemberships ?? [])
    const membershipKey = (membership: PartyMembership) =>
      `${membership.userId}::${membership.partyId}`

    const merged = synthesized.filter(
      (membership) => !deleted.has(membershipKey(membership)),
    )

    for (const membership of overrides.newPartyMemberships ?? []) {
      merged.push(membership)
    }

    return merged
  }

  listForUser(userId: string): PartyMembership[] {
    return this.getAll().filter((membership) => membership.userId === userId)
  }

  getPrimaryForUser(userId: string): PartyMembership | undefined {
    return this.listForUser(userId).find((membership) => membership.isPrimary)
  }

  setPrimaryMembership(
    userId: string,
    partyId: string,
    membershipRole: PartyMembership['membershipRole'] = 'owner',
  ): PartyMembership {
    const membership = synthesizePrimaryMembership(userId, partyId, membershipRole)
    const overrides = this.readOverrides()
    const remaining = (overrides.newPartyMemberships ?? []).filter(
      (entry) => !(entry.userId === userId && entry.partyId === partyId),
    )
    overrides.newPartyMemberships = [...remaining, membership]
    this.writeOverrides(overrides)
    return membership
  }

  suppressSynthesizedMembership(userId: string, partyId: string): void {
    const overrides = this.readOverrides()
    const deleted = new Set(overrides.deletedPartyMemberships ?? [])
    deleted.add(formatMembershipId({ userId, partyId }))
    overrides.deletedPartyMemberships = [...deleted]
    this.writeOverrides(overrides)
  }
}
