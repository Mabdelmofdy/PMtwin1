import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  labelFromScore,
  scorePair,
  withMatchingDefaults,
} from '../dist/index.js'

const config = withMatchingDefaults()

const need = {
  id: 'need-1',
  intent: 'request',
  value_exchange: { mode: 'cash', estimated_value: 100000 },
  normalized: {
    role: 'Architect',
    requiredServices: ['BIM', 'Revit'],
    location: 'Riyadh',
    budget: { min: 50000, max: 150000 },
    timeline: { start: '2026-01-01', end: '2026-12-31' },
    reputation: 0.8,
  },
}

const offer = {
  id: 'offer-1',
  intent: 'offer',
  value_exchange: { mode: 'cash', estimated_value: 95000 },
  normalized: {
    role: 'Architect',
    offeredServices: ['BIM', 'Revit'],
    location: 'Riyadh',
    budget: { min: 80000, max: 120000 },
    availability: { start: '2026-02-01', end: '2026-11-30' },
    reputation: 0.9,
  },
}

describe('scoring — labelFromScore', () => {
  it('maps scores to Match, Partial, and No Match', () => {
    assert.equal(labelFromScore(1), 'Match')
    assert.equal(labelFromScore(0.5), 'Partial')
    assert.equal(labelFromScore(0.1), 'No Match')
  })
})

describe('scoring — scorePair deterministic breakdown', () => {
  it('returns stable score and breakdown for the same inputs', () => {
    const first = scorePair(need, offer, config)
    const second = scorePair(need, offer, config)
    assert.deepEqual(first, second)
    assert.ok(first.score > 0)
    assert.equal(typeof first.breakdown.skillMatch, 'number')
    assert.equal(typeof first.breakdown.budgetFit, 'number')
    assert.equal(first.labels.skillMatch, 'Match')
  })
})

describe('scoring — low skill score rejected', () => {
  it('returns zero score when skill overlap is below floor', () => {
    const weakOffer = {
      ...offer,
      normalized: {
        ...offer.normalized,
        offeredServices: ['SketchUp'],
        skills: ['SketchUp'],
      },
    }
    const result = scorePair(need, weakOffer, config)
    assert.equal(result.score, 0)
    assert.equal(result.breakdown.rejected, 'skill_floor')
  })
})
