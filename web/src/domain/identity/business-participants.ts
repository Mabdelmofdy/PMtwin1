import {
  partyIdForSource,
  workspaceIdForSource,
  type BusinessParticipant,
} from '@pm-twin/identity'
import type { Participant } from '@/types/participant.ts'

export type ParticipantActorAction = {
  readonly partyId: string
  readonly workspaceId: string
  readonly actorUserId: string
  readonly actedAt: string
}

/**
 * Dual-read: prefer canonical party/workspace fields; fall back to legacy userId
 * as both party source and representative.
 */
export function toBusinessParticipant(
  participant: Participant & {
    readonly partyId?: string
    readonly workspaceId?: string
    readonly representativeUserIds?: readonly string[]
  },
  ctx: {
    readonly companyIds: ReadonlySet<string>
    readonly userIds: ReadonlySet<string>
  },
): BusinessParticipant {
  if (participant.partyId && participant.workspaceId) {
    return {
      partyId: participant.partyId,
      workspaceId: participant.workspaceId,
      role: participant.role,
      representativeUserIds:
        participant.representativeUserIds ??
        (participant.userId ? [participant.userId] : undefined),
    }
  }

  const sourceId = participant.userId
  const isCompany = ctx.companyIds.has(sourceId)
  const partyType = isCompany ? 'company' : 'individual'
  const workspaceType = isCompany ? 'company' : 'personal'

  return {
    partyId: partyIdForSource(sourceId, partyType),
    workspaceId: workspaceIdForSource(sourceId, workspaceType),
    role: participant.role,
    representativeUserIds: sourceId ? [sourceId] : undefined,
  }
}

export function toBusinessParticipants(
  participants: readonly Participant[],
  ctx: {
    readonly companyIds: ReadonlySet<string>
    readonly userIds: ReadonlySet<string>
  },
): BusinessParticipant[] {
  const byParty = new Map<string, BusinessParticipant>()
  for (const participant of participants) {
    const mapped = toBusinessParticipant(participant, ctx)
    const existing = byParty.get(mapped.partyId)
    if (!existing) {
      byParty.set(mapped.partyId, mapped)
      continue
    }
    const reps = new Set([
      ...(existing.representativeUserIds ?? []),
      ...(mapped.representativeUserIds ?? []),
    ])
    byParty.set(mapped.partyId, {
      ...existing,
      representativeUserIds: [...reps],
    })
  }
  return [...byParty.values()]
}

/** Party-level quorum: unique parties that accepted, not individual users. */
export function countAcceptedParties(
  participants: readonly (Participant & {
    readonly partyId?: string
    readonly approvalStatus?: string
    readonly participantStatus?: string
  })[],
  ctx: {
    readonly companyIds: ReadonlySet<string>
    readonly userIds: ReadonlySet<string>
  },
): number {
  const accepted = new Set<string>()
  for (const participant of participants) {
    const status = (
      participant.approvalStatus ??
      participant.participantStatus ??
      ''
    ).toLowerCase()
    if (status !== 'accepted' && status !== 'approved') continue
    const mapped = toBusinessParticipant(participant, ctx)
    accepted.add(mapped.partyId)
  }
  return accepted.size
}

export function enrichParticipantWithParty(
  participant: Participant,
  ctx: {
    readonly companyIds: ReadonlySet<string>
    readonly userIds: ReadonlySet<string>
    readonly actorUserId?: string
    readonly actedAt?: string
  },
): Participant & {
  partyId: string
  workspaceId: string
  actorUserId?: string
  actedAt?: string
  representativeUserIds?: string[]
} {
  const mapped = toBusinessParticipant(participant, ctx)
  return {
    ...participant,
    partyId: mapped.partyId,
    workspaceId: mapped.workspaceId,
    representativeUserIds: mapped.representativeUserIds
      ? [...mapped.representativeUserIds]
      : undefined,
    actorUserId: ctx.actorUserId,
    actedAt: ctx.actedAt,
  }
}

export function actorMayActForParty(input: {
  readonly actorUserId: string
  readonly actorPartyId?: string
  readonly actorWorkspaceId?: string
  readonly participant: BusinessParticipant
}): boolean {
  if (input.actorPartyId && input.actorPartyId === input.participant.partyId) {
    return true
  }
  if (
    input.actorWorkspaceId &&
    input.actorWorkspaceId === input.participant.workspaceId
  ) {
    return true
  }
  return Boolean(
    input.participant.representativeUserIds?.includes(input.actorUserId),
  )
}
