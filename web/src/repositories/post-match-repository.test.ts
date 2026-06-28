import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import {
  PostMatchRepository,
  isBlockingDiscoverDuplicateStatus,
} from '@/repositories/post-match-repository.ts'

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

function seedMatch(overrides: Partial<PostMatch> & Pick<PostMatch, 'id'>): PostMatch {
  return {
    matchType: 'one_way',
    status: 'discovered',
    matchScore: 0.9,
    participants: [],
    ...overrides,
  }
}

describe('PostMatchRepository duplicate detection', () => {
  it('findActiveDuplicateByStrongKey blocks discovered and accepted matches', () => {
    const storage = new MemoryStorageAdapter()
    const repo = new PostMatchRepository(storage, () => [
      seedMatch({
        id: 'pm-active',
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
        status: 'discovered',
      }),
      seedMatch({
        id: 'pm-declined',
        needOpportunityId: 'need-2',
        offerOpportunityId: 'offer-2',
        status: 'declined',
      }),
    ])

    const dup = repo.findActiveDuplicateByStrongKey('one_way:need-1:offer-1')
    assert.equal(dup?.id, 'pm-active')

    const allowed = repo.findActiveDuplicateByStrongKey('one_way:need-2:offer-2')
    assert.equal(allowed, undefined)
  })

  it('dedupes two_way by ordered side keys', () => {
    const storage = new MemoryStorageAdapter()
    const repo = new PostMatchRepository(storage, () => [
      seedMatch({
        id: 'pm-barter',
        matchType: 'two_way',
        payload: {
          sideA: { userId: 'u1', needId: 'n1', offerId: 'o1' },
          sideB: { userId: 'u2', needId: 'n2', offerId: 'o2' },
        },
      }),
    ])

    const dup = repo.findActiveDuplicateByStrongKey('two_way:n1:o1|n2:o2')
    assert.equal(dup?.id, 'pm-barter')
  })

  it('getByOpportunity indexes consortium lead and member offers', () => {
    const storage = new MemoryStorageAdapter()
    const repo = new PostMatchRepository(storage, () => [
      seedMatch({
        id: 'pm-consortium',
        matchType: 'consortium',
        payload: {
          leadNeedId: 'lead-1',
          roles: [{ role: 'Architect', opportunityId: 'opp-arch', userId: 'u2' }],
        },
      }),
    ])

    assert.equal(repo.getByOpportunity('lead-1').length, 1)
    assert.equal(repo.getByOpportunity('opp-arch').length, 1)
    assert.equal(repo.getByOpportunity('missing').length, 0)
  })

  it('isBlockingDiscoverDuplicateStatus follows lifecycle canonical names', () => {
    assert.equal(isBlockingDiscoverDuplicateStatus('discovered'), true)
    assert.equal(isBlockingDiscoverDuplicateStatus('accepted'), true)
    assert.equal(isBlockingDiscoverDuplicateStatus('pending'), true)
    assert.equal(isBlockingDiscoverDuplicateStatus('declined'), false)
  })
})
