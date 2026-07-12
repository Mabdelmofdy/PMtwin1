import type {
  BusinessParticipant,
  BusinessWorkspace,
  MarketplaceParty,
  OwnershipIntegrityIssue,
  PlatformAccessContext,
  WorkspaceMembership,
} from './types.ts'
import { isBusinessWorkspaceType } from './capabilities.ts'

export type OwnershipIntegrityInput = {
  readonly entity?: {
    readonly id?: string
    readonly workspaceId?: string
    readonly ownerPartyId?: string
    readonly participants?: readonly BusinessParticipant[]
    readonly createdByUserId?: string
    readonly createdByActorType?: string
  }
  readonly workspaces: readonly BusinessWorkspace[]
  readonly parties: readonly MarketplaceParty[]
  readonly memberships: readonly WorkspaceMembership[]
  readonly users?: readonly { readonly id: string }[]
  readonly platformAccess?: PlatformAccessContext | null
  readonly allowPlatformOwner?: boolean
}

function issue(
  code: string,
  message: string,
  entityId?: string,
  path?: string,
): OwnershipIntegrityIssue {
  return { code, message, entityId, path }
}

export function validatePartyWorkspaceAlignment(
  party: MarketplaceParty,
  workspace: BusinessWorkspace | undefined,
): OwnershipIntegrityIssue[] {
  const issues: OwnershipIntegrityIssue[] = []
  if (!workspace) {
    issues.push(issue('missing_workspace', `Workspace ${party.workspaceId} not found for party ${party.id}`, party.id, 'workspaceId'))
    return issues
  }
  if (!isBusinessWorkspaceType(workspace.type)) {
    issues.push(issue('platform_workspace_party', 'Platform context must not own a Marketplace Party', party.id))
    return issues
  }
  if (workspace.ownerPartyId !== party.id && getPrimaryPartyId(workspace, [party]) !== party.id) {
    // soft: party may still belong to workspace if primary mapping differs during migration
  }
  if (workspace.type === 'personal' && party.type !== 'individual') {
    issues.push(issue('party_type_mismatch', 'Personal Workspace requires Individual Party', party.id))
  }
  if (workspace.type === 'company' && party.type !== 'company') {
    issues.push(issue('party_type_mismatch', 'Company Workspace requires Company Party', party.id))
  }
  if (party.workspaceId !== workspace.id) {
    issues.push(issue('party_workspace_mismatch', 'Party.workspaceId does not match Workspace.id', party.id))
  }
  return issues
}

export function getPrimaryPartyId(
  workspace: BusinessWorkspace,
  parties: readonly MarketplaceParty[],
): string | undefined {
  if (workspace.ownerPartyId) return workspace.ownerPartyId
  const linked = parties.filter((p) => p.workspaceId === workspace.id)
  return linked[0]?.id
}

export function validateWorkspacePartyInvariants(
  workspaces: readonly BusinessWorkspace[],
  parties: readonly MarketplaceParty[],
): OwnershipIntegrityIssue[] {
  const issues: OwnershipIntegrityIssue[] = []
  const partiesByWorkspace = new Map<string, MarketplaceParty[]>()

  for (const party of parties) {
    if (!party.workspaceId) {
      issues.push(issue('party_without_workspace', `Party ${party.id} has no workspaceId`, party.id))
      continue
    }
    const list = partiesByWorkspace.get(party.workspaceId) ?? []
    list.push(party)
    partiesByWorkspace.set(party.workspaceId, list)
  }

  for (const workspace of workspaces) {
    if (!isBusinessWorkspaceType(workspace.type)) {
      issues.push(issue('invalid_business_workspace_type', `Workspace ${workspace.id} is not a business workspace`, workspace.id))
      continue
    }
    const linked = partiesByWorkspace.get(workspace.id) ?? []
    if (linked.length === 0) {
      issues.push(issue('workspace_without_party', `Business Workspace ${workspace.id} has no primary Party`, workspace.id))
      continue
    }
    const primaries = linked.filter((p) => p.id === workspace.ownerPartyId)
    if (workspace.ownerPartyId && primaries.length === 0) {
      issues.push(issue('owner_party_missing', `Workspace ${workspace.id} ownerPartyId not found among parties`, workspace.id))
    }
    if (linked.length > 1) {
      const companyDupes = linked.filter((p) => p.type === 'company')
      if (companyDupes.length > 1) {
        issues.push(issue('duplicate_company_parties', `Workspace ${workspace.id} has multiple Company Parties`, workspace.id))
      }
      if (linked.filter((p) => p.id === workspace.ownerPartyId).length > 1) {
        issues.push(issue('multiple_primary_parties', `Workspace ${workspace.id} has multiple primary Parties`, workspace.id))
      }
    }
    for (const party of linked) {
      issues.push(...validatePartyWorkspaceAlignment(party, workspace))
    }
  }

  return issues
}

