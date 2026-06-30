import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildScoreAriaLabel,
  buildScoreRegionLabel,
} from '@/components/ui/pm-score-a11y'

describe('buildScoreAriaLabel', () => {
  it('joins explanation lines for assistive tech', () => {
    assert.equal(
      buildScoreAriaLabel(['85% readiness', 'Completion tier: Good']),
      '85% readiness. Completion tier: Good',
    )
  })
})

describe('buildScoreRegionLabel', () => {
  it('prefixes readiness hero regions', () => {
    assert.match(
      buildScoreRegionLabel('readiness', ['72% readiness']),
      /^Opportunity readiness/,
    )
  })
})
