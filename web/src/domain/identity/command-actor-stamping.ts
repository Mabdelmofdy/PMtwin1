import type { CreatedByActor } from '@pm-twin/identity'
import { resolveCreatedByActor } from '@pm-twin/identity'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import type { Participant } from '@/types/participant.ts'
import type {
  NegotiationMessage,
  NegotiationOffer,
  NegotiationTranscriptEvent,
} from '@/types/negotiation-discussion.ts'
import { enrichParticipantWithParty } from './business-participants.ts'
import type { MatchingDiscoveryOwnershipContext } from './matching-discovery-context.ts'

export type WriteActorStamp = {
  readonly actorUserId: string
  readonly partyId?: string
  readonly workspaceId?: string
  readonly actorType?: 'marketplace_user' | 'platform_operator' | 'system'
}

export function resolveWriteActorFromCommand(userId: string): WriteActorStamp {
  const actor = getCommandPermissionActor()
  return {
    actorUserId: userId,
    partyId: actor?.activePartyId,
    workspaceId: actor?.activeWorkspaceId,
    actorType: actor?.actorType ?? 'marketplace_user',
  }
}

export function stampCreatedByActor(
  userId: string,
  actorType?: WriteActorStamp['actorType'],
): CreatedByActor {
  return resolveCreatedByActor({
    createdByUserId: userId,
    createdByActorType: actorType ?? 'marketplace_user',
  })
}

export function stampParticipants(
  participants: readonly Participant[],
  ctx: MatchingDiscoveryOwnershipContext,
  actor?: WriteActorStamp,
): Participant[] {
  return participants.map((participant) =>
    enrichParticipantWithParty(participant, {
      ...ctx,
      actorUserId: actor?.actorUserId,
      actedAt: new Date().toISOString(),
    }),
  )
}

export function stampTranscriptEvent(
  event: Omit<
    NegotiationTranscriptEvent,
    'id' | 'timestamp' | 'partyId' | 'workspaceId' | 'actorUserId' | 'actorType'
  >,
  actor: WriteActorStamp,
): Omit<NegotiationTranscriptEvent, 'id' | 'timestamp'> {
  return {
    ...event,
    actorUserId: actor.actorUserId,
    partyId: actor.partyId,
    workspaceId: actor.workspaceId,
    actorType: actor.actorType ?? 'marketplace_user',
  }
}

export function stampNegotiationMessage(
  message: NegotiationMessage,
  actor: WriteActorStamp,
): NegotiationMessage {
  return {
    ...message,
    actorUserId: actor.actorUserId,
    partyId: actor.partyId,
    workspaceId: actor.workspaceId,
  }
}

export function stampNegotiationOffer(
  offer: NegotiationOffer,
  actor: WriteActorStamp,
): NegotiationOffer {
  return {
    ...offer,
    actorUserId: actor.actorUserId,
    partyId: actor.partyId,
    workspaceId: actor.workspaceId,
  }
}

export type NegotiationCreateStamp = {
  readonly initiatingPartyId?: string
  readonly initiatedByWorkspaceId?: string
  readonly createdByUserId?: string
  readonly createdByActorType?: 'marketplace_user' | 'platform_operator' | 'system'
}

export function stampNegotiationCreateMetadata(
  actor: WriteActorStamp,
): NegotiationCreateStamp {
  return {
    initiatingPartyId: actor.partyId,
    initiatedByWorkspaceId: actor.workspaceId,
    createdByUserId: actor.actorUserId,
    createdByActorType: actor.actorType ?? 'marketplace_user',
  }
}

export type CommercialAgreementCreateStamp = NegotiationCreateStamp & {
  readonly originatingOwnerPartyId?: string
  readonly lastModifiedByUserId?: string
}

export function stampCommercialAgreementCreateMetadata(
  actor: WriteActorStamp,
  originatingOwnerPartyId?: string,
): CommercialAgreementCreateStamp {
  return {
    ...stampNegotiationCreateMetadata(actor),
    originatingOwnerPartyId,
    lastModifiedByUserId: actor.actorUserId,
  }
}

export type CommercialAgreementDecisionStamp = {
  readonly awardDecisionByPartyId?: string
  readonly awardedByUserId?: string
  readonly awardedPartyId?: string
  readonly awardedWorkspaceId?: string
  readonly lastModifiedByUserId?: string
}

export function stampCommercialAgreementDecisionMetadata(
  actor: WriteActorStamp,
  decisionPartyId?: string,
): CommercialAgreementDecisionStamp {
  return {
    awardDecisionByPartyId: decisionPartyId ?? actor.partyId,
    awardedByUserId: actor.actorUserId,
    awardedPartyId: actor.partyId,
    awardedWorkspaceId: actor.workspaceId,
    lastModifiedByUserId: actor.actorUserId,
  }
}
