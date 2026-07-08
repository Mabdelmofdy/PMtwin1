import type {
  ImplementedPartyType,
  Party,
  PartyMembership,
  SourceEntityAccount,
  SourceEntityType,
} from '../types.ts'
import {
  resolvePartyTypeFromSourceEntity,
  resolveSourceEntityType,
} from './party-type.ts'

export function partyFromSourceEntity(
  account: SourceEntityAccount,
  sourceEntityType: SourceEntityType,
): Party {
  const partyType = resolvePartyTypeFromSourceEntity(sourceEntityType)
  const displayName =
    account.profile?.name?.trim()
    || account.email?.trim()
    || account.id

  return {
    id: account.id,
    partyType,
    displayName,
    status: account.status ?? 'active',
    sourceEntityId: account.id,
    sourceEntityType,
    primaryContactId: sourceEntityType === 'individual' ? account.id : undefined,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

export function partyFromAccount(
  account: SourceEntityAccount,
  isCompanyAccount: boolean,
): Party {
  const sourceEntityType = resolveSourceEntityType(isCompanyAccount)
  return partyFromSourceEntity(account, sourceEntityType)
}

export function synthesizePrimaryMembership(
  userId: string,
  partyId: string,
  membershipRole: PartyMembership['membershipRole'] = 'owner',
): PartyMembership {
  return {
    userId,
    partyId,
    membershipRole,
    status: 'active',
    isPrimary: true,
    joinedAt: new Date().toISOString(),
  }
}

export function resolvePartyTypeFromAccount(
  account: SourceEntityAccount,
  companyIds: ReadonlySet<string>,
): ImplementedPartyType {
  return companyIds.has(account.id) ? 'company' : 'individual'
}
