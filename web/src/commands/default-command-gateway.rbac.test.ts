import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createCommandGatewayTestStack,
  TEST_ADMIN_ACTOR,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'

const acceptedMatch = {
  id: 'pm-accepted',
  matchType: 'one_way',
  status: 'accepted',
  matchScore: 0.9,
  needOpportunityId: 'need-1',
  offerOpportunityId: 'offer-1',
  participants: [
    {
      userId: 'user-need',
      role: 'need_owner',
      opportunityId: 'need-1',
      participantStatus: 'accepted',
    },
    {
      userId: 'user-offer',
      role: 'offer_provider',
      opportunityId: 'offer-1',
      participantStatus: 'accepted',
    },
  ],
  payload: {
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
  },
} as const

describe('DefaultCommandGateway RBAC', () => {
  it('rejected admin command does not mutate repository', () => {
    const stack = createCommandGatewayTestStack({
      postMatches: [acceptedMatch],
      commandPermissionActor: {
        userId: 'user-company',
        userRole: 'company_owner',
      },
    })

    const before = stack.postMatchRepository.getById('pm-accepted')?.status

    const result = stack.gateway.execute({
      commandType: 'ConfirmPostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-rbac-deny',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => /Admin permission required/i.test(error)))
    assert.equal(stack.postMatchRepository.getById('pm-accepted')?.status, before)
  })

  it('allowed admin command succeeds', () => {
    const stack = createCommandGatewayTestStack({
      postMatches: [acceptedMatch],
      commandPermissionActor: TEST_ADMIN_ACTOR,
    })

    const result = stack.gateway.execute({
      commandType: 'ConfirmPostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-rbac-allow',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-accepted')?.status,
      'confirmed',
    )
  })

  it('participant accept command still succeeds for non-admin actor', () => {
    const discovered = {
      ...acceptedMatch,
      id: 'pm-discovered',
      status: 'discovered',
      participants: acceptedMatch.participants.map((participant) => ({
        ...participant,
        participantStatus: 'pending',
      })),
    }

    const stack = createCommandGatewayTestStack({
      postMatches: [discovered],
      commandPermissionActor: {
        userId: 'user-need',
        userRole: 'professional',
      },
    })

    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-participant-accept',
      userId: 'user-need',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'accepted',
    )
  })
})
