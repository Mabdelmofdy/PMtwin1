import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { AuditEntry, PostMatch } from '@/types/domain.ts'
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
} from '@/services/post-match-command-service.ts'
import { matchingService } from '@/services/matching-service.ts'

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

const participants = [
  {
    userId: 'user-need-engine',
    role: 'need_owner',
    opportunityId: 'need-engine',
    participantStatus: 'pending',
  },
  {
    userId: 'user-offer-engine',
    role: 'offer_provider',
    opportunityId: 'offer-engine',
    participantStatus: 'pending',
  },
] as const

function createTestStack(seed: PostMatch[] = []) {
  const storage = new MemoryStorageAdapter()
  const postMatchRepository = new PostMatchRepository(storage, () => seed)
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
      negotiationRepository: new NegotiationRepository(storage, () => []),
      postMatchRepository,
      auditRepository,
    }),
    dealHandler: new DealCommandHandler({
      dealRepository,
      negotiationRepository: new NegotiationRepository(storage, () => []),
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
  return { postMatchRepository, service }
}

const discoverInput = {
  aggregateId: 'pm-engine-1',
  needOpportunityId: 'need-engine',
  offerOpportunityId: 'offer-engine',
  matchType: 'one_way',
  matchScore: 0.92,
  matchCriteria: { skillMatch: 0.9, timelineFit: 0.85 },
  participants,
  runId: 'run-engine-1',
} as const

describe('matchingService.discoverNeedOfferMatch', () => {
  let stack = createTestStack()

  beforeEach(() => {
    stack = createTestStack()
  })

  it('creates an ADR-002 shaped PostMatch through DiscoverPostMatch', () => {
    const result = matchingService.discoverNeedOfferMatch(discoverInput, {
      discoverPostMatch: stack.service.discoverPostMatch.bind(stack.service),
      readPostMatch: (id) => stack.postMatchRepository.getById(id),
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.postMatchId, 'pm-engine-1')
    assert.equal(result.postMatch.status, 'discovered')
    assert.equal(result.postMatch.needOpportunityId, 'need-engine')
    assert.equal(result.postMatch.offerOpportunityId, 'offer-engine')
    assert.equal(result.postMatch.payload?.needOpportunityId, 'need-engine')
    assert.equal(result.postMatch.payload?.offerOpportunityId, 'offer-engine')
    assert.deepEqual(result.postMatch.matchCriteria, discoverInput.matchCriteria)
    assert.deepEqual(result.postMatch.payload?.breakdown, discoverInput.matchCriteria)
    assert.equal(result.postMatch.runId, 'run-engine-1')
    assert.equal(result.postMatch.matchScore, discoverInput.matchScore)
  })

  it('blocks duplicate discovered matches for the same need/offer pair', () => {
    const deps = {
      discoverPostMatch: stack.service.discoverPostMatch.bind(stack.service),
      readPostMatch: (id: string) => stack.postMatchRepository.getById(id),
    }
    const first = matchingService.discoverNeedOfferMatch(discoverInput, deps)
    assert.equal(first.success, true)

    const duplicate = matchingService.discoverNeedOfferMatch(
      { ...discoverInput, aggregateId: 'pm-engine-dup' },
      deps,
    )
    assert.equal(duplicate.success, false)
    if (duplicate.success) return
    assert.ok(duplicate.errors.some((error) => error.includes('Active PostMatch already exists')))
  })
})
