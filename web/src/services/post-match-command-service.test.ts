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
  setPostMatchCommandGatewayForTests,
} from '@/services/post-match-command-service.ts'

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

function createTestStack(seed: PostMatch[] = seedPostMatches) {
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
  return { postMatchRepository, service, gateway }
}

describe('postMatchCommandService', () => {
  let stack = createTestStack()

  beforeEach(() => {
    setPostMatchCommandGatewayForTests(null)
    stack = createTestStack()
  })

  it('calls DiscoverPostMatch through the gateway', () => {
    const result = stack.service.discoverPostMatch({
      aggregateId: 'pm-svc-new',
      needOpportunityId: 'need-svc',
      offerOpportunityId: 'offer-svc',
      matchType: 'one_way',
      matchScore: 0.88,
      matchCriteria: { skillMatch: 0.9 },
      participants: [
        {
          userId: 'user-need-svc',
          role: 'need_owner',
          opportunityId: 'need-svc',
        },
        {
          userId: 'user-offer-svc',
          role: 'offer_provider',
          opportunityId: 'offer-svc',
        },
      ],
    })

    assert.equal(result.success, true)
    assert.equal(result.commandType, 'DiscoverPostMatch')
    assert.equal(
      stack.postMatchRepository.getById('pm-svc-new')?.status,
      'discovered',
    )
  })

  it('calls AcceptPostMatch through the gateway', () => {
    const result = stack.service.acceptPostMatch('pm-discovered', 'user-need')

    assert.equal(result.success, true)
    assert.equal(result.commandType, 'AcceptPostMatch')
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'accepted',
    )
  })

  it('returns failure for invalid command without swallowing errors', () => {
    const result = stack.service.acceptPostMatch('pm-discovered', 'user-outsider')

    assert.equal(result.success, false)
    assert.equal(result.commandType, 'AcceptPostMatch')
    assert.ok(Array.isArray(result.errors))
    assert.ok(result.errors!.length > 0)
  })

  it('does not swallow CommandResult.success=false on discover validation failure', () => {
    const result = stack.service.discoverPostMatch({
      aggregateId: 'pm-invalid',
      needOpportunityId: '',
      offerOpportunityId: 'offer-svc',
      matchType: 'one_way',
      matchScore: 0.5,
      matchCriteria: { skillMatch: 0.5 },
      participants: [],
    })

    assert.equal(result.success, false)
    assert.equal(result.commandType, 'DiscoverPostMatch')
    assert.ok(result.errors?.some((error) => error.includes('needOpportunityId')))
    assert.equal(stack.postMatchRepository.getById('pm-invalid'), undefined)
  })

  it('produces stable commandType literals', () => {
    const discover = stack.service.discoverPostMatch({
      aggregateId: 'pm-lit-1',
      needOpportunityId: 'need-lit',
      offerOpportunityId: 'offer-lit',
      matchType: 'one_way',
      matchScore: 0.7,
      matchCriteria: { skillMatch: 0.7 },
      participants: [
        { userId: 'u1', role: 'need_owner', opportunityId: 'need-lit' },
        { userId: 'u2', role: 'offer_provider', opportunityId: 'offer-lit' },
      ],
    })
    const accept = stack.service.acceptPostMatch('pm-discovered', 'user-need')
    const decline = stack.service.declinePostMatch('pm-discovered', 'user-offer')
    const confirm = stack.service.confirmPostMatch('pm-discovered')
    const expire = stack.service.expirePostMatch('pm-discovered', 'ttl')
    const supersede = stack.service.supersedePostMatch(
      'pm-discovered',
      'pm-replacement',
      'score',
    )

    assert.equal(discover.commandType, 'DiscoverPostMatch')
    assert.equal(accept.commandType, 'AcceptPostMatch')
    assert.equal(decline.commandType, 'DeclinePostMatch')
    assert.equal(confirm.commandType, 'ConfirmPostMatch')
    assert.equal(expire.commandType, 'ExpirePostMatch')
    assert.equal(supersede.commandType, 'SupersedePostMatch')
  })

  it('can confirm after quorum via accept calls', () => {
    const first = stack.service.acceptPostMatch('pm-discovered', 'user-need')
    assert.equal(first.success, true)

    const second = stack.service.acceptPostMatch('pm-discovered', 'user-offer')
    assert.equal(second.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'confirmed',
    )

    const explicitConfirm = stack.service.confirmPostMatch('pm-discovered')
    assert.equal(explicitConfirm.success, false)
    assert.ok(
      explicitConfirm.errors?.some(
        (error) =>
          error.includes('terminal state') ||
          error.includes('requires status accepted'),
      ),
    )
  })
})
