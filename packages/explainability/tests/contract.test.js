import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXPLANATION_BUNDLE_KEYS,
  EXPLANATION_SEVERITY,
  HEALTH,
  isExplanationBundle,
} from '../dist/index.js'
import { createSampleExplanationBundle } from './fixtures.js'

describe('ExplanationBundle contract shape', () => {
  it('accepts a canonical bundle fixture', () => {
    const bundle = createSampleExplanationBundle()
    assert.equal(isExplanationBundle(bundle), true)
  })

  it('exposes the required top-level keys', () => {
    assert.deepEqual(EXPLANATION_BUNDLE_KEYS, [
      'engine',
      'entityId',
      'score',
      'health',
      'summary',
      'scoreBreakdown',
      'reasons',
      'blockers',
      'strengths',
      'weaknesses',
      'recommendations',
      'timeline',
      'metadata',
    ])
  })

  it('rejects malformed bundles', () => {
    assert.equal(isExplanationBundle(null), false)
    assert.equal(isExplanationBundle({}), false)
    assert.equal(
      isExplanationBundle({
        ...createSampleExplanationBundle(),
        health: 'unknown',
      }),
      false,
    )
    assert.equal(
      isExplanationBundle({
        ...createSampleExplanationBundle(),
        reasons: [
          {
            code: 'FREE_FORM_REASON',
            message: 'invalid',
            severity: EXPLANATION_SEVERITY.INFO,
          },
        ],
      }),
      false,
    )
  })

  it('validates health enum values', () => {
    assert.deepEqual(Object.values(HEALTH), [
      'excellent',
      'good',
      'warning',
      'critical',
    ])
  })
})
