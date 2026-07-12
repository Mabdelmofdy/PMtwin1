import type { ImplementedPartyType } from '@pm-twin/party'
import {
  membershipIdFor,
  partyIdForSource,
  workspaceIdForSource,
  type BusinessWorkspace,
  type WorkspaceMembership,
} from '@pm-twin/identity'
import { authService } from '@/lib/auth-service.ts'
import type { RegistrationRequest } from '@/lib/registration-service.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import {
  companyRepository,
  partyMembershipRepository,
  partyRepository,
  userRepository,
  workspaceMembershipRepository,
  workspaceRepository,
} from '@/repositories/index.ts'
import type { CompanyRepository } from '@/repositories/company-repository.ts'
import type { PartyMembershipRepository } from '@/repositories/party-membership-repository.ts'
import type { PartyRepository } from '@/repositories/party-repository.ts'
import type { UserRepository } from '@/repositories/user-repository.ts'
import type { WorkspaceRepository } from '@/repositories/workspace-repository.ts'
import type { WorkspaceMembershipRepository } from '@/repositories/workspace-membership-repository.ts'
import {
  OVERRIDES_KEY,
  type IStorageAdapter,
  type Overrides,
} from '@/types/storage.ts'

export type LocalRegistrationResult = {
  userId: string
  workspaceId: string
  partyId: string
  membershipId: string
  partyType: ImplementedPartyType
}

export type LocalRegistrationDeps = {
  userRepository: UserRepository
  companyRepository: CompanyRepository
  partyRepository: PartyRepository
  partyMembershipRepository: PartyMembershipRepository
  workspaceRepository: WorkspaceRepository
  workspaceMembershipRepository: WorkspaceMembershipRepository
  storageAdapter: IStorageAdapter
}

const defaultDeps: LocalRegistrationDeps = {
  userRepository,
  companyRepository,
  partyRepository,
  partyMembershipRepository,
  workspaceRepository,
  workspaceMembershipRepository,
  storageAdapter: environmentContext.storageAdapter ?? localStorageAdapter,
}

function createLocalUserId(): string {
  return `local-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createLocalCompanyId(): string {
  return `local-co-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function registerLocalAccount(
  request: RegistrationRequest,
  deps: LocalRegistrationDeps = defaultDeps,
): LocalRegistrationResult {
  const existingOverrides = deps.storageAdapter.get<Overrides>(OVERRIDES_KEY)
  const previousOverrides = existingOverrides
    ? structuredClone(existingOverrides)
    : null
  const passwordHash = authService.encodePassword(request.password)
  const userId = createLocalUserId()
  const sourceId =
    request.accountType === 'company' ? createLocalCompanyId() : userId
  const workspaceType =
    request.accountType === 'company' ? 'company' as const : 'personal' as const
  const partyType =
    request.accountType === 'company' ? 'company' as const : 'individual' as const
  const workspaceId = workspaceIdForSource(sourceId, workspaceType)
  const partyId = partyIdForSource(sourceId, partyType)
  const membershipId = membershipIdFor(userId, workspaceId)
  const now = new Date().toISOString()

  try {
    deps.userRepository.create({
      id: userId,
      email: request.email,
      passwordHash,
      role: 'user',
      status: 'pending_vetting',
      profile: {
        accountLabel:
          request.profile.contactPerson?.trim() || request.profile.displayName,
        profileCompletionUnlocked: false,
      },
    })

    if (request.accountType === 'company') {
      deps.companyRepository.create({
        id: sourceId,
        email: `${sourceId}@internal.pmtwin`,
        role: 'user',
        status: 'pending_vetting',
        profile: {
          accountLabel: request.profile.displayName,
          profileCompletionUnlocked: false,
          type: 'company',
        },
      })
    }

    deps.partyRepository.create({
      id: partyId,
      partyType,
      displayName: request.profile.displayName,
      status: 'pending_vetting',
      sourceEntityId: sourceId,
      sourceEntityType: partyType,
      primaryContactId: userId,
      workspaceId,
      createdByUserId: userId,
      ...(partyType === 'company'
        ? { companyProfileId: sourceId }
        : { individualProfileId: sourceId }),
      createdAt: now,
      updatedAt: now,
    })

    const workspace: BusinessWorkspace = {
      id: workspaceId,
      type: workspaceType,
      name:
        workspaceType === 'company'
          ? request.profile.displayName
          : `${request.profile.displayName}'s Workspace`,
      ownerPartyId: partyId,
      status: 'active',
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    }
    deps.workspaceRepository.create(workspace)

    const membership: WorkspaceMembership = {
      id: membershipId,
      workspaceId,
      userId,
      role: 'workspace_owner',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    deps.workspaceMembershipRepository.create(membership)
    // Suppress legacy synthesized partyId===userId membership so the canonical
    // Workspace Party membership is the only primary.
    deps.partyMembershipRepository.suppressSynthesizedMembership(userId, userId)
    deps.partyMembershipRepository.setPrimaryMembership(userId, partyId, 'owner')

    return {
      userId,
      workspaceId,
      partyId,
      membershipId,
      partyType,
    }
  } catch (error) {
    if (previousOverrides) {
      deps.storageAdapter.set(OVERRIDES_KEY, previousOverrides)
    } else {
      deps.storageAdapter.remove(OVERRIDES_KEY)
    }
    notifyDataStore()
    throw error
  }
}
