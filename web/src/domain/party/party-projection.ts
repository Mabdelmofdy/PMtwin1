import type { PlatformUser } from '@/types/domain.ts'
import { partyIdForSource } from '@pm-twin/identity'
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

/**
 * Canonical party id aligned with identity workspace.ownerPartyId
 * (`party-individual-*` / `party-company-*`).
 */
export function canonicalPartyIdForAccount(
  account: PlatformUser,
  companyIds: ReadonlySet<string>,
): string {
  const isCompany = companyIds.has(account.id)
  return partyIdForSource(account.id, isCompany ? 'company' : 'individual')
}

export function projectAccountToParty(
  account: PlatformUser,
  companyIds: ReadonlySet<string>,
): Party {
  const isCompany = companyIds.has(account.id)
  const base = partyFromAccount(toSourceEntityAccount(account), isCompany)
  return {
    ...base,
    id: partyIdForSource(account.id, isCompany ? 'company' : 'individual'),
    // Keep sourceEntityId as the account id for document/legacy lookups.
    sourceEntityId: account.id,
  }
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
  const partyId = partyIdForSource(
    account.id,
    partyType === 'company' ? 'company' : 'individual',
  )
  return synthesizePrimaryMembership(account.id, partyId, 'owner')
}

export function buildCompanyIdSet(companyIds: readonly string[]): ReadonlySet<string> {
  return new Set(companyIds)
}

/** Resolve identity and legacy account-id party aliases for lookups. */
export function partyIdLookupAliases(partyId: string): readonly string[] {
  const aliases = new Set<string>([partyId])
  const identityMatch = /^party-(individual|company)-(.+)$/.exec(partyId)
  if (identityMatch) {
    aliases.add(identityMatch[2])
  } else if (partyId) {
    aliases.add(partyIdForSource(partyId, 'individual'))
    aliases.add(partyIdForSource(partyId, 'company'))
  }
  return [...aliases]
}
