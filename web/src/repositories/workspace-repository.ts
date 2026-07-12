import {
  projectIdentityFromLegacyAccounts,
  resolveLegacyRoleToPlatformRoles,
  type BusinessWorkspace,
  type MarketplaceParty,
} from '@pm-twin/identity'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import type { PlatformUser } from '@/types/domain.ts'
import {
  OVERRIDES_KEY,
  type IStorageAdapter,
  type Overrides,
} from '@/types/storage.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

export type PlatformUserPredicate = (user: PlatformUser) => boolean

const defaultPlatformUserPredicate: PlatformUserPredicate = (user) =>
  resolveLegacyRoleToPlatformRoles(user.role).length > 0

function uniqueById<T extends { readonly id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()]
}

export class WorkspaceRepository {
  private readonly storage: IStorageAdapter
  private readonly loadUsers: () => PlatformUser[]
  private readonly loadCompanies: () => PlatformUser[]
  private readonly isPlatformUser: PlatformUserPredicate
  private readonly loadParties?: () => readonly MarketplaceParty[]

  constructor(
    storage: IStorageAdapter,
    loadUsers: () => PlatformUser[],
    loadCompanies: () => PlatformUser[],
    isPlatformUser: PlatformUserPredicate = defaultPlatformUserPredicate,
    loadParties?: () => readonly MarketplaceParty[],
  ) {
    this.storage = storage
    this.loadUsers = loadUsers
    this.loadCompanies = loadCompanies
    this.isPlatformUser = isPlatformUser
    this.loadParties = loadParties
  }

  private readOverrides(): Overrides {
    return this.storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  }

  private writeOverrides(overrides: Overrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  private projection() {
    const users = this.loadUsers()
    return projectIdentityFromLegacyAccounts({
      users,
      companies: this.loadCompanies(),
      platformUserIds: new Set(
        users.filter(this.isPlatformUser).map((user) => user.id),
      ),
    })
  }

  getAll(): BusinessWorkspace[] {
    const overrides = this.readOverrides()
    return uniqueById(
      mergeSeedWithOverrides({
        seed: this.projection().workspaces,
        patches: overrides.workspaces,
        newItems: overrides.newWorkspaces,
        deletedIds: overrides.deletedWorkspaces,
      }),
    )
  }

  getById(id: string): BusinessWorkspace | undefined {
    return new Map(this.getAll().map((workspace) => [workspace.id, workspace])).get(id)
  }

  getPrimaryPartyByWorkspaceId(
    workspaceId: string,
  ): MarketplaceParty | undefined {
    const workspace = this.getById(workspaceId)
    if (!workspace) return undefined
    const parties = this.loadParties?.() ?? this.projection().parties
    return new Map(parties.map((party) => [party.id, party])).get(
      workspace.ownerPartyId,
    )
  }

  getByOwnerPartyId(ownerPartyId: string): BusinessWorkspace | undefined {
    return new Map(
      this.getAll().map((workspace) => [workspace.ownerPartyId, workspace]),
    ).get(ownerPartyId)
  }

  listByOwnerPartyId(ownerPartyId: string): BusinessWorkspace[] {
    return this.getAll().filter(
      (workspace) => workspace.ownerPartyId === ownerPartyId,
    )
  }

  create(workspace: BusinessWorkspace): BusinessWorkspace {
    const overrides = this.readOverrides()
    overrides.newWorkspaces = [
      ...(overrides.newWorkspaces ?? []).filter(
        (existing) => existing.id !== workspace.id,
      ),
      workspace,
    ]
    overrides.deletedWorkspaces = (overrides.deletedWorkspaces ?? []).filter(
      (id) => id !== workspace.id,
    )
    this.writeOverrides(overrides)
    return workspace
  }
}
