import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, beforeEach } from 'node:test'
import type { AuditEntry, PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import {
  POST_MATCH_ENTITY_TYPE,
  PostMatchCommandHandler,
} from '@/commands/handlers/post-match-command-handler.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { ApplicationRepository } from '@/repositories/application-repository.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { resolveTestAdminActor } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { InMemoryIdempotencyStore } from '@/commands/idempotency/InMemoryIdempotencyStore.ts'
import { DealRepository } from '@/repositories/deal-repository.ts'
import { ContractRepository } from '@/repositories/contract-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'

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
  {
    id: 'pm-accepted',
    matchType: 'one_way',
    status: 'accepted',
    matchScore: 0.85,
    needOpportunityId: 'need-2',
    offerOpportunityId: 'offer-2',
    participants: [
      {
        userId: 'user-need-2',
        role: 'need_owner',
        opportunityId: 'need-2',
        participantStatus: 'accepted',
      },
      {
        userId: 'user-offer-2',
        role: 'offer_provider',
        opportunityId: 'offer-2',
        participantStatus: 'pending',
      },
    ],
  },
  {
    id: 'pm-confirmed',
    matchType: 'one_way',
    status: 'confirmed',
    matchScore: 0.8,
    needOpportunityId: 'need-3',
    offerOpportunityId: 'offer-3',
    participants: [
      {
        userId: 'user-need-3',
        role: 'need_owner',
        opportunityId: 'need-3',
        participantStatus: 'accepted',
      },
      {
        userId: 'user-offer-3',
        role: 'offer_provider',
        opportunityId: 'offer-3',
        participantStatus: 'accepted',
      },
    ],
  },
  {
    id: 'pm-decline-blocks',
    matchType: 'one_way',
    status: 'discovered',
    matchScore: 0.75,
    needOpportunityId: 'need-4',
    offerOpportunityId: 'offer-4',
    participants: [
      {
        userId: 'user-need-4',
        role: 'need_owner',
        opportunityId: 'need-4',
        participantStatus: 'pending',
      },
      {
        userId: 'user-offer-4',
        role: 'offer_provider',
        opportunityId: 'offer-4',
        participantStatus: 'declined',
      },
    ],
  },
  {
    id: 'pm-declined-pair',
    matchType: 'one_way',
    status: 'declined',
    matchScore: 0.7,
    needOpportunityId: 'need-declined',
    offerOpportunityId: 'offer-declined',
    participants: [],
    payload: {
      needOpportunityId: 'need-declined',
      offerOpportunityId: 'offer-declined',
      breakdown: { skillMatch: 0.7 },
    },
  },
  {
    id: 'pm-expired-pair',
    matchType: 'one_way',
    status: 'expired',
    matchScore: 0.65,
    needOpportunityId: 'need-expired',
    offerOpportunityId: 'offer-expired',
    participants: [],
    payload: {
      needOpportunityId: 'need-expired',
      offerOpportunityId: 'offer-expired',
      breakdown: { skillMatch: 0.65 },
    },
  },
  {
    id: 'pm-expired-with-participants',
    matchType: 'one_way',
    status: 'expired',
    matchScore: 0.65,
    needOpportunityId: 'need-expired-participants',
    offerOpportunityId: 'offer-expired-participants',
    participants: [
      {
        userId: 'user-need-expired',
        role: 'need_owner',
        opportunityId: 'need-expired-participants',
        participantStatus: 'pending',
      },
      {
        userId: 'user-offer-expired',
        role: 'offer_provider',
        opportunityId: 'offer-expired-participants',
        participantStatus: 'pending',
      },
    ],
  },
  {
    id: 'pm-superseded-pair',
    matchType: 'one_way',
    status: 'superseded',
    matchScore: 0.6,
    needOpportunityId: 'need-superseded',
    offerOpportunityId: 'offer-superseded',
    participants: [],
    payload: {
      needOpportunityId: 'need-superseded',
      offerOpportunityId: 'offer-superseded',
      breakdown: { skillMatch: 0.6 },
    },
  },
]

