import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countOpportunityBuckets,
  formatOpportunityIntent,
  resolveOpportunityIntentBadgeTone,
  resolveOpportunityIntentKind,
  resolveOpportunityOwnerBadgeTone,
  resolveOpportunityOwnershipScope,
  formatOpportunityOwnershipLabel,
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
    assert.equal(formatOpportunityIntent('request'), 'Need')
    assert.equal(formatOpportunityIntent('offer'), 'Offer')
  })

  it('maps intent kinds to distinct badge tones', () => {
    assert.equal(resolveOpportunityIntentKind('need'), 'need')
    assert.equal(resolveOpportunityIntentKind('offer'), 'offer')
    assert.equal(resolveOpportunityIntentBadgeTone('need'), 'info')
    assert.equal(resolveOpportunityIntentBadgeTone('offer'), 'success')
    assert.equal(resolveOpportunityIntentBadgeTone('hybrid'), 'warning')
    assert.equal(resolveOpportunityOwnerBadgeTone(), 'primary')
  })

  it('resolves ownership scope for viewer', () => {
    assert.equal(
      resolveOpportunityOwnershipScope({
        opportunity: { creatorId: 'u1', organizationId: 'org-1' },
        viewerUserId: 'u1',
        viewerOrganizationId: 'org-1',
      }),
      'mine',
    )
    assert.equal(
      resolveOpportunityOwnershipScope({
        opportunity: { creatorId: 'u2', organizationId: 'org-1' },
        viewerUserId: 'u1',
        viewerOrganizationId: 'org-1',
      }),
      'company',
    )
    assert.equal(
      resolveOpportunityOwnershipScope({
        opportunity: { creatorId: 'u9', organizationId: 'org-9' },
        viewerUserId: 'u1',
        viewerOrganizationId: 'org-1',
      }),
      'marketplace',
    )
    assert.equal(formatOpportunityOwnershipLabel('marketplace'), 'Marketplace opportunity')
  })
})
