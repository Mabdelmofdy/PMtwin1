import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Application, AuditEntry } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { ApplicationRepository } from '@/repositories/application-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { resolveTestAdminActor } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { InMemoryIdempotencyStore } from '@/commands/idempotency/InMemoryIdempotencyStore.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
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

const seedApplications: Application[] = [
  {
    id: 'app-pending',
    opportunityId: 'opp-1',
    applicantId: 'user-1',
    status: 'pending',
  },
  {
    id: 'app-reviewing',
    opportunityId: 'opp-1',
    applicantId: 'user-2',
    status: 'reviewing',
  },
  {
    id: 'app-accepted',
    opportunityId: 'opp-1',
    applicantId: 'user-3',
    status: 'accepted',
  },
]

function createTestStack() {
  const storage = new MemoryStorageAdapter()
  const loadApplications = () => seedApplications
  const loadAuditLog = (): AuditEntry[] => []
  const applicationRepository = new ApplicationRepository(
    storage,
    loadApplications,
  )
  const auditRepository = new AuditRepository(storage, loadAuditLog)
  const handler = new ApplicationCommandHandler({
    applicationRepository,
    auditRepository,
  })
  const postMatchRepository = new PostMatchRepository(storage, () => [])
  const opportunityHandler = new OpportunityCommandHandler({
    opportunityRepository: new OpportunityRepository(storage, () => []),
    auditRepository,
  })
  const postMatchHandler = new PostMatchCommandHandler({
    postMatchRepository,
    auditRepository,
  })
  const negotiationHandler = new NegotiationCommandHandler({
    negotiationRepository: new NegotiationRepository(storage, () => []),
    postMatchRepository,
    auditRepository,
  })
  const dealHandler = new DealCommandHandler({
    dealRepository: new DealRepository(storage, () => []),
    negotiationRepository: new NegotiationRepository(storage, () => []),
    postMatchRepository,
    auditRepository,
  })
  const contractHandler = new ContractCommandHandler({
    contractRepository: new ContractRepository(storage, () => []),
    dealRepository: new DealRepository(storage, () => []),
    opportunityRepository: new OpportunityRepository(storage, () => []),
    postMatchRepository,
    auditRepository,
  })
  const idempotencyStore = new InMemoryIdempotencyStore()
  const gateway = new DefaultCommandGateway({
    applicationHandler: handler,
    opportunityHandler,
    postMatchHandler,
    negotiationHandler,
    dealHandler,
    contractHandler,
    idempotencyStore,
    resolveCommandPermissionActor: resolveTestAdminActor,
  })

  return {
    storage,
    applicationRepository,
    auditRepository,
    gateway,
    idempotencyStore,
  }
}

describe('ApplicationCommandHandler', () => {
  let stack = createTestStack()

  beforeEach(() => {
    stack = createTestStack()
  })

  it('allows a valid transition from reviewing to shortlisted', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionApplicationStatus',
      aggregateId: 'app-reviewing',
      clientRequestId: 'req-valid-transition',
      targetStatus: 'shortlisted',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.applicationRepository.getById('app-reviewing')?.status,
      'shortlisted',
    )
  })

  it('rejects an invalid transition from pending to accepted', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionApplicationStatus',
      aggregateId: 'app-pending',
      clientRequestId: 'req-invalid-transition',
      targetStatus: 'accepted',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not allowed')))
    assert.equal(
      stack.applicationRepository.getById('app-pending')?.status,
      'pending',
    )
  })

  it('deduplicates commands using the idempotency store', () => {
    const command = {
      commandType: 'TransitionApplicationStatus' as const,
      aggregateId: 'app-reviewing',
      clientRequestId: 'req-duplicate',
      targetStatus: 'shortlisted',
    }

    const first = stack.gateway.execute(command)
    assert.equal(first.success, true)

    stack.applicationRepository.update('app-reviewing', { status: 'reviewing' })

    const second = stack.gateway.execute(command)
    assert.deepEqual(second, first)
    assert.equal(
      stack.applicationRepository.getById('app-reviewing')?.status,
      'reviewing',
    )
  })

  it('returns an error when the application is missing', () => {
    const result = stack.gateway.execute({
      commandType: 'RejectApplication',
      aggregateId: 'app-missing',
      clientRequestId: 'req-missing',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not found')))
  })

  it('rejects transitions from a terminal application state', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionApplicationStatus',
      aggregateId: 'app-accepted',
      clientRequestId: 'req-terminal',
      targetStatus: 'reviewing',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('terminal state')),
    )
    assert.equal(
      stack.applicationRepository.getById('app-accepted')?.status,
      'accepted',
    )
  })
})
