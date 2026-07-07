import type { Negotiation } from '@/types/domain.ts'
import type { NegotiationOffer } from '@/types/negotiation-discussion.ts'
import {
  buildWorkflowContext,
  isWorkflowActionAvailable,
  type WorkflowActionKey,
} from '@/domain/workflows/workflow-bridge.ts'
import {
  negotiationOfferRepository,
  dealRepository,
} from '@/repositories/index.ts'
import { toWorkflowEntitySnapshot } from '@/domain/workflows/workflow-bridge.ts'

export type NegotiationRoomWorkflowContextInput = {
  readonly negotiation: Negotiation
  readonly userId?: string | null
  readonly canMutate?: boolean
  readonly isParticipant?: boolean
  readonly roles?: readonly string[]
  readonly acceptedOfferId?: string | null
}

export function findAcceptedNegotiationOfferId(
  negotiationId: string,
  negotiation?: Negotiation,
): string | null {
  const acceptedOfferId =
    negotiationOfferRepository
      .getByNegotiationId(negotiationId)
      .find((offer) => offer.status === 'accepted')?.id ?? null
  if (acceptedOfferId) return acceptedOfferId

  const resolved = negotiation
  if (
    resolved?.commercialTerms
    && Object.keys(resolved.commercialTerms).length > 0
    && (resolved.status === 'agreed' || resolved.agreedTerms)
  ) {
    return 'legacy-agreed-terms'
  }

  return null
}

export function buildNegotiationRoomWorkflowContext(
  input: NegotiationRoomWorkflowContextInput,
) {
  const { negotiation } = input
  const deal = dealRepository.findByNegotiationId(negotiation.id)
  const acceptedOfferId =
    input.acceptedOfferId
    ?? findAcceptedNegotiationOfferId(negotiation.id, negotiation)

  return buildWorkflowContext({
    primaryWorkflow: negotiation.applicationId ? 'hiring' : 'marketplace',
    user: {
      userId: input.userId ?? null,
      canMutate: input.canMutate ?? false,
      isParticipant: input.isParticipant ?? false,
      roles: input.roles,
    },
    negotiation,
    postMatch: negotiation.postMatchId
      ? { id: negotiation.postMatchId, status: 'confirmed', matchType: 'one_way', matchScore: 0, participants: [] }
      : undefined,
    application: negotiation.applicationId
      ? {
          id: negotiation.applicationId,
          status: 'accepted',
          opportunityId: negotiation.opportunityId ?? '',
          applicantId: '',
        }
      : undefined,
    linkage: {
      commercialAgreementForNegotiation: deal ? toWorkflowEntitySnapshot(deal) ?? null : null,
      negotiationAcceptedOfferId: acceptedOfferId,
    },
  })
}

export function isNegotiationRoomActionAvailable(
  negotiation: Negotiation,
  actionKey: WorkflowActionKey,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  const context = buildNegotiationRoomWorkflowContext({
    negotiation,
    ...input,
  })
  return isWorkflowActionAvailable(context, actionKey)
}

export function canSendNegotiationMessage(
  negotiation: Negotiation,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  return isNegotiationRoomActionAvailable(
    negotiation,
    'send_negotiation_message',
    input,
  )
}

export function canSubmitNegotiationOffer(
  negotiation: Negotiation,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  return isNegotiationRoomActionAvailable(
    negotiation,
    'submit_negotiation_offer',
    input,
  )
}

export function canSubmitNegotiationCounterOffer(
  negotiation: Negotiation,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  return isNegotiationRoomActionAvailable(
    negotiation,
    'submit_negotiation_counter_offer',
    input,
  )
}

export function canAcceptNegotiationOffer(
  negotiation: Negotiation,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  return isNegotiationRoomActionAvailable(
    negotiation,
    'accept_negotiation_offer',
    input,
  )
}

export function canRejectNegotiationOffer(
  negotiation: Negotiation,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  return isNegotiationRoomActionAvailable(
    negotiation,
    'reject_negotiation_offer',
    input,
  )
}

export function canViewNegotiationTranscript(
  negotiation: Negotiation,
  input: Omit<NegotiationRoomWorkflowContextInput, 'negotiation'>,
): boolean {
  return isNegotiationRoomActionAvailable(
    negotiation,
    'view_negotiation_transcript',
    input,
  )
}

export function findLatestSubmittedOffer(
  offers: readonly NegotiationOffer[],
): NegotiationOffer | undefined {
  return [...offers]
    .filter((offer) => offer.status === 'submitted')
    .sort((a, b) => b.version - a.version)[0]
}
