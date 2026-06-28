import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateReadinessAdjustment,
  ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT,
} from '@/domain/matching-readiness-adjustment/matching-readiness-adjustment.ts'

function input(
  readiness: number,
  baseScore = 75,
): Parameters<typeof calculateReadinessAdjustment>[0] {
  return {
    baseScore,
    sourceProfileReadiness: readiness,
    targetProfileReadiness: readiness,
    sourceOpportunityReadiness: readiness,
    targetOpportunityReadiness: readiness,
  }
}

describe('calculateReadinessAdjustment', () => {
  it('applies +5 bonus when average readiness is >= 90', () => {
    const result = calculateReadinessAdjustment(input(92))

    assert.equal(result.adjustment, 5)
    assert.equal(result.adjustedScore, 80)
    assert.equal(result.factors.averageReadiness, 92)
  })

  it('applies +3 bonus when average readiness is >= 80', () => {
    const result = calculateReadinessAdjustment(input(85))

    assert.equal(result.adjustment, 3)
    assert.equal(result.adjustedScore, 78)
    assert.equal(result.factors.averageReadiness, 85)
  })

  it('applies no change when average readiness is >= 70', () => {
    const result = calculateReadinessAdjustment(input(75))

    assert.equal(result.adjustment, 0)
    assert.equal(result.adjustedScore, 75)
    assert.equal(result.reason, 'Average readiness 75: no adjustment (tier >= 70)')
  })

  it('applies -5 penalty when average readiness is < 70', () => {
    const result = calculateReadinessAdjustment(input(65))

    assert.equal(result.adjustment, -5)
    assert.equal(result.adjustedScore, 70)
    assert.equal(result.factors.averageReadiness, 65)
  })

  it('applies -10 penalty when average readiness is < 60', () => {
    const result = calculateReadinessAdjustment(input(55))

    assert.equal(result.adjustment, -10)
    assert.equal(result.adjustedScore, 65)
    assert.equal(result.factors.averageReadiness, 55)
  })

  it('clamps adjusted score at 100', () => {
    const result = calculateReadinessAdjustment(input(95, 98))

    assert.equal(result.adjustment, 5)
    assert.equal(result.adjustedScore, 100)
  })

  it('clamps adjusted score at 0', () => {
    const result = calculateReadinessAdjustment(input(50, 4))

    assert.equal(result.adjustment, -10)
    assert.equal(result.adjustedScore, 0)
  })

  it('keeps feature flag disabled by default', () => {
    assert.equal(ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT, false)
  })

  it('returns transparent factors and reason', () => {
    const result = calculateReadinessAdjustment({
      baseScore: 80,
      sourceProfileReadiness: 90,
      targetProfileReadiness: 70,
      sourceOpportunityReadiness: 85,
      targetOpportunityReadiness: 75,
    })

    assert.deepEqual(result.factors, {
      sourceProfileScore: 90,
      targetProfileScore: 70,
      sourceOpportunityScore: 85,
      targetOpportunityScore: 75,
      averageReadiness: 80,
    })
    assert.equal(result.adjustment, 3)
    assert.equal(result.reason, 'Average readiness 80: +3 bonus (tier >= 80)')
    assert.equal(result.baseScore, 80)
    assert.equal(result.adjustedScore, 83)
  })
})
