import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AppNotification, AuditEntry, PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { DealRepository } from '@/repositories/deal-repository.ts'
import { ContractRepository } from '@/repositories/contract-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import type { NotificationSink } from '@/commands/handlers/lifecycle-notifications.ts'

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

class CollectingNotificationSink implements NotificationSink {
  readonly created: Omit<AppNotification, 'id' | 'createdAt'>[] = []
  create(data: Omit<AppNotification, 'id' | 'createdAt'>): unknown {
    this.created.push(data)
    return data
  }
}

function buildStack(seed: PostMatch[], notificationRepository?: NotificationSink) {
  const storage = new MemoryStorageAdapter()
  const postMatchRepository = new PostMatchRepository(storage, () => seed)
  const negotiationRepository = new NegotiationRepository(storage, () => [])
  const dealRepository = new DealRepository(storage, () => [])
  const contractRepository = new ContractRepository(storage, () => [])
  const opportunityRepository = new OpportunityRepository(storage, () => [])
  const auditRepository = new AuditRepository(storage, () => [] as AuditEntry[])

  const postMatchHandler = new PostMatchCommandHandler({
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })
  const negotiationHandler = new NegotiationCommandHandler({
    negotiationRepository,
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })
  const dealHandler = new DealCommandHandler({
    dealRepository,
    negotiationRepository,
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })
  const contractHandler = new ContractCommandHandler({
    contractRepository,
    dealRepository,
    opportunityRepository,
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })

  return {
    postMatchRepository,
    negotiationRepository,
    dealRepository,
    contractRepository,
    postMatchHandler,
    negotiationHandler,
    dealHandler,
    contractHandler,
  }
}

function accept(
  handler: PostMatchCommandHandler,
  aggregateId: string,
  userId: string,
) {
  return handler.handle({
    commandType: 'AcceptPostMatch',
    aggregateId,
    clientRequestId: `req-accept-${userId}-${aggregateId}`,
    userId,
  } as never)
}

const twoWayMatch: PostMatch = {
  id: 'pm-two-way',
  matchType: 'two_way',
  status: 'discovered',
  matchScore: 0.72,
  participants: [
    { userId: 'A', role: 'need_owner', opportunityId: 'a-need', participantStatus: 'pending' },
    { userId: 'A', role: 'offer_provider', opportunityId: 'a-offer', participantStatus: 'pending' },
    { userId: 'B', role: 'need_owner', opportunityId: 'b-need', participantStatus: 'pending' },
    { userId: 'B', role: 'offer_provider', opportunityId: 'b-offer', participantStatus: 'pending' },
  ],
  payload: {
    sideA: { userId: 'A', needId: 'a-need', offerId: 'a-offer' },
    sideB: { userId: 'B', needId: 'b-need', offerId: 'b-offer' },
  },
}

const consortiumConfirmed: PostMatch = {
  id: 'pm-consortium',
  matchType: 'consortium',
  status: 'confirmed',
  matchScore: 0.8,
  participants: [
    { userId: 'lead', role: 'consortium_lead', opportunityId: 'lead-need', participantStatus: 'accepted' },
    { userId: 'm1', role: 'consortium_member', opportunityId: 'role-offer-1', participantStatus: 'accepted' },
    { userId: 'm2', role: 'consortium_member', opportunityId: 'role-offer-2', participantStatus: 'accepted' },
  ],
  payload: {
    leadNeedId: 'lead-need',
    roles: [
      { role: 'Architect', opportunityId: 'role-offer-1', userId: 'm1', score: 0.8 },
      { role: 'Engineer', opportunityId: 'role-offer-2', userId: 'm2', score: 0.75 },
    ],
  },
}