function createTestStack(seed: PostMatch[] = seedPostMatches) {
  const storage = new MemoryStorageAdapter()
  const postMatchRepository = new PostMatchRepository(storage, () => seed)
  const auditRepository = new AuditRepository(storage, () => [] as AuditEntry[])
  const postMatchHandler = new PostMatchCommandHandler({
    postMatchRepository,
    auditRepository,
  })
  const dealRepository = new DealRepository(storage, () => [])
  const opportunityRepository = new OpportunityRepository(storage, () => [])
  const opportunityHandler = new OpportunityCommandHandler({
    opportunityRepository,
    auditRepository,
  })
  const applicationHandler = new ApplicationCommandHandler({
    applicationRepository: new ApplicationRepository(storage, () => []),
    auditRepository,
  })
  const negotiationHandler = new NegotiationCommandHandler({
    negotiationRepository: new NegotiationRepository(storage, () => []),
    postMatchRepository,
    auditRepository,
  })
  const dealHandler = new DealCommandHandler({
    dealRepository,
    negotiationRepository: new NegotiationRepository(storage, () => []),
    postMatchRepository,
    auditRepository,
  })
  const contractHandler = new ContractCommandHandler({
    contractRepository: new ContractRepository(storage, () => []),
    dealRepository,
    opportunityRepository,
    postMatchRepository,
    auditRepository,
  })
  const idempotencyStore = new InMemoryIdempotencyStore()
  const gateway = new DefaultCommandGateway({
    applicationHandler,
    opportunityHandler,
    postMatchHandler,
    negotiationHandler,
    dealHandler,
    contractHandler,
    idempotencyStore,
    resolveCommandPermissionActor: resolveTestAdminActor,
  })

  return { storage, postMatchRepository, gateway, idempotencyStore }
}

const discoverFixture = {
  commandType: 'DiscoverPostMatch' as const,
  aggregateId: 'pm-new',
  clientRequestId: 'req-discover',
  needOpportunityId: 'need-new',
  offerOpportunityId: 'offer-new',
  matchType: 'one_way' as const,
  matchScore: 0.91,
  matchCriteria: { skillMatch: 0.9, budgetFit: 0.8 },
  participants: [
    {
      userId: 'user-need-new',
      role: 'need_owner',
      opportunityId: 'need-new',
    },
    {
      userId: 'user-offer-new',
      role: 'offer_provider',
      opportunityId: 'offer-new',
    },
  ],
}

