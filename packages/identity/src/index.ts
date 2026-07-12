export type {
  ActorType,
  AuditActor,
  AuthIdentityContext,
  BusinessParticipant,
  BusinessWorkspace,
  BusinessWorkspaceType,
  CanonicalMultiPartyFields,
  CanonicalSingleOwnerFields,
  CompanyParty,
  CreatedByActor,
  IdentityUser,
  IndividualParty,
  MarketplaceParty,
  OwnershipIntegrityIssue,
  PartyStatus,
  PartyType,
  PlatformAccessContext,
  PlatformRole,
  UiWorkspaceType,
  UserStatus,
  WorkflowActorContext,
  WorkspaceCapability,
  WorkspaceMembership,
  WorkspaceMembershipStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from './types.ts'

export {
  hasWorkspaceCapability,
  isBusinessWorkspaceType,
  isPlatformRole,
  resolveLegacyRoleToPlatformRoles,
  resolveLegacyRoleToWorkspaceMembership,
  resolveWorkspaceCapabilities,
} from './capabilities.ts'

export {
  assertParallelParticipantArrays,
  deriveParticipantIds,
  getPrimaryPartyId,
  validateOwnershipIntegrity,
  validateParticipantsAlignment,
  validatePartyWorkspaceAlignment,
  validateWorkspacePartyInvariants,
} from './ownership-integrity.ts'

export type { OwnershipIntegrityInput } from './ownership-integrity.ts'

export {
  buildWorkflowActorContext,
  canAccessWorkspaceEntity,
  createdByActorFromHuman,
  createdByActorSystem,
  entityBelongsToOwnerParty,
  membershipIdFor,
  partyIdForSource,
  recoverActiveBusinessContext,
  resolveCreatedByActor,
  SYSTEM_MIGRATION_USER_ID,
  workspaceIdForSource,
} from './resolvers.ts'

export type { ActiveContextRecovery } from './resolvers.ts'

export {
  mergeIdentityProjections,
  projectIdentityFromLegacyAccounts,
  resolveLegacyOpportunityOwnership,
} from './migration.ts'

export type {
  IdentityProjectionResult,
  LegacyAccountSeed,
} from './migration.ts'

export {
  assertImportSchemaVersions,
  createCurrentSchemaMeta,
  IDENTITY_SCHEMA_VERSION,
  isSupportedIdentitySchemaVersion,
  isSupportedOwnershipSchemaVersion,
  LEGACY_IDENTITY_SCHEMA_VERSION,
  LEGACY_OWNERSHIP_SCHEMA_VERSION,
  OWNERSHIP_SCHEMA_VERSION,
} from './schema-version.ts'

export type { IdentityOwnershipSchemaMeta } from './schema-version.ts'
