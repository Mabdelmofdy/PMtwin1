import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PUBLISH_READINESS_BLOCKED_CODE,
  PUBLISH_READINESS_BLOCKED_MESSAGE,
} from '@/domain/publish-readiness/index.ts'
import { buildPublishSuccessFeedback } from '@/lib/publish-opportunity-feedback.ts'
import { publishOpportunityUiAction } from '@/lib/publish-opportunity-ui-actions.ts'
import type { PublishSuccessResult } from '@/lib/publish-opportunity-feedback.ts'

function successResult(
  overrides: Partial<PublishSuccessResult> = {},
): PublishSuccessResult {
  return {
    success: true,
    published: true,
    discoveredMatchesCount: 0,
    skippedDuplicatesCount: 0,
    matchingErrors: [],
    ...overrides,
  }
}

describe('buildPublishSuccessFeedback', () => {
  it('shows match count when matches were discovered', () => {
    const feedback = buildPublishSuccessFeedback(
      successResult({ discoveredMatchesCount: 3 }),
    )

    assert.equal(feedback.variant, 'success')
    assert.match(feedback.message, /3 related matches discovered/)
    assert.equal(feedback.shouldHighlightRelatedMatches, true)
  })

  it('shows no-match message when none were discovered', () => {
    const feedback = buildPublishSuccessFeedback(successResult())

    assert.equal(feedback.variant, 'success')
    assert.equal(feedback.message, 'Opportunity published. No matches found yet.')
    assert.equal(feedback.shouldHighlightRelatedMatches, false)
  })

  it('includes duplicate skip message', () => {
    const feedback = buildPublishSuccessFeedback(
      successResult({
        discoveredMatchesCount: 1,
        skippedDuplicatesCount: 2,
      }),
    )

    assert.match(feedback.message, /1 related match discovered/)
    assert.match(feedback.message, /2 duplicate matches skipped/)
  })

  it('shows warning when partial matching errors exist but publish succeeded', () => {
    const feedback = buildPublishSuccessFeedback(
      successResult({
        discoveredMatchesCount: 1,
        matchingErrors: ['DiscoverPostMatch failed for pm-2'],
      }),
    )

    assert.equal(feedback.variant, 'warning')
    assert.equal(
      feedback.message,
      'Published, but some matching results could not be saved.',
    )
    assert.match(feedback.description ?? '', /1 related match discovered/)
    assert.equal(feedback.shouldHighlightRelatedMatches, true)
  })

  it('uses singular match labels for count of one', () => {
    const feedback = buildPublishSuccessFeedback(
      successResult({
        discoveredMatchesCount: 1,
        skippedDuplicatesCount: 1,
      }),
    )

    assert.match(feedback.message, /1 related match discovered/)
    assert.match(feedback.message, /1 duplicate match skipped/)
  })
})

describe('publishOpportunityUiAction — blocked feedback unchanged', () => {
  it('keeps readiness blocked message and details', () => {
    const result = publishOpportunityUiAction(
      'opp-blocked',
      {
        profile: {},
        profileKind: 'individual',
        opportunity: { title: 'Sparse', intent: 'need', status: 'draft' },
      },
      {
        transitionOpportunityStatus: () => ({
          success: true,
          aggregateId: 'opp-blocked',
          commandType: 'TransitionOpportunityStatus',
        }),
      },
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, PUBLISH_READINESS_BLOCKED_CODE)
    assert.equal(result.message, PUBLISH_READINESS_BLOCKED_MESSAGE)
    assert.ok(result.details?.some((line) => line === 'Profile missing:'))
    assert.ok(result.details?.some((line) => line === 'Opportunity missing:'))
  })
})
