import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countOpportunityBuckets,
  formatOpportunityIntent,
  resolvePublishVisualState,
} from '@/components/opportunity/opportunity-display.ts'

describe('opportunity-display', () => {
  it('counts opportunity buckets by canonical status', () => {
    const buckets = countOpportunityBuckets([
      { status: 'draft', creatorId: 'u1' },
      { status: 'published', creatorId: 'u1' },
      { status: 'matched', creatorId: 'u1' },
      { status: 'negotiating', creatorId: 'u2' },
      { status: 'completed', creatorId: 'u1' },
    ], 'u1')

    assert.equal(buckets.drafts, 1)
    assert.equal(buckets.published, 1)
    assert.equal(buckets.matched, 1)
    assert.equal(buckets.completed, 1)
    assert.equal(buckets.negotiating, 0)
  })

  it('resolves publish visual states', () => {
    assert.equal(resolvePublishVisualState('draft', 'ready_for_matching'), 'ready')
    assert.equal(resolvePublishVisualState('draft', 'incomplete'), 'blocked')
    assert.equal(resolvePublishVisualState('published', 'ready_for_matching'), 'published')
  })

  it('formats intent labels', () => {
    assert.equal(formatOpportunityIntent('need'), 'Need')
    assert.equal(formatOpportunityIntent('offer'), 'Offer')
  })
})