describe('four match types — multi-party confirm quorum', () => {
  it('two_way confirms only after every participant accepts', () => {
    const { postMatchHandler, postMatchRepository } = buildStack([
      structuredClone(twoWayMatch),
    ])

    const first = accept(postMatchHandler, 'pm-two-way', 'A')
    assert.equal(first.success, true)
    assert.equal(postMatchRepository.getById('pm-two-way')?.status, 'accepted')

    const second = accept(postMatchHandler, 'pm-two-way', 'B')
    assert.equal(second.success, true)
    assert.equal(postMatchRepository.getById('pm-two-way')?.status, 'confirmed')
  })

  it('circular confirms once all chain participants accept', () => {
    const circular: PostMatch = {
      id: 'pm-circular',
      matchType: 'circular',
      status: 'discovered',
      matchScore: 0.66,
      participants: [
        { userId: 'c1', role: 'chain_participant', opportunityId: 'c1-offer', participantStatus: 'pending' },
        { userId: 'c2', role: 'chain_participant', opportunityId: 'c2-offer', participantStatus: 'pending' },
        { userId: 'c3', role: 'chain_participant', opportunityId: 'c3-offer', participantStatus: 'pending' },
      ],
      payload: {
        cycle: ['c1', 'c2', 'c3'],
        links: [
          { fromCreatorId: 'c1', toCreatorId: 'c2', needId: 'c2-need', offerId: 'c1-offer', score: 0.7 },
          { fromCreatorId: 'c2', toCreatorId: 'c3', needId: 'c3-need', offerId: 'c2-offer', score: 0.7 },
          { fromCreatorId: 'c3', toCreatorId: 'c1', needId: 'c1-need', offerId: 'c3-offer', score: 0.7 },
        ],
      },
    }
    const { postMatchHandler, postMatchRepository } = buildStack([circular])

    accept(postMatchHandler, 'pm-circular', 'c1')
    accept(postMatchHandler, 'pm-circular', 'c2')
    assert.equal(postMatchRepository.getById('pm-circular')?.status, 'accepted')

    accept(postMatchHandler, 'pm-circular', 'c3')
    assert.equal(postMatchRepository.getById('pm-circular')?.status, 'confirmed')
  })

  it('preserves one_way quorum (both roles accept)', () => {
    const oneWay: PostMatch = {
      id: 'pm-one-way',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.9,
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [
        { userId: 'n', role: 'need_owner', opportunityId: 'need-1', participantStatus: 'pending' },
        { userId: 'o', role: 'offer_provider', opportunityId: 'offer-1', participantStatus: 'pending' },
      ],
    }
    const { postMatchHandler, postMatchRepository } = buildStack([oneWay])

    accept(postMatchHandler, 'pm-one-way', 'n')
    assert.equal(postMatchRepository.getById('pm-one-way')?.status, 'accepted')
    accept(postMatchHandler, 'pm-one-way', 'o')
    assert.equal(postMatchRepository.getById('pm-one-way')?.status, 'confirmed')
  })
})

describe('four match types — downstream flow for non-one_way', () => {
  it('runs PostMatch -> Negotiation -> Deal -> Contract for a consortium match', () => {
    const {
      negotiationHandler,
      dealHandler,
      contractHandler,
      negotiationRepository,
      dealRepository,
    } = buildStack([structuredClone(consortiumConfirmed)])

    const startResult = negotiationHandler.handle({
      commandType: 'StartNegotiationFromPostMatch',
      aggregateId: 'pm-consortium',
      clientRequestId: 'req-start',
    } as never)
    assert.equal(startResult.success, true)
    const negotiationId = startResult.aggregateId
    const negotiation = negotiationRepository.getById(negotiationId)
    assert.ok(negotiation)
    assert.deepEqual(negotiation?.opportunityIds, [
      'lead-need',
      'role-offer-1',
      'role-offer-2',
    ])

    const agreeResult = negotiationHandler.handle({
      commandType: 'AgreeNegotiation',
      aggregateId: negotiationId,
      clientRequestId: 'req-agree',
    } as never)
    assert.equal(agreeResult.success, true)

    const dealResult = dealHandler.handle({
      commandType: 'CreateDealFromPostMatch',
      aggregateId: 'pm-consortium',
      clientRequestId: 'req-deal',
      negotiationId,
    } as never)
    assert.equal(dealResult.success, true, JSON.stringify(dealResult.errors))
    const deal = dealRepository.getById(dealResult.aggregateId)
    assert.equal(deal?.matchType, 'consortium')
    assert.deepEqual(deal?.opportunityIds, [
      'lead-need',
      'role-offer-1',
      'role-offer-2',
    ])

    const contractResult = contractHandler.handle({
      commandType: 'CreateContractFromDeal',
      aggregateId: dealResult.aggregateId,
      clientRequestId: 'req-contract',
      dealId: dealResult.aggregateId,
    } as never)
    assert.equal(contractResult.success, true, JSON.stringify(contractResult.errors))
  })
})

describe('four match types — best-effort notifications', () => {
  it('emits participant notifications on confirm without a required sink', () => {
    const sink = new CollectingNotificationSink()
    const { postMatchHandler } = buildStack([structuredClone(twoWayMatch)], sink)

    accept(postMatchHandler, 'pm-two-way', 'A')
    accept(postMatchHandler, 'pm-two-way', 'B')

    const confirmed = sink.created.filter((n) => n.type === 'match_confirmed')
    assert.ok(confirmed.length >= 1)
    assert.ok(confirmed.every((n) => n.entityId === 'pm-two-way'))
  })

  it('does not throw when no notification sink is provided', () => {
    const { postMatchHandler, postMatchRepository } = buildStack([
      structuredClone(twoWayMatch),
    ])
    assert.doesNotThrow(() => {
      accept(postMatchHandler, 'pm-two-way', 'A')
      accept(postMatchHandler, 'pm-two-way', 'B')
    })
    assert.equal(postMatchRepository.getById('pm-two-way')?.status, 'confirmed')
  })
})
