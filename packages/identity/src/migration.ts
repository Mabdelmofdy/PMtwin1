import type {
  BusinessWorkspace,
  BusinessWorkspaceType,
  MarketplaceParty,
  WorkspaceMembership,
  WorkspaceRole,
} from './types.ts'
import {
  membershipIdFor,
  partyIdForSource,
  workspaceIdForSource,
} from './resolvers.ts'

export type LegacyAccountSeed = {
  readonly id: string
  readonly email?: string
  readonly role?: string
  readonly status?: string
  readonly createdAt?: string
  readonly updatedAt?: string
  readonly profile?: {
    readonly name?: string
    readonly accountLabel?: string
    readonly type?: string
  }
}

export type IdentityProjectionResult = {
  readonly workspaces: BusinessWorkspace[]
  readonly parties: MarketplaceParty[]
  readonly memberships: WorkspaceMembership[]
}

function nowIso(): string {
  // Deterministic fallback so idempotent migrations and export/import
  // roundtrips do not rewrite timestamps on every projection.
  return '2020-01-01T00:00:00.000Z'
}

function displayName(account: LegacyAccountSeed): string {
  return (
    account.profile?.name?.trim() ||
    account.profile?.accountLabel?.trim() ||
    account.email ||
    account.id
  )
}

/**
 * Deterministic, idempotent projection from legacy user/company accounts.
 * Re-running with the same inputs yields identical IDs and structure.
 */
export function projectIdentityFromLegacyAccounts(input: {
  readonly users: readonly LegacyAccountSeed[]
  readonly companies: readonly LegacyAccountSeed[]
  readonly companyOwnerLinks?: readonly {
    readonly userId: string
    readonly companyId: string
    readonly role?: WorkspaceRole
  }[]
  readonly platformUserIds?: ReadonlySet<string>
}): IdentityProjectionResult {
  const workspaces: BusinessWorkspace[] = []
  const parties: MarketplaceParty[] = []
  const memberships: WorkspaceMembership[] = []
  const timestamp = nowIso()
  const platformIds = input.platformUserIds ?? new Set<string>()

  const companyIds = new Set(input.companies.map((c) => c.id))

  for (const company of input.companies) {
    const workspaceId = workspaceIdForSource(company.id, 'company')
    const partyId = partyIdForSource(company.id, 'company')
    const createdBy =
      input.companyOwnerLinks?.find((l) => l.companyId === company.id)?.userId ??
      company.id
    const name = displayName(company)

    workspaces.push({
      id: workspaceId,
      type: 'company',
      name,
      ownerPartyId: partyId,
      status: 'active',
      createdByUserId: createdBy,
      createdAt: company.createdAt ?? timestamp,
      updatedAt: company.updatedAt ?? timestamp,
    })

    parties.push({
      id: partyId,
      type: 'company',
      workspaceId,
      displayName: name,
      status: company.status ?? 'active',
      companyProfileId: company.id,
      createdByUserId: createdBy,
      createdAt: company.createdAt ?? timestamp,
      updatedAt: company.updatedAt ?? timestamp,
    })
  }

  for (const user of input.users) {
    if (platformIds.has(user.id)) continue

    const workspaceId = workspaceIdForSource(user.id, 'personal')
    const partyId = partyIdForSource(user.id, 'individual')
    const name = displayName(user)

    workspaces.push({
      id: workspaceId,
      type: 'personal',
      name: `${name} — Personal Workspace`,
      ownerPartyId: partyId,
      status: 'active',
      createdByUserId: user.id,
      createdAt: user.createdAt ?? timestamp,
      updatedAt: user.updatedAt ?? timestamp,
    })

    parties.push({
      id: partyId,
      type: 'individual',
      workspaceId,
      displayName: name,
      status: user.status ?? 'active',
      individualProfileId: user.id,
      createdByUserId: user.id,
      createdAt: user.createdAt ?? timestamp,
      updatedAt: user.updatedAt ?? timestamp,
    })

    memberships.push({
      id: membershipIdFor(user.id, workspaceId),
      workspaceId,
      userId: user.id,
      role: 'workspace_owner',
      status: 'active',
      joinedAt: user.createdAt ?? timestamp,
      createdAt: user.createdAt ?? timestamp,
      updatedAt: user.updatedAt ?? timestamp,
    })
  }

  for (const link of input.companyOwnerLinks ?? []) {
    if (!companyIds.has(link.companyId)) continue
    const workspaceId = workspaceIdForSource(link.companyId, 'company')
    memberships.push({
      id: membershipIdFor(link.userId, workspaceId),
      workspaceId,
      userId: link.userId,
      role: link.role ?? 'workspace_owner',
      status: 'active',
      joinedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  // Deduplicate by id (idempotent merge)
  return {
    workspaces: uniqueById(workspaces),
    parties: uniqueById(parties),
    memberships: uniqueById(memberships),
  }
}

function uniqueById<T extends { readonly id: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item)
  }
  return [...map.values()]
}

export function mergeIdentityProjections(
  a: IdentityProjectionResult,
  b: IdentityProjectionResult,
): IdentityProjectionResult {
  return {
    workspaces: uniqueById([...a.workspaces, ...b.workspaces]),
    parties: uniqueById([...a.parties, ...b.parties]),
    memberships: uniqueById([...a.memberships, ...b.memberships]),
  }
}

export function resolveLegacyOpportunityOwnership(input: {
  readonly creatorId?: string
  readonly ownerPartyId?: string
  readonly companyIds: ReadonlySet<string>
  readonly userIds: ReadonlySet<string>
}): {
  readonly workspaceId?: string
  readonly ownerPartyId?: string
  readonly createdByUserId?: string
  readonly workspaceType?: BusinessWorkspaceType
  readonly unresolvedActor: boolean
} {
  if (input.ownerPartyId?.startsWith('party-')) {
    const isCompany = input.ownerPartyId.includes('-company-')
    const sourceId = input.ownerPartyId.replace(/^party-(individual|company)-/, '')
    return {
      workspaceId: workspaceIdForSource(sourceId, isCompany ? 'company' : 'personal'),
      ownerPartyId: input.ownerPartyId,
      createdByUserId: input.creatorId,
      workspaceType: isCompany ? 'company' : 'personal',
      unresolvedActor: false,
    }
  }

  const creatorId = input.creatorId
  if (!creatorId) {
    return { unresolvedActor: true }
  }

  if (input.companyIds.has(creatorId)) {
    return {
      workspaceId: workspaceIdForSource(creatorId, 'company'),
      ownerPartyId: partyIdForSource(creatorId, 'company'),
      createdByUserId: undefined,
      workspaceType: 'company',
      unresolvedActor: true,
    }
  }

  if (input.userIds.has(creatorId)) {
    return {
      workspaceId: workspaceIdForSource(creatorId, 'personal'),
      ownerPartyId: partyIdForSource(creatorId, 'individual'),
      createdByUserId: creatorId,
      workspaceType: 'personal',
      unresolvedActor: false,
    }
  }

  // Treat unknown creatorId as individual party id alias (legacy partyId === account id)
  if (creatorId) {
    const asCompany = input.companyIds.has(creatorId)
    return {
      workspaceId: workspaceIdForSource(creatorId, asCompany ? 'company' : 'personal'),
      ownerPartyId: partyIdForSource(creatorId, asCompany ? 'company' : 'individual'),
      createdByUserId: asCompany ? undefined : creatorId,
      workspaceType: asCompany ? 'company' : 'personal',
      unresolvedActor: asCompany,
    }
  }

  return { unresolvedActor: true }
}
