import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  findOffersForNeedPure,
  findBarterMatchesPure,
  findConsortiumMatchesPure,
  findCircularExchangesPure,
  MATCHING_REJECT_REASONS,
  withMatchingDefaults,
} from '../dist/index.js'

const config = withMatchingDefaults()

function needPost(overrides = {}) {
  return {
    id: 'need-1',
    creatorId: 'user-a',
    intent: 'request',
    status: 'published',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'cash', estimated_value: 100000 },
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM', 'Revit'],
      location: 'Riyadh',
      modelType: 'project_based',
      budget: { min: 50000, max: 150000 },
      timeline: { start: '2026-01-01', end: '2026-12-31' },
      reputation: 0.8,
    },
    ...overrides,
  }
}

function offerPost(overrides = {}) {
  return {
    id: 'offer-1',
    creatorId: 'user-b',
    intent: 'offer',
    status: 'published',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'cash', estimated_value: 95000 },
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM', 'Revit'],
      location: 'Riyadh',
      modelType: 'project_based',
      budget: { min: 80000, max: 120000 },
      availability: { start: '2026-02-01', end: '2026-11-30' },
      reputation: 0.9,
    },
    ...overrides,
  }
}

describe('one-way diagnostics', () => {
  it('records a matched candidate with location detail', () => {
    const result = findOffersForNeedPure(needPost(), [offerPost()], config)
    assert.equal(result.matches.length, 1)
    assert.ok(result.diagnostic)
    assert.equal(result.diagnostic.matchedCount, 1)
    assert.equal(result.diagnostic.candidates[0].result, 'matched')
    assert.equal(result.diagnostic.candidates[0].postMatchCreated, true)
    assert.ok(result.diagnostic.candidates[0].finalScore >= 0.5)
  })

  it('rejects when target role is missing with TARGET_ROLE_REQUIRED', () => {
    const noRoleOffer = offerPost({
      attributes: {},
      normalized: {
        ...offerPost().normalized,
        role: '',
      },
    })
    const result = findOffersForNeedPure(needPost(), [noRoleOffer], config)
    assert.equal(result.matches.length, 0)
    assert.equal(result.diagnostic.rejectedCount, 1)
    assert.equal(
      result.diagnostic.candidates[0].rejectReason,
      MATCHING_REJECT_REASONS.TARGET_ROLE_REQUIRED,
    )
    const roleCheck = result.diagnostic.candidates[0].checks.find((c) => c.id === 'target_role')
    assert.equal(roleCheck.status, 'fail')
  })

  it('does not use title as a substitute for target role', () => {
    const titledNoRole = offerPost({
      title: 'Architect for Riyadh tower',
      attributes: {},
      normalized: {
        ...offerPost().normalized,
        role: '',
      },
    })
    const result = findOffersForNeedPure(needPost(), [titledNoRole], config)
    assert.equal(result.matches.length, 0)
    assert.equal(
      result.diagnostic.candidates[0].rejectReason,
      MATCHING_REJECT_REASONS.TARGET_ROLE_REQUIRED,
    )
  })

  it('keeps Riyadh vs Dammam eligible and does not hard-reject', () => {
    const dammam = offerPost({
      id: 'offer-dammam',
      normalized: {
        ...offerPost().normalized,
        location: 'Dammam',
      },
    })
    const result = findOffersForNeedPure(needPost(), [dammam], config)
    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].breakdown.locationTier, 'same_country')
    assert.equal(result.matches[0].breakdown.locationFit, 0.75)
  })
})

describe('cross-model diagnostics parity', () => {
  const needA = {
    id: 'need-a',
    creatorId: 'user-a',
    intent: 'request',
    status: 'published',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'barter', estimated_value: 100000 },
    exchangeMode: 'barter',
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM'],
      location: 'Riyadh',
      modelType: 'barter',
    },
  }
  const offerA = {
    id: 'offer-a',
    creatorId: 'user-a',
    intent: 'offer',
    status: 'published',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'barter', estimated_value: 90000 },
    exchangeMode: 'barter',
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM'],
      location: 'Riyadh',
      modelType: 'barter',
    },
  }
  const needB = {
    id: 'need-b',
    creatorId: 'user-b',
    intent: 'request',
    status: 'published',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'barter', estimated_value: 100000 },
    exchangeMode: 'barter',
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM'],
      location: 'Dammam',
      modelType: 'barter',
    },
  }
  const offerB = {
    id: 'offer-b',
    creatorId: 'user-b',
    intent: 'offer',
    status: 'published',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'barter', estimated_value: 95000 },
    exchangeMode: 'barter',
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM'],
      location: 'Dammam',
      modelType: 'barter',
    },
  }

  it('two-way returns diagnostics and soft-scores different cities', () => {
    const result = findBarterMatchesPure(
      needA,
      [needA, needB],
      [offerA, offerB],
      config,
    )
    assert.ok(result.diagnostic)
    assert.ok(result.diagnostic.scannedCount >= 1)
    if (result.matches.length > 0) {
      assert.equal(result.matches[0].breakdown.locationFit, 0.75)
    }
  })

  it('consortium preserves diagnostics from one-way fallback', () => {
    const result = findConsortiumMatchesPure(needA, [offerB], config)
    assert.ok(result.diagnostic)
    assert.equal(typeof result.diagnostic.scannedCount, 'number')
  })

  it('circular returns diagnostics for need-offer edges', () => {
    const result = findCircularExchangesPure(
      [needA, needB],
      [offerA, offerB],
      config,
      {},
      { minCycleLength: 3 },
    )
    assert.ok(result.diagnostic)
    assert.ok(result.diagnostic.scannedCount >= 1)
  })
})
