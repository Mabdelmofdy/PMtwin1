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

describe('scoring — location coverage hierarchy', () => {
  it('scores same city as full location fit', () => {
    const result = scorePair(need, offer, config)
    assert.equal(result.breakdown.locationFit, 1)
    assert.equal(result.breakdown.locationTier, 'same_city')
  })

  it('scores different SA cities without nationwide as same-country partial', () => {
    const dammamOffer = {
      ...offer,
      normalized: { ...offer.normalized, location: 'Dammam', coverageScopes: [] },
    }
    const result = scorePair(need, dammamOffer, config)
    assert.equal(result.breakdown.locationFit, 0.75)
    assert.equal(result.breakdown.locationTier, 'same_country')
    assert.ok(result.score >= 0.5, 'cross-city pair remains above threshold when other factors strong')
  })

  it('scores nationwide SA coverage vs different city as full location fit', () => {
    const nationwideNeed = {
      ...need,
      attributes: { serviceArea: 'Saudi Arabia', geographicScope: 'Saudi Arabia' },
      normalized: {
        ...need.normalized,
        location: 'Riyadh',
        coverageScopes: ['saudi arabia'],
      },
    }
    const dammamOffer = {
      ...offer,
      normalized: { ...offer.normalized, location: 'Dammam' },
    }
    const result = scorePair(nationwideNeed, dammamOffer, config)
    assert.equal(result.breakdown.locationFit, 1)
    assert.equal(result.breakdown.locationTier, 'nationwide')
  })

  it('scores remote as full location fit', () => {
    const remoteOffer = {
      ...offer,
      normalized: { ...offer.normalized, location: 'Remote' },
    }
    const result = scorePair(need, remoteOffer, config)
    assert.equal(result.breakdown.locationFit, 1)
    assert.equal(result.breakdown.locationTier, 'remote')
  })

  it('scores coverage overlap when offer covers need city from another HQ', () => {
    const dubaiOffer = {
      ...offer,
      location: 'Dubai',
      normalized: {
        ...offer.normalized,
        location: 'Dubai',
        coverageScopes: ['Riyadh', 'Riyadh City'],
      },
    }
    const result = scorePair(need, dubaiOffer, config)
    assert.equal(result.breakdown.locationFit, 1)
    assert.equal(result.breakdown.locationTier, 'coverage_overlap')
  })

  it('does not treat two GCC-wide posts as coverage_overlap', () => {
    const gccNeed = {
      ...need,
      location: 'Dubai',
      normalized: {
        ...need.normalized,
        location: 'Dubai',
        coverageScopes: ['gcc'],
      },
    }
    const gccOffer = {
      ...offer,
      location: 'Doha',
      normalized: {
        ...offer.normalized,
        location: 'Doha',
        coverageScopes: ['gcc'],
      },
    }
    const result = scorePair(gccNeed, gccOffer, config)
    assert.notEqual(result.breakdown.locationTier, 'coverage_overlap')
    assert.ok(
      result.breakdown.locationTier === 'regional_gcc'
        || result.breakdown.locationTier === 'different_gcc_country',
    )
  })

  it('scores Egypt as EG country rather than UNKNOWN weak fit vs another EG city', () => {
    const cairoNeed = {
      ...need,
      location: 'Cairo',
      normalized: { ...need.normalized, location: 'Cairo', coverageScopes: [] },
    }
    const alexOffer = {
      ...offer,
      location: 'Alexandria',
      normalized: {
        ...offer.normalized,
        location: 'Alexandria',
        coverageScopes: [],
      },
    }
    const result = scorePair(cairoNeed, alexOffer, config)
    assert.equal(result.breakdown.locationFit, 0.75)
    assert.equal(result.breakdown.locationTier, 'same_country')
  })

  it('scores different GCC countries lower without regional coverage', () => {
    const dubaiOffer = {
      ...offer,
      normalized: { ...offer.normalized, location: 'Dubai', coverageScopes: [] },
    }
    const result = scorePair(need, dubaiOffer, config)
    assert.equal(result.breakdown.locationFit, 0.5)
    assert.equal(result.breakdown.locationTier, 'different_gcc_country')
  })
})
