import { describe, expect, it } from 'vitest'
import {
  normalizeMatchScorePercent,
  resolveMatchCompatibilityLevel,
  resolveMatchScoreDisplay,
} from '@/components/ui/pm-match-score-display'

describe('normalizeMatchScorePercent', () => {
  it('converts fractional scores to percent', () => {
    expect(normalizeMatchScorePercent(0.92)).toBe(92)
    expect(normalizeMatchScorePercent(0.755)).toBe(76)
  })

  it('passes through whole-number percentages', () => {
    expect(normalizeMatchScorePercent(85)).toBe(85)
  })
})

describe('resolveMatchCompatibilityLevel', () => {
  it('maps score tiers correctly', () => {
    expect(resolveMatchCompatibilityLevel(95)).toBe('excellent')
    expect(resolveMatchCompatibilityLevel(80)).toBe('strong')
    expect(resolveMatchCompatibilityLevel(65)).toBe('good')
    expect(resolveMatchCompatibilityLevel(50)).toBe('weak')
    expect(resolveMatchCompatibilityLevel(25)).toBe('poor')
  })
})

describe('resolveMatchScoreDisplay', () => {
  it('returns semantic tone and label for fractional input', () => {
    const display = resolveMatchScoreDisplay(0.91)
    expect(display.percent).toBe(91)
    expect(display.level).toBe('excellent')
    expect(display.label).toBe('Excellent Match')
    expect(display.tone).toBe('success')
  })

  it('maps weak and poor tiers to neutral and danger tones', () => {
    expect(resolveMatchScoreDisplay(0.45).tone).toBe('neutral')
    expect(resolveMatchScoreDisplay(0.3).tone).toBe('danger')
  })
})
