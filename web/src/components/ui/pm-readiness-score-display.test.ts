import { describe, expect, it } from 'vitest'
import {
  normalizeReadinessScorePercent,
  resolveReadinessCompletionLevel,
  resolveReadinessScoreDisplay,
} from '@/components/ui/pm-readiness-score-display'

describe('normalizeReadinessScorePercent', () => {
  it('clamps and rounds scores', () => {
    expect(normalizeReadinessScorePercent(92.4)).toBe(92)
    expect(normalizeReadinessScorePercent(150)).toBe(100)
    expect(normalizeReadinessScorePercent(-5)).toBe(0)
  })
})

describe('resolveReadinessCompletionLevel', () => {
  it('maps score tiers correctly', () => {
    expect(resolveReadinessCompletionLevel(95)).toBe('ready')
    expect(resolveReadinessCompletionLevel(85)).toBe('good')
    expect(resolveReadinessCompletionLevel(75)).toBe('needs_improvement')
    expect(resolveReadinessCompletionLevel(55)).toBe('incomplete')
  })
})

describe('resolveReadinessScoreDisplay', () => {
  it('returns semantic tone and label', () => {
    const display = resolveReadinessScoreDisplay(91)
    expect(display.percent).toBe(91)
    expect(display.level).toBe('ready')
    expect(display.label).toBe('Ready')
    expect(display.tone).toBe('success')
  })

  it('maps incomplete tier to danger tone', () => {
    expect(resolveReadinessScoreDisplay(65).tone).toBe('danger')
    expect(resolveReadinessScoreDisplay(65).label).toBe('Incomplete')
  })
})
