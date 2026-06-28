import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { toCanonicalIntent } from '@/domain/intent.ts'
import { normalizeOpportunity, normalizePostMatch } from '@/domain/normalized/adapters.ts'
import type { PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'

describe('toCanonicalIntent', () => {
  it('normalizes request to need', () => {
    assert.equal(toCanonicalIntent('request'), 'need')
    assert.equal(toCanonicalIntent('REQUEST'), 'need')
  })

  it('keeps need as need', () => {
    assert.equal(toCanonicalIntent('need'), 'need')
  })

  it('keeps offer as offer', () => {
    assert.equal(toCanonicalIntent('offer'), 'offer')
  })

  it('keeps hybrid as hybrid', () => {
    assert.equal(toCanonicalIntent('hybrid'), 'hybrid')
  })

  it('returns undefined for empty or unknown values', () => {
    assert.equal(toCanonicalIntent(undefined), undefined)
    assert.equal(toCanonicalIntent(''), undefined)
    assert.equal(toCanonicalIntent('unknown'), undefined)
  })
})

describe('normalizeOpportunity intent', () => {
  it('reads request as canonical need without mutating stored shape', () => {
    const raw = { id: 'opp-1', title: 'Need opp', intent: 'request', status: 'published' }
    const normalized = normalizeOpportunity(raw)
    assert.equal(normalized.intent, 'need')
    assert.equal(raw.intent, 'request')
  })

  it('keeps canonical need and offer', () => {
    assert.equal(normalizeOpportunity({ id: '1', intent: 'need' }).intent, 'need')
    assert.equal(normalizeOpportunity({ id: '2', intent: 'offer' }).intent, 'offer')
  })
})

describe('normalizePostMatch one_way fields', () => {
  it('reads top-level needOpportunityId and offerOpportunityId', () => {
    const normalized = normalizePostMatch({
      id: 'pm-1',
      matchType: 'one_way',
      matchScore: 0.9,
      needOpportunityId: 'need-top',
      offerOpportunityId: 'offer-top',
      participants: [],
    })
    assert.equal(normalized.needOpportunityId, 'need-top')
    assert.equal(normalized.offerOpportunityId, 'offer-top')
  })

  it('falls back to payload needOpportunityId and offerOpportunityId', () => {
    const normalized = normalizePostMatch({
      id: 'pm-2',
      matchType: 'one_way',
      matchScore: 0.8,
      participants: [],
      payload: {
        needOpportunityId: 'need-payload',
        offerOpportunityId: 'offer-payload',
      },
    })
    assert.equal(normalized.needOpportunityId, 'need-payload')
    assert.equal(normalized.offerOpportunityId, 'offer-payload')
    assert.equal(normalized.payload?.needOpportunityId, 'need-payload')
    assert.equal(normalized.payload?.offerOpportunityId, 'offer-payload')
  })

  it('prefers top-level FKs over payload', () => {
    const normalized = normalizePostMatch({
      id: 'pm-3',
      matchType: 'one_way',
      matchScore: 0.7,
      needOpportunityId: 'need-top',
      offerOpportunityId: 'offer-top',
      participants: [],
      payload: {
        needOpportunityId: 'need-payload',
        offerOpportunityId: 'offer-payload',
      },
    })
    assert.equal(normalized.needOpportunityId, 'need-top')
    assert.equal(normalized.offerOpportunityId, 'offer-top')
    assert.equal(normalized.payload?.needOpportunityId, 'need-payload')
  })

  it('falls back matchCriteria from payload.breakdown', () => {
    const breakdown = { skillMatch: 1, budgetFit: 0.8 }
    const normalized = normalizePostMatch({
      id: 'pm-4',
      matchType: 'one_way',
      matchScore: 0.95,
      participants: [],
      payload: {
        needOpportunityId: 'n1',
        offerOpportunityId: 'o1',
        breakdown,
      },
    })
    assert.deepEqual(normalized.matchCriteria, breakdown)
    assert.deepEqual(normalized.payload?.breakdown, breakdown)
  })

  it('prefers top-level matchCriteria over payload.breakdown', () => {
    const top = { skillMatch: 0.5 }
    const payload = { skillMatch: 1, budgetFit: 0.8 }
    const normalized = normalizePostMatch({
      id: 'pm-5',
      matchType: 'one_way',
      matchScore: 0.6,
      matchCriteria: top,
      participants: [],
      payload: {
        needOpportunityId: 'n1',
        offerOpportunityId: 'o1',
        breakdown: payload,
      },
    })
    assert.deepEqual(normalized.matchCriteria, top)
    assert.deepEqual(normalized.payload?.breakdown, payload)
  })
})

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

describe('PostMatchRepository', () => {
  const seed: PostMatch[] = [
    {
      id: 'pm-repo-1',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.9,
      participants: [
        { userId: 'u1', role: 'need_owner', opportunityId: 'need-1' },
        { userId: 'u2', role: 'offer_provider', opportunityId: 'offer-1' },
      ],
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    },
    {
      id: 'pm-repo-2',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.85,
      needOpportunityId: 'need-2',
      offerOpportunityId: 'offer-2',
      participants: [
        { userId: 'u3', role: 'need_owner', opportunityId: 'need-2' },
        { userId: 'u4', role: 'offer_provider', opportunityId: 'offer-2' },
      ],
    },
  ]

  it('reads from postMatches namespace only (not applications)', () => {
    const storage = new MemoryStorageAdapter()
    storage.set('pmtwin_web_overrides', {
      applications: { 'app-1': { status: 'accepted' } },
      postMatches: {
        'pm-repo-1': { status: 'confirmed' },
      },
    })

    const repo = new PostMatchRepository(storage, () => seed)
    const all = repo.getAll()
    assert.equal(all.length, 2)
    const patched = all.find((m) => m.id === 'pm-repo-1')
    assert.equal(patched?.status, 'confirmed')
    const untouched = all.find((m) => m.id === 'pm-repo-2')
    assert.equal(untouched?.status, 'discovered')
  })

  it('getByOpportunity resolves payload and top-level FKs', () => {
    const repo = new PostMatchRepository(new MemoryStorageAdapter(), () => seed)
    assert.equal(repo.getByOpportunity('need-1').length, 1)
    assert.equal(repo.getByOpportunity('offer-2').length, 1)
    assert.equal(repo.getByOpportunity('missing').length, 0)
  })
})
