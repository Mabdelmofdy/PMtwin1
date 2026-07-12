import {
  projectIdentityFromLegacyAccounts,
  resolveLegacyRoleToPlatformRoles,
  type WorkspaceMembership,
  type WorkspaceMembershipStatus,
} from '@pm-twin/identity'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import type { PlatformUser } from '@/types/domain.ts'
import {
  OVERRIDES_KEY,
  type IStorageAdapter,
  type Overrides,
} from '@/types/storage.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'
import type { PlatformUserPredicate } from './workspace-repository.ts'

const defaultPlatformUserPredicate: PlatformUserPredicate = (user) =>
  resolveLegacyRoleToPlatformRoles(user.role).length > 0

function uniqueById<T extends { readonly id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()]
}

export class WorkspaceMembershipRepository {
  private readonly storage: IStorageAdapter
  private readonly loadUsers: () => PlatformUser[]
  private readonly loadCompanies: () => PlatformUser[]
  private readonly isPlatformUser: PlatformUserPredicate
  private readonly loadProjectedMemberships?: () => readonly WorkspaceMembership[]

  constructor(
    storage: IStorageAdapter,
    loadUsers: () => PlatformUser[],
    loadCompanies: () => PlatformUser[],
    isPlatformUser: PlatformUserPredicate = defaultPlatformUserPredicate,
    loadProjectedMemberships?: () => readonly WorkspaceMembership[],
  ) {
    this.storage = storage
    this.loadUsers = loadUsers
    this.loadCompanies = loadCompanies
    this.isPlatformUser = isPlatformUser
    this.loadProjectedMemberships = loadProjectedMemberships
  }

  private readOverrides(): Overrides {
    return this.storage.get<Overrides>(OVERRIDES_KEY) ?? {}
  }

  private writeOverrides(overrides: Overrides): void {
    this.storage.set(OVERRIDES_KEY, overrides)
    notifyDataStore()
  }

  private synthesizedMemberships(): WorkspaceMembership[] {
    if (this.loadProjectedMemberships) {
      return [...this.loadProjectedMemberships()]
    }
    const users = this.loadUsers()
    const companies = this.loadCompanies()
    const companyIds = new Set(companies.map((company) => company.id))
    return projectIdentityFromLegacyAccounts({
      users,
      companies,
      platformUserIds: new Set(
        users.filter(this.isPlatformUser).map((user) => user.id),
      ),
      companyOwnerLinks: users
        .filter(
          (user) => user.role === 'company_owner' && companyIds.has(user.id),
        )
        .map((user) => ({ userId: user.id, companyId: user.id })),
    }).memberships
  }

  getAll(): WorkspaceMembership[] {
    const overrides = this.readOverrides()
    return uniqueById(
      mergeSeedWithOverrides({
        seed: this.synthesizedMemberships(),
        patches: overrides.workspaceMemberships,
        newItems: overrides.newWorkspaceMemberships,
        deletedIds: overrides.deletedWorkspaceMemberships,
      }),
    )
  }

  getById(id: string): WorkspaceMembership | undefined {
    return new Map(
      this.getAll().map((membership) => [membership.id, membership]),
    ).get(id)
  }

  listMembershipsByUserId(userId: string): WorkspaceMembership[] {
    const index = new Map<string, WorkspaceMembership[]>()
    for (const membership of this.getAll()) {
      const memberships = index.get(membership.userId) ?? []
      memberships.push(membership)
      index.set(membership.userId, memberships)
    }
    return index.get(userId) ?? []
  }

  getActiveMembership(
    userId: string,
    workspaceId: string,
  ): WorkspaceMembership | undefined {
    return this.listMembershipsByUserId(userId).find(
      (membership) =>
        membership.workspaceId === workspaceId &&
        membership.status === 'active',
    )
  }

  listActiveMembersByWorkspaceId(
    workspaceId: string,
  ): WorkspaceMembership[] {
    return this.getAll().filter(
      (membership) =>
        membership.workspaceId === workspaceId &&
        membership.status === 'active',
    )
  }

  create(membership: WorkspaceMembership): WorkspaceMembership {
    const overrides = this.readOverrides()
    overrides.newWorkspaceMemberships = [
      ...(overrides.newWorkspaceMemberships ?? []).filter(
        (existing) => existing.id !== membership.id,
      ),
      membership,
    ]
    overrides.deletedWorkspaceMemberships = (
      overrides.deletedWorkspaceMemberships ?? []
    ).filter((id) => id !== membership.id)
    this.writeOverrides(overrides)
    return membership
  }

  updateStatus(
    id: string,
    status: WorkspaceMembershipStatus,
  ): WorkspaceMembership | undefined {
    const existing = this.getById(id)
    if (!existing) return undefined
    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    }
    const overrides = this.readOverrides()
    const isNew = overrides.newWorkspaceMemberships?.some(
      (membership) => membership.id === id,
    )
    if (isNew) {
      overrides.newWorkspaceMemberships =
        overrides.newWorkspaceMemberships!.map((membership) =>
          membership.id === id ? updated : membership,
        )
    } else {
      overrides.workspaceMemberships = {
        ...overrides.workspaceMemberships,
        [id]: {
          ...overrides.workspaceMemberships?.[id],
          status,
          updatedAt: updated.updatedAt,
        },
      }
    }
    this.writeOverrides(overrides)
    return updated
  }
}
