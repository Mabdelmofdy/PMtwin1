import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  barterValueEquivalence,
  oneWayValueFit,
} from '../dist/index.js'

describe('value compatibility — one-way value fit', () => {
  it('reports strong fit when offer value is within 20% of need', () => {
    const need = {
      value_exchange: {
        _normalized: {
          totalOffered: 0,
          totalExpected: 100000,
          riskAdjustedOffered: 0,
          riskAdjustedExpected: 100000,
        },
      },
    }
    const offer = {
      value_exchange: {
        _normalized: {
          totalOffered: 105000,
          totalExpected: 105000,
          riskAdjustedOffered: 105000,
          riskAdjustedExpected: 105000,
        },
      },
    }
    const fit = oneWayValueFit(need, offer)
    assert.equal(fit.valueFit, 'strong')
    assert.ok(fit.coverageRatio >= 0.8)
  })

  it('reports weak fit when offer value is far below need', () => {
    const need = {
      value_exchange: {
        _normalized: {
          totalOffered: 0,
          totalExpected: 100000,
          riskAdjustedOffered: 0,
          riskAdjustedExpected: 100000,
        },
      },
    }
    const offer = {
      value_exchange: {
        _normalized: {
          totalOffered: 20000,
          totalExpected: 20000,
          riskAdjustedOffered: 20000,
          riskAdjustedExpected: 20000,
        },
      },
    }
    const fit = oneWayValueFit(need, offer)
    assert.equal(fit.valueFit, 'weak')
  })
})

describe('value compatibility — barter value equivalence', () => {
  it('scores balanced barter sides highly', () => {
    const sideA = {
      value_exchange: {
        _normalized: {
          totalOffered: 100000,
          totalExpected: 100000,
          riskAdjustedOffered: 100000,
          riskAdjustedExpected: 100000,
        },
      },
    }
    const sideB = {
      value_exchange: {
        _normalized: {
          totalOffered: 100000,
          totalExpected: 100000,
          riskAdjustedOffered: 100000,
          riskAdjustedExpected: 100000,
        },
      },
    }
    const result = barterValueEquivalence(sideA, sideB)
    assert.ok(result.equivalenceScore >= 0.9)
    assert.equal(result.gapA, 0)
    assert.equal(result.gapB, 0)
  })

  it('flags cash adjustment when one side under-delivers', () => {
    const sideA = {
      value_exchange: {
        _normalized: {
          totalOffered: 50000,
          totalExpected: 100000,
          riskAdjustedOffered: 50000,
          riskAdjustedExpected: 100000,
        },
      },
    }
    const sideB = {
      value_exchange: {
        _normalized: {
          totalOffered: 100000,
          totalExpected: 100000,
          riskAdjustedOffered: 100000,
          riskAdjustedExpected: 100000,
        },
      },
    }
    const result = barterValueEquivalence(sideA, sideB)
    assert.ok(result.gapB > 0)
    assert.match(result.suggestion, /Cash adjustment needed/)
  })
})
