import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  normalizeReadinessScorePercent,
  resolveReadinessCompletionLevel,
  resolveReadinessScoreDisplay,
} from '@/components/ui/pm-readiness-score-display'

describe('normalizeReadinessScorePercent', () => {
  it('clamps and rounds scores', () => {
    assert.equal(normalizeReadinessScorePercent(92.4), 92)
    assert.equal(normalizeReadinessScorePercent(150), 100)
    assert.equal(normalizeReadinessScorePercent(-5), 0)
  })
})

describe('resolveReadinessCompletionLevel', () => {
  it('maps score tiers correctly', () => {
    assert.equal(resolveReadinessCompletionLevel(95), 'ready')
    assert.equal(resolveReadinessCompletionLevel(85), 'good')
    assert.equal(resolveReadinessCompletionLevel(75), 'needs_improvement')
    assert.equal(resolveReadinessCompletionLevel(55), 'incomplete')
  })
})

describe('resolveReadinessScoreDisplay', () => {
  it('returns semantic tone and label', () => {
    const display = resolveReadinessScoreDisplay(91)
    assert.equal(display.percent, 91)
    assert.equal(display.level, 'ready')
    assert.equal(display.label, 'Ready to publish')
    assert.equal(display.tone, 'success')
  })

  it('maps incomplete tier to danger tone', () => {
    assert.equal(resolveReadinessScoreDisplay(65).tone, 'danger')
    assert.equal(resolveReadinessScoreDisplay(65).label, 'Incomplete')
  })
})