describe('PostMatchCommandHandler', () => {
  let stack = createTestStack()

  beforeEach(() => {
    stack = createTestStack()
  })

  it('DiscoverPostMatch creates ADR-002 shaped PostMatch with payload fallback', () => {
    const result = stack.gateway.execute(discoverFixture)
    assert.equal(result.success, true)

    const created = stack.postMatchRepository.getById('pm-new')
    assert.equal(created?.status, 'discovered')
    assert.equal(created?.needOpportunityId, 'need-new')
    assert.equal(created?.offerOpportunityId, 'offer-new')
    assert.equal(created?.payload?.needOpportunityId, 'need-new')
    assert.equal(created?.payload?.offerOpportunityId, 'offer-new')
    assert.deepEqual(created?.matchCriteria, discoverFixture.matchCriteria)
    assert.deepEqual(created?.payload?.breakdown, discoverFixture.matchCriteria)
  })

  it('DiscoverPostMatch rejects missing needOpportunityId', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-missing-need',
      clientRequestId: 'req-missing-need',
      needOpportunityId: '',
    })
    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('needOpportunityId')))
  })

  it('DiscoverPostMatch rejects missing offerOpportunityId', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-missing-offer',
      clientRequestId: 'req-missing-offer',
      offerOpportunityId: '',
    })
    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('offerOpportunityId')))
  })

  it('DiscoverPostMatch rejects missing matchScore', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-missing-score',
      clientRequestId: 'req-missing-score',
      matchScore: Number.NaN,
    })
    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('matchScore')))
  })

  it('DiscoverPostMatch blocks duplicate when an active discovered match exists', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-dup-discovered',
      clientRequestId: 'req-dup-discovered',
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
    })
    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('Active PostMatch already exists')))
    assert.equal(stack.postMatchRepository.getById('pm-dup-discovered'), undefined)
  })

  it('DiscoverPostMatch blocks duplicate when an active accepted match exists', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-dup-accepted',
      clientRequestId: 'req-dup-accepted',
      needOpportunityId: 'need-2',
      offerOpportunityId: 'offer-2',
    })
    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('Active PostMatch already exists')))
    assert.equal(stack.postMatchRepository.getById('pm-dup-accepted'), undefined)
  })

  it('DiscoverPostMatch allows rediscovery after declined', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-rediscover-declined',
      clientRequestId: 'req-rediscover-declined',
      needOpportunityId: 'need-declined',
      offerOpportunityId: 'offer-declined',
    })
    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-rediscover-declined')?.status,
      'discovered',
    )
  })

  it('DiscoverPostMatch allows rediscovery after expired', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-rediscover-expired',
      clientRequestId: 'req-rediscover-expired',
      needOpportunityId: 'need-expired',
      offerOpportunityId: 'offer-expired',
    })
    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-rediscover-expired')?.status,
      'discovered',
    )
  })

  it('DiscoverPostMatch allows rediscovery after superseded', () => {
    const result = stack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-rediscover-superseded',
      clientRequestId: 'req-rediscover-superseded',
      needOpportunityId: 'need-superseded',
      offerOpportunityId: 'offer-superseded',
    })
    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-rediscover-superseded')?.status,
      'discovered',
    )
  })

  it('DiscoverPostMatch blocks duplicate using payload fallback FKs', () => {
    const payloadOnlyStack = createTestStack([
      {
        id: 'pm-payload-only',
        matchType: 'one_way',
        status: 'discovered',
        matchScore: 0.88,
        participants: [],
        payload: {
          needOpportunityId: 'need-payload',
          offerOpportunityId: 'offer-payload',
          breakdown: { skillMatch: 0.88 },
        },
      },
    ])
    const result = payloadOnlyStack.gateway.execute({
      ...discoverFixture,
      aggregateId: 'pm-payload-dup',
      clientRequestId: 'req-payload-dup',
      needOpportunityId: 'need-payload',
      offerOpportunityId: 'offer-payload',
    })
    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('Active PostMatch already exists')))
  })

  it('AcceptPostMatch from discovered moves aggregate to accepted on first acceptance', () => {
    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-accept-first',
      userId: 'user-need',
    })

    assert.equal(result.success, true)
    const updated = stack.postMatchRepository.getById('pm-discovered')
    assert.equal(updated?.status, 'accepted')
    assert.equal(
      updated?.participants.find((p) => p.userId === 'user-need')
        ?.participantStatus,
      'accepted',
    )
  })

  it('AcceptPostMatch quorum auto-confirms on second acceptance', () => {
    const first = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-accept-first-quorum',
      userId: 'user-need',
    })
    assert.equal(first.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'accepted',
    )

    const second = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-accept-second-quorum',
      userId: 'user-offer',
    })
    assert.equal(second.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'confirmed',
    )
  })

  it('AcceptPostMatch when already confirmed is rejected', () => {
    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-confirmed',
      clientRequestId: 'req-accept-terminal',
      userId: 'user-need-3',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('terminal state')),
    )
    assert.equal(
      stack.postMatchRepository.getById('pm-confirmed')?.status,
      'confirmed',
    )
  })

  it('AcceptPostMatch after the match expired is rejected', () => {
    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-expired-with-participants',
      clientRequestId: 'req-accept-expired',
      userId: 'user-need-expired',
    })

    assert.equal(result.success, false)
    assert.equal(
      stack.postMatchRepository.getById('pm-expired-with-participants')?.status,
      'expired',
    )
  })

  it('AcceptPostMatch by non-participant is rejected', () => {
    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-accept-outsider',
      userId: 'user-outsider',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('not a participant')),
    )
  })

  it('AcceptPostMatch declines aggregate when a participant already declined', () => {
    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-decline-blocks',
      clientRequestId: 'req-accept-with-decline',
      userId: 'user-need-4',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-decline-blocks')?.status,
      'declined',
    )
  })

  it('DeclinePostMatch from discovered moves aggregate to declined', () => {
    const result = stack.gateway.execute({
      commandType: 'DeclinePostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-decline',
      userId: 'user-offer',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'declined',
    )
  })

  it('ConfirmPostMatch from accepted moves aggregate to confirmed', () => {
    const result = stack.gateway.execute({
      commandType: 'ConfirmPostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-confirm',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-accepted')?.status,
      'confirmed',
    )
  })

  it('ConfirmPostMatch from discovered fails', () => {
    const result = stack.gateway.execute({
      commandType: 'ConfirmPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-confirm-fail',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('accepted')))
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'discovered',
    )
  })

  it('ExpirePostMatch from accepted moves aggregate to expired', () => {
    const result = stack.gateway.execute({
      commandType: 'ExpirePostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-expire',
      reason: 'ttl_elapsed',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-accepted')?.status,
      'expired',
    )
  })

  it('SupersedePostMatch from accepted moves aggregate to superseded', () => {
    const result = stack.gateway.execute({
      commandType: 'SupersedePostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-supersede',
      replacementPostMatchId: 'pm-replacement',
      reason: 'higher_score',
    })

    assert.equal(result.success, true)
    const updated = stack.postMatchRepository.getById('pm-accepted')
    assert.equal(updated?.status, 'superseded')
    assert.equal(updated?.replacementPostMatchId, 'pm-replacement')
  })

  it('rejects terminal transition', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionPostMatchStatus',
      aggregateId: 'pm-confirmed',
      clientRequestId: 'req-terminal',
      targetStatus: 'accepted',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('terminal state')),
    )
    assert.equal(
      stack.postMatchRepository.getById('pm-confirmed')?.status,
      'confirmed',
    )
  })

  it('deduplicates AcceptPostMatch commands using the idempotency store', () => {
    const command = {
      commandType: 'AcceptPostMatch' as const,
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-dup-accept',
      userId: 'user-need',
    }

    const first = stack.gateway.execute(command)
    assert.equal(first.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'accepted',
    )

    stack.postMatchRepository.update('pm-discovered', { status: 'discovered' })

    const second = stack.gateway.execute(command)
    assert.deepEqual(second, first)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'discovered',
    )
  })

  it('deduplicates PostMatch commands using the idempotency store', () => {
    const command = {
      commandType: 'ExpirePostMatch' as const,
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-dup-expire',
    }

    const first = stack.gateway.execute(command)
    assert.equal(first.success, true)

    stack.postMatchRepository.update('pm-accepted', { status: 'accepted' })

    const second = stack.gateway.execute(command)
    assert.deepEqual(second, first)
    assert.equal(
      stack.postMatchRepository.getById('pm-accepted')?.status,
      'accepted',
    )
  })

  it('uses canonical lifecycle entity key match, not post_match', () => {
    assert.equal(POST_MATCH_ENTITY_TYPE, 'match')

    const handlerPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'post-match-command-handler.ts',
    )
    const source = readFileSync(handlerPath, 'utf8')
    assert.ok(!source.includes("getFsm('post_match')"))
    assert.ok(!source.includes('getFsm("post_match")'))
    assert.ok(source.includes("POST_MATCH_ENTITY_TYPE = 'match'"))
  })
})
