import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  normalizeMatchScorePercent,
  resolveMatchCompatibilityLevel,
  resolveMatchScoreDisplay,
} from '@/components/ui/pm-match-score-display'

describe('normalizeMatchScorePercent', () => {
  it('converts fractional scores to percent', () => {
    assert.equal(normalizeMatchScorePercent(0.92), 92)
    assert.equal(normalizeMatchScorePercent(0.755), 76)
  })

  it('passes through whole-number percentages', () => {
    assert.equal(normalizeMatchScorePercent(85), 85)
  })
})

describe('resolveMatchCompatibilityLevel', () => {
  it('maps score tiers correctly', () => {
    assert.equal(resolveMatchCompatibilityLevel(95), 'excellent')
    assert.equal(resolveMatchCompatibilityLevel(80), 'strong')
    assert.equal(resolveMatchCompatibilityLevel(65), 'good')
    assert.equal(resolveMatchCompatibilityLevel(50), 'weak')
    assert.equal(resolveMatchCompatibilityLevel(25), 'poor')
  })
})

describe('resolveMatchScoreDisplay', () => {
  it('returns semantic tone and label for fractional input', () => {
    const display = resolveMatchScoreDisplay(0.91)
    assert.equal(display.percent, 91)
    assert.equal(display.level, 'excellent')
    assert.equal(display.label, 'Excellent Match')
    assert.equal(display.tone, 'success')
  })

  it('maps weak and poor tiers to neutral and danger tones', () => {
    assert.equal(resolveMatchScoreDisplay(0.45).tone, 'neutral')
    assert.equal(resolveMatchScoreDisplay(0.3).tone, 'danger')
  })
})