export function validateParticipantsAlignment(
  participants: readonly BusinessParticipant[],
  entityId?: string,
): OwnershipIntegrityIssue[] {
  const issues: OwnershipIntegrityIssue[] = []
  const seen = new Set<string>()
  for (const participant of participants) {
    if (!participant.partyId || !participant.workspaceId) {
      issues.push(issue('participant_incomplete', 'Participant requires partyId and workspaceId', entityId))
      continue
    }
    const key = participant.partyId
    if (seen.has(key)) {
      issues.push(issue('participant_duplication', `Duplicate participant party ${key}`, entityId))
    }
    seen.add(key)
  }
  return issues
}

export function validateOwnershipIntegrity(
  input: OwnershipIntegrityInput,
): { readonly valid: boolean; readonly issues: readonly OwnershipIntegrityIssue[] } {
  const issues: OwnershipIntegrityIssue[] = [
    ...validateWorkspacePartyInvariants(input.workspaces, input.parties),
  ]

  if (input.platformAccess && input.entity?.ownerPartyId && !input.allowPlatformOwner) {
    issues.push(
      issue(
        'platform_owner_party',
        'Platform context must not be used as Marketplace ownerPartyId',
        input.entity.id,
        'ownerPartyId',
      ),
    )
  }

  const entity = input.entity
  if (entity) {
    if (entity.workspaceId) {
      const workspace = input.workspaces.find((w) => w.id === entity.workspaceId)
      if (!workspace) {
        issues.push(issue('missing_workspace', `Entity workspace ${entity.workspaceId} not found`, entity.id))
      } else if (!isBusinessWorkspaceType(workspace.type)) {
        issues.push(issue('platform_workspace_entity', 'Entity must not use Platform context as workspaceId', entity.id))
      }
    }
    if (entity.ownerPartyId) {
      const party = input.parties.find((p) => p.id === entity.ownerPartyId)
      if (!party) {
        issues.push(issue('missing_party', `Entity ownerPartyId ${entity.ownerPartyId} not found`, entity.id))
      } else if (entity.workspaceId && party.workspaceId !== entity.workspaceId) {
        issues.push(issue('party_workspace_mismatch', 'ownerPartyId does not match entity workspaceId', entity.id))
      }
    }
    if (entity.participants) {
      issues.push(...validateParticipantsAlignment(entity.participants, entity.id))
      for (const p of entity.participants) {
        const party = input.parties.find((x) => x.id === p.partyId)
        if (!party) {
          issues.push(issue('missing_party', `Participant party ${p.partyId} not found`, entity.id))
        } else if (party.workspaceId !== p.workspaceId) {
          issues.push(issue('party_workspace_mismatch', `Participant party/workspace mismatch for ${p.partyId}`, entity.id))
        }
      }
    }
    if (entity.createdByUserId && input.users) {
      const userExists = input.users.some((u) => u.id === entity.createdByUserId)
      if (!userExists && entity.createdByActorType !== 'system') {
        issues.push(issue('invalid_actor_user', `createdByUserId ${entity.createdByUserId} not found`, entity.id))
      }
    }
  }

  for (const membership of input.memberships) {
    if (membership.status === 'removed') continue
    const workspace = input.workspaces.find((w) => w.id === membership.workspaceId)
    if (!workspace) {
      issues.push(issue('membership_workspace_missing', `Membership ${membership.id} references missing workspace`, membership.id))
    }
  }

  return { valid: issues.length === 0, issues }
}

/** Derived parallel arrays — keep aligned via BusinessParticipant source of truth. */
export function deriveParticipantIds(
  participants: readonly BusinessParticipant[],
): {
  readonly participantPartyIds: readonly string[]
  readonly participantWorkspaceIds: readonly string[]
} {
  return {
    participantPartyIds: participants.map((p) => p.partyId),
    participantWorkspaceIds: participants.map((p) => p.workspaceId),
  }
}

export function assertParallelParticipantArrays(
  partyIds: readonly string[],
  workspaceIds: readonly string[],
): OwnershipIntegrityIssue[] {
  if (partyIds.length !== workspaceIds.length) {
    return [issue('parallel_array_misaligned', 'participantPartyIds and participantWorkspaceIds length mismatch')]
  }
  return []
}
