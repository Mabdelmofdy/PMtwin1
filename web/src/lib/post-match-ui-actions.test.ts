import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { AuditEntry, Negotiation, PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { DealRepository } from '@/repositories/deal-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import { ApplicationRepository } from '@/repositories/application-repository.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { resolveTestAdminActor } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { ContractRepository } from '@/repositories/contract-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import {
  createPostMatchCommandService,
  setPostMatchCommandGatewayForTests,
} from '@/services/post-match-command-service.ts'
import {
  acceptPostMatchUiAction,
  canShowAcceptPostMatch,
  canShowDeclinePostMatch,
  declinePostMatchUiAction,
  isPostMatchTerminalForParticipantActions,
} from '@/lib/post-match-ui-actions.ts'

class MemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value)
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

const seedPostMatches: PostMatch[] = [
  {
    id: 'pm-discovered',
    matchType: 'one_way',
    status: 'discovered',
    matchScore: 0.9,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    participants: [
      {
        userId: 'user-need',
        role: 'need_owner',
        opportunityId: 'need-1',
        participantStatus: 'pending',
      },
      {
        userId: 'user-offer',
        role: 'offer_provider',
        opportunityId: 'offer-1',
        participantStatus: 'pending',
      },
    ],
    payload: {
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      breakdown: { skillMatch: 1 },
    },
  },
]

function createTestStack(
  seed: PostMatch[] = seedPostMatches,
  negotiations: Negotiation[] = [],
) {
  const storage = new MemoryStorageAdapter()
  const postMatchRepository = new PostMatchRepository(storage, () => seed)
  const negotiationRepository = new NegotiationRepository(
    storage,
    () => negotiations,
  )
  const auditRepository = new AuditRepository(storage, () => [] as AuditEntry[])
  const dealRepository = new DealRepository(storage, () => [])
  const opportunityRepository = new OpportunityRepository(storage, () => [])
  const gateway = new DefaultCommandGateway({
    applicationHandler: new ApplicationCommandHandler({
      applicationRepository: new ApplicationRepository(storage, () => []),
      auditRepository,
    }),
    opportunityHandler: new OpportunityCommandHandler({
      opportunityRepository,
      auditRepository,
    }),
    postMatchHandler: new PostMatchCommandHandler({
      postMatchRepository,
      auditRepository,
    }),
    negotiationHandler: new NegotiationCommandHandler({
      negotiationRepository,
      postMatchRepository,
      auditRepository,
    }),
    dealHandler: new DealCommandHandler({
      dealRepository,
      negotiationRepository,
      postMatchRepository,
      auditRepository,
    }),
    contractHandler: new ContractCommandHandler({
      contractRepository: new ContractRepository(storage, () => []),
      dealRepository,
      opportunityRepository,
      postMatchRepository,
      auditRepository,
    }),
    resolveCommandPermissionActor: resolveTestAdminActor,
  })
  const service = createPostMatchCommandService({ gateway })
  const uiDeps = {
    acceptPostMatch: service.acceptPostMatch.bind(service),
    declinePostMatch: service.declinePostMatch.bind(service),
    readMatchStatus: (id: string) => postMatchRepository.getById(id)?.status,
  }
  return { postMatchRepository, negotiationRepository, service, uiDeps }
}

describe('postMatchUiActions', () => {
  let stack = createTestStack()

  beforeEach(() => {
    setPostMatchCommandGatewayForTests(null)
    stack = createTestStack()
  })

  it('accept action calls postMatchCommandService.acceptPostMatch', () => {
    let called = false
    const result = acceptPostMatchUiAction('pm-discovered', 'user-need', {
      acceptPostMatch: (postMatchId, userId) => {
        called = true
        assert.equal(postMatchId, 'pm-discovered')
        assert.equal(userId, 'user-need')
        return {
          success: true,
          commandType: 'AcceptPostMatch',
          aggregateId: postMatchId,
        }
      },
      readMatchStatus: () => 'accepted',
    })

    assert.equal(called, true)
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.status, 'accepted')
    }
  })

  it('decline action calls postMatchCommandService.declinePostMatch', () => {
    let called = false
    const result = declinePostMatchUiAction('pm-discovered', 'user-offer', {
      declinePostMatch: (postMatchId, userId) => {
        called = true
        assert.equal(postMatchId, 'pm-discovered')
        assert.equal(userId, 'user-offer')
        return {
          success: true,
          commandType: 'DeclinePostMatch',
          aggregateId: postMatchId,
        }
      },
      readMatchStatus: () => 'declined',
    })

    assert.equal(called, true)
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.status, 'declined')
    }
  })

  it('returns an error message when CommandResult.success is false', () => {
    const result = acceptPostMatchUiAction('pm-discovered', 'user-outsider', {
      acceptPostMatch: () => ({
        success: false,
        commandType: 'AcceptPostMatch',
        aggregateId: 'pm-discovered',
        errors: ['User "user-outsider" is not a participant on this PostMatch'],
      }),
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.match(
        result.message,
        /not a participant/i,
      )
    }
  })

  it('updates displayed status to accepted after a successful accept', () => {
    const result = acceptPostMatchUiAction(
      'pm-discovered',
      'user-need',
      stack.uiDeps,
    )

    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.status, 'accepted')
    }
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'accepted',
    )
  })

  it('shows confirmed after the second participant accepts when quorum is reached', () => {
    const first = acceptPostMatchUiAction(
      'pm-discovered',
      'user-need',
      stack.uiDeps,
    )
    assert.equal(first.success, true)
    if (first.success) {
      assert.equal(first.status, 'accepted')
    }

    const second = acceptPostMatchUiAction(
      'pm-discovered',
      'user-offer',
      stack.uiDeps,
    )
    assert.equal(second.success, true)
    if (second.success) {
      assert.equal(second.status, 'confirmed')
    }
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'confirmed',
    )
  })

  it('does not create a negotiation when quorum confirms the match', () => {
    const before = stack.negotiationRepository.getAll().length

    acceptPostMatchUiAction('pm-discovered', 'user-need', stack.uiDeps)
    acceptPostMatchUiAction('pm-discovered', 'user-offer', stack.uiDeps)

    assert.equal(stack.negotiationRepository.getAll().length, before)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'confirmed',
    )
  })
})

describe('postMatch visibility helpers', () => {
  const discoveredMatch = seedPostMatches[0]!

  it('canShowAcceptPostMatch is true for pending participant on discovered match', () => {
    assert.equal(canShowAcceptPostMatch(discoveredMatch, 'user-need'), true)
    assert.equal(canShowDeclinePostMatch(discoveredMatch, 'user-need'), true)
  })

  it('hides accept after participant has accepted', () => {
    const acceptedParticipant = {
      ...discoveredMatch,
      status: 'accepted',
      participants: discoveredMatch.participants.map((participant) =>
        participant.userId === 'user-need'
          ? { ...participant, participantStatus: 'accepted' }
          : participant,
      ),
    }

    assert.equal(canShowAcceptPostMatch(acceptedParticipant, 'user-need'), false)
    assert.equal(canShowDeclinePostMatch(acceptedParticipant, 'user-need'), true)
  })

  it('terminal match hides participant actions', () => {
    const declined = {
      ...discoveredMatch,
      status: 'declined',
    }

    assert.equal(isPostMatchTerminalForParticipantActions(declined), true)
    assert.equal(canShowAcceptPostMatch(declined, 'user-need'), false)
    assert.equal(canShowDeclinePostMatch(declined, 'user-need'), false)
  })
})
