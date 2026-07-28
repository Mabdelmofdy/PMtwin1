import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  budgetCompatible,
  categoryOverlap,
  getCandidates,
  locationCompatible,
  timelineOverlap,
  withMatchingDefaults,
} from '../dist/index.js'

const config = withMatchingDefaults({ CANDIDATE_MAX: 3 })

describe('candidate generator — budget compatibility', () => {
  it('accepts overlapping budget ranges', () => {
    assert.equal(
      budgetCompatible({ budget: { min: 10000, max: 50000 } }, { budget: { min: 30000, max: 80000 } }),
      true,
    )
  })

  it('rejects disjoint budget ranges', () => {
    assert.equal(
      budgetCompatible({ budget: { min: 10000, max: 20000 } }, { budget: { min: 50000, max: 80000 } }),
      false,
    )
  })
})

describe('candidate generator — location compatibility', () => {
  it('treats remote as compatible with any location', () => {
    assert.equal(locationCompatible({ location: 'remote' }, { location: 'Riyadh' }), true)
  })

  it('does not hard-reject different cities (soft scoring only)', () => {
    assert.equal(locationCompatible({ location: 'Jeddah' }, { location: 'Riyadh' }), true)
    assert.equal(locationCompatible({ location: 'Riyadh' }, { location: 'Riyadh' }), true)
    assert.equal(locationCompatible({ location: 'Riyadh' }, { location: 'Dammam' }), true)
  })
})

describe('candidate generator — timeline overlap', () => {
  it('rejects when offer starts after need ends', () => {
    assert.equal(
      timelineOverlap(
        { deadline: '2026-06-01' },
        { availability: { start: '2026-07-01' } },
      ),
      false,
    )
  })

  it('accepts overlapping timelines', () => {
    assert.equal(
      timelineOverlap(
        { timeline: { start: '2026-01-01', end: '2026-12-31' } },
        { availability: { start: '2026-06-01', end: '2027-06-01' } },
      ),
      true,
    )
  })
})

describe('candidate generator — category overlap', () => {
  it('requires shared model type or category', () => {
    assert.equal(
      categoryOverlap({ modelType: 'project_based' }, { modelType: 'hiring' }),
      false,
    )
    assert.equal(
      categoryOverlap({ modelType: 'project_based' }, { modelType: 'project_based' }),
      true,
    )
  })
})

describe('candidate generator — candidate max', () => {
  it('returns at most maxCandidates published offers', () => {
    const need = {
      id: 'need-1',
      creatorId: 'user-a',
      intent: 'request',
      status: 'published',
      normalized: {
        role: 'Architect',
        requiredServices: ['BIM'],
        modelType: 'project_based',
        location: 'remote',
      },
      attributes: { targetRole: 'Architect' },
    }

    const offers = Array.from({ length: 10 }, (_, index) => ({
      id: `offer-${index}`,
      creatorId: `user-${index + 1}`,
      intent: 'offer',
      status: 'published',
      normalized: {
        role: 'Architect',
        offeredServices: ['BIM'],
        modelType: 'project_based',
        location: 'remote',
      },
      attributes: { targetRole: 'Architect' },
    }))

    const result = getCandidates(need, offers, config, { maxCandidates: 3 })
    assert.equal(result.length, 3)
  })
})
