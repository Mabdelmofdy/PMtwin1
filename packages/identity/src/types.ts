export type UserStatus = 'active' | 'pending_vetting' | 'suspended' | 'archived' | string

export type PlatformRole =
  | 'platform_admin'
  | 'admin'
  | 'moderator'
  | 'auditor'
  | 'support'

export type BusinessWorkspaceType = 'personal' | 'company'

/**
 * UI/runtime compatibility only. Never treat as a Marketplace ownership Workspace.
 * Prefer PlatformAccessContext for domain logic.
 */
export type UiWorkspaceType = BusinessWorkspaceType | 'platform'

export type WorkspaceStatus = 'active' | 'suspended' | 'archived'

export type WorkspaceRole =
  | 'workspace_owner'
  | 'company_admin'
  | 'manager'
  | 'commercial_manager'
  | 'project_manager'
  | 'legal'
  | 'finance'
  | 'member'
  | 'viewer'

export type WorkspaceMembershipStatus =
  | 'invited'
  | 'active'
  | 'suspended'
  | 'removed'

export type WorkspaceCapability =
  | 'opportunity.create'
  | 'opportunity.edit'
  | 'opportunity.publish'
  | 'match.respond'
  | 'negotiation.manage'
  | 'agreement.approve'
  | 'agreement.award'
  | 'contract.prepare'
  | 'contract.sign'
  | 'workspace.members.manage'
  | 'workspace.settings.manage'

export type ActorType = 'marketplace_user' | 'platform_operator' | 'system'

export type PartyType = 'individual' | 'company'

export type PartyStatus = 'active' | 'pending' | 'suspended' | 'archived' | string

export type IdentityUser = {
  readonly id: string
  readonly email: string
  readonly fullName: string
  readonly status: UserStatus
  readonly platformRoles?: readonly PlatformRole[]
  /** Read-only compatibility during staged migration. */
  readonly legacyRole?: string
}

export type BusinessWorkspace = {
  readonly id: string
  readonly type: BusinessWorkspaceType
  readonly name: string
  /** Primary marketplace party for this workspace — required for business workspaces. */
  readonly ownerPartyId: string
  readonly status: WorkspaceStatus
  readonly createdByUserId: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type PlatformAccessContext = {
  readonly userId: string
  readonly platformRoles: readonly PlatformRole[]
}

export type WorkspaceMembership = {
  readonly id: string
  readonly workspaceId: string
  readonly userId: string
  readonly role: WorkspaceRole
  readonly status: WorkspaceMembershipStatus
  readonly invitedByUserId?: string
  readonly joinedAt?: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type IndividualParty = {
  readonly id: string
  readonly type: 'individual'
  readonly workspaceId: string
  readonly displayName: string
  readonly status: PartyStatus
  readonly individualProfileId: string
  readonly createdByUserId: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type CompanyParty = {
  readonly id: string
  readonly type: 'company'
  readonly workspaceId: string
  readonly displayName: string
  readonly status: PartyStatus
  readonly companyProfileId: string
  readonly createdByUserId: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type MarketplaceParty = IndividualParty | CompanyParty

export type CreatedByActor = {
  readonly actorType: ActorType
  readonly actorUserId?: string
}

export type CanonicalSingleOwnerFields = {
  readonly workspaceId: string
  readonly ownerPartyId: string
  readonly createdByActor: CreatedByActor
  readonly lastModifiedByUserId?: string
  /** @deprecated Dual-read compat — prefer createdByActor.actorUserId */
  readonly createdByUserId?: string
  /** @deprecated Dual-read compat — prefer createdByActor / createdByUserId */
  readonly creatorId?: string
}

export type BusinessParticipant = {
  readonly partyId: string
  readonly workspaceId: string
  readonly role: string
  readonly representativeUserIds?: readonly string[]
}

export type CanonicalMultiPartyFields = {
  readonly participants: readonly BusinessParticipant[]
  readonly initiatingPartyId?: string
  readonly originatingOwnerPartyId?: string
  readonly createdByActor: CreatedByActor
  readonly lastModifiedByUserId?: string
}

export type WorkflowActorContext = {
  readonly actorUserId: string
  readonly actorType: ActorType
  readonly workspaceId?: string
  readonly partyId?: string
  readonly workspaceRole?: WorkspaceRole
  readonly platformRoles?: readonly PlatformRole[]
  readonly capabilities?: readonly WorkspaceCapability[]
}

export type AuditActor = {
  readonly actorUserId: string
  readonly actorType: ActorType
  readonly platformRole?: PlatformRole
  readonly workspaceId?: string
  readonly partyId?: string
  readonly workspaceRole?: WorkspaceRole
}

export type AuthIdentityContext = {
  readonly user: IdentityUser
  readonly platformRoles: readonly PlatformRole[]
  readonly memberships: readonly WorkspaceMembership[]
  readonly activeWorkspaceId?: string
  readonly activeWorkspace?: BusinessWorkspace
  readonly activePartyId?: string
  readonly activeParty?: MarketplaceParty
  readonly platformAccess?: PlatformAccessContext
}

export type OwnershipIntegrityIssue = {
  readonly code: string
  readonly message: string
  readonly entityId?: string
  readonly path?: string
}
