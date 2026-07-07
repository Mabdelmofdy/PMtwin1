import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Negotiation } from '@/types/domain.ts'
import {
  canSendNegotiationMessage,
  canViewNegotiationTranscript,
} from '@/lib/negotiation-room-ui-actions.ts'

const negotiation: Negotiation = {
  id: 'neg-1',
  status: 'active',
  postMatchId: 'pm-1',
  participants: [
    { userId: 'user-need', role: 'need_owner', participantStatus: 'accepted' },
    { userId: 'user-offer', role: 'offer_provider', participantStatus: 'accepted' },
  ],
}

describe('negotiation-room-ui-actions', () => {
  it('participant can send message while negotiation is active', () => {
    assert.equal(
      canSendNegotiationMessage(negotiation, {
        userId: 'user-need',
        canMutate: true,
        isParticipant: true,
      }),
      true,
    )
  })

  it('auditor can view transcript but not send messages', () => {
    assert.equal(
      canViewNegotiationTranscript(negotiation, {
        userId: 'user-auditor',
        canMutate: true,
        isParticipant: false,
        roles: ['auditor'],
      }),
      true,
    )
    assert.equal(
      canSendNegotiationMessage(negotiation, {
        userId: 'user-auditor',
        canMutate: true,
        isParticipant: false,
        roles: ['auditor'],
      }),
      false,
    )
  })

  it('blocks write actions when negotiation is agreed', () => {
    assert.equal(
      canSendNegotiationMessage(
        { ...negotiation, status: 'agreed' },
        {
          userId: 'user-need',
          canMutate: true,
          isParticipant: true,
        },
      ),
      false,
    )
  })
})
