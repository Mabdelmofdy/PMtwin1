import type { PlatformUser } from '@/types/domain.ts'
import {
  partyFromAccount,
  resolvePartyTypeFromAccount,
  synthesizePrimaryMembership,
  type Party,
  type PartyMembership,
  type SourceEntityAccount,
} from '@pm-twin/party'

export function toSourceEntityAccount(user: PlatformUser): SourceEntityAccount {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile,
  }
}

export function projectAccountToParty(
  account: PlatformUser,
  companyIds: ReadonlySet<string>,
): Party {
  const isCompany = companyIds.has(account.id)
  return partyFromAccount(toSourceEntityAccount(account), isCompany)
}

export function projectAccountsToParties(
  accounts: readonly PlatformUser[],
  companyIds: ReadonlySet<string>,
): Party[] {
  return accounts.map((account) => projectAccountToParty(account, companyIds))
}

export function projectPrimaryMembership(
  account: PlatformUser,
  companyIds: ReadonlySet<string>,
): PartyMembership {
  const partyType = resolvePartyTypeFromAccount(toSourceEntityAccount(account), companyIds)
  const membershipRole = partyType === 'company' ? 'owner' : 'owner'
  return synthesizePrimaryMembership(account.id, account.id, membershipRole)
}

export function buildCompanyIdSet(companyIds: readonly string[]): ReadonlySet<string> {
  return new Set(companyIds)
}
