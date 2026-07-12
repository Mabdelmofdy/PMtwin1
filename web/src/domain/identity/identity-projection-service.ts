import {
  projectIdentityFromLegacyAccounts,
  resolveLegacyRoleToPlatformRoles,
  type IdentityProjectionResult,
  type WorkspaceRole,
} from '@pm-twin/identity'
import type { Party, PartyMembership } from '@pm-twin/party'
import type { PlatformUser } from '@/types/domain.ts'
import {
  OVERRIDES_KEY,
  type IStorageAdapter,
  type Overrides,
} from '@/types/storage.ts'
import { withCurrentIdentitySchemaMeta } from './schema-meta.ts'

export type AccountRepository = {
  getAll(): PlatformUser[]
}

export type LegacyPartyProjectionSource = {
  readonly parties?: readonly Party[]
  readonly memberships?: readonly PartyMembership[]
}

function companyOwnerLinks(
  users: readonly PlatformUser[],
  companies: readonly PlatformUser[],
  legacy: LegacyPartyProjectionSource,
): Array<{ userId: string; companyId: string; role?: WorkspaceRole }> {
  const companyIds = new Set(companies.map((company) => company.id))
  const companyIdByPartyId = new Map<string, string>()
  for (const party of legacy.parties ?? []) {
    if (
      party.sourceEntityType === 'company' &&
      companyIds.has(party.sourceEntityId)
    ) {
      companyIdByPartyId.set(party.id, party.sourceEntityId)
    }
  }

  const links = new Map<string, { userId: string; companyId: string; role?: WorkspaceRole }>()
  for (const membership of legacy.memberships ?? []) {
    const companyId =
      companyIdByPartyId.get(membership.partyId) ??
      (companyIds.has(membership.partyId) ? membership.partyId : undefined)
    if (!companyId || membership.status !== 'active') continue
    const link = {
      userId: membership.userId,
      companyId,
      role: membership.membershipRole === 'owner'
        ? 'workspace_owner' as const
        : 'member' as const,
    }
    links.set(`${link.userId}::${link.companyId}`, link)
  }

  for (const user of users) {
    if (user.role !== 'company_owner' || !companyIds.has(user.id)) continue
    const link = {
      userId: user.id,
      companyId: user.id,
      role: 'workspace_owner' as const,
    }
    links.set(`${link.userId}::${link.companyId}`, link)
  }
  return [...links.values()]
}

export function buildIdentityProjection(
  userRepository: AccountRepository,
  companyRepository: AccountRepository,
  legacy: LegacyPartyProjectionSource = {},
): IdentityProjectionResult {
  const users = userRepository.getAll()
  const companies = companyRepository.getAll()
  const platformUserIds = new Set(
    users
      .filter((user) => resolveLegacyRoleToPlatformRoles(user.role).length > 0)
      .map((user) => user.id),
  )

  return projectIdentityFromLegacyAccounts({
    users,
    companies,
    platformUserIds,
    companyOwnerLinks: companyOwnerLinks(users, companies, legacy),
  })
}

export class IdentityProjectionService {
  private readonly userRepository: AccountRepository
  private readonly companyRepository: AccountRepository
  private readonly legacy: LegacyPartyProjectionSource

  constructor(
    userRepository: AccountRepository,
    companyRepository: AccountRepository,
    legacy: LegacyPartyProjectionSource = {},
  ) {
    this.userRepository = userRepository
    this.companyRepository = companyRepository
    this.legacy = legacy
  }

  build(): IdentityProjectionResult {
    return buildIdentityProjection(
      this.userRepository,
      this.companyRepository,
      this.legacy,
    )
  }
}

export function ensureIdentityProjection(
  storage: IStorageAdapter,
  userRepository: AccountRepository,
  companyRepository: AccountRepository,
  legacy: LegacyPartyProjectionSource = {},
): IdentityProjectionResult {
  const projection = buildIdentityProjection(
    userRepository,
    companyRepository,
    legacy,
  )
  const current = storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  const shouldWriteWorkspaces =
    current.workspaces === undefined && current.newWorkspaces === undefined
  const shouldWriteMemberships =
    current.workspaceMemberships === undefined &&
    current.newWorkspaceMemberships === undefined

  if (
    shouldWriteWorkspaces ||
    shouldWriteMemberships ||
    current.identitySchemaVersion === undefined ||
    current.ownershipSchemaVersion === undefined
  ) {
    const next = withCurrentIdentitySchemaMeta({
      ...current,
      ...(shouldWriteWorkspaces
        ? { newWorkspaces: projection.workspaces }
        : {}),
      ...(shouldWriteMemberships
        ? { newWorkspaceMemberships: projection.memberships }
        : {}),
    })
    storage.set(OVERRIDES_KEY, next)
  }

  return projection
}
