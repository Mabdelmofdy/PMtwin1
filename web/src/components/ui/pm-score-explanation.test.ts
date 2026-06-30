import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMatchExplanationLines,
  buildReadinessExplanationLines,
  formatMatchBreakdownLines,
  hasMatchExplanation,
  hasReadinessExplanation,
} from '@/components/ui/pm-score-explanation'
import { resolveMatchScoreDisplay } from '@/components/ui/pm-match-score-display'
import { resolveReadinessScoreDisplay } from '@/components/ui/pm-readiness-score-display'

describe('formatMatchBreakdownLines', () => {
  it('formats known breakdown keys as percents', () => {
    assert.deepEqual(formatMatchBreakdownLines({ skillMatch: 0.92, timelineFit: 0.75 }), [
      'Skills: 92%',
      'Timeline: 75%',
    ])
  })
})

describe('hasReadinessExplanation', () => {
  it('returns true when gaps exist', () => {
    assert.equal(hasReadinessExplanation({ missingRequired: ['Title'] }), true)
  })
})

describe('hasMatchExplanation', () => {
  it('returns true when breakdown exists', () => {
    assert.equal(hasMatchExplanation({ skillMatch: 0.8 }), true)
  })
})

describe('buildReadinessExplanationLines', () => {
  it('includes gap fields when provided', () => {
    const display = resolveReadinessScoreDisplay(65)
    const lines = buildReadinessExplanationLines(display, {
      missingRequired: ['Location'],
    })
    assert.ok(lines.includes('Required: Location'))
  })
})

describe('buildMatchExplanationLines', () => {
  it('includes breakdown lines when provided', () => {
    const display = resolveMatchScoreDisplay(0.88)
    const lines = buildMatchExplanationLines(display, { skillMatch: 0.9 })
    assert.ok(lines.some((line) => line.startsWith('Skills:')))
  })
})
