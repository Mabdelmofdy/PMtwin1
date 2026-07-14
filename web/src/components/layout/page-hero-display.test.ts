import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countAccessibleDraftOpportunities,
  countActiveDeals,
  countActiveMatches,
  countActiveOpportunities,
  countPipelineWorkflowItems,
  filterMarketplacePublicOpportunities,
  formatPlatformHealthMetric,
  summarizeOpportunityListHero,
} from '@/components/layout/page-hero-display.ts'
import { buildViewerContext } from '@/lib/entity-view-visibility.ts'
import type { Opportunity } from '@/types/domain.ts'

describe('page-hero-display', () => {
  it('summarizes opportunity list hero counts', () => {
    const summary = summarizeOpportunityListHero([
      { status: 'draft' },
      { status: 'published' },
      { status: 'matched' },
      { status: 'negotiating' },
      { status: 'completed' },
    ])

    assert.equal(summary.draftCount, 1)
    assert.equal(summary.publishedCount, 1)
    assert.equal(summary.inPipelineCount, 2)
    assert.equal(summary.activeCount, 3)
  })

  it('counts only accessible drafts for the viewer', () => {
    const opportunities = [
      { id: 'd1', title: 'Mine', status: 'draft', creatorId: 'u1' },
      { id: 'd2', title: 'Other', status: 'draft', creatorId: 'u2' },
      { id: 'p1', title: 'Pub', status: 'published', creatorId: 'u2' },
    ] as Opportunity[]
    const viewer = buildViewerContext({ userId: 'u1', status: 'active' })
    assert.equal(countAccessibleDraftOpportunities(opportunities, viewer), 1)
  })

  it('excludes drafts from marketplace public totals', () => {
    const filtered = filterMarketplacePublicOpportunities([
      { status: 'draft' },
      { status: 'published' },
      { status: 'in_negotiation' },
    ])
    assert.equal(filtered.length, 2)
    assert.equal(filtered.some((item) => item.status === 'draft'), false)
  })

  it('counts active opportunities', () => {
    assert.equal(
      countActiveOpportunities([{ status: 'draft' }, { status: 'published' }]),
      1,
    )
  })

  it('sums pipeline workflow items', () => {
    assert.equal(countPipelineWorkflowItems(5, 3, 2), 10)
  })

  it('formats platform health metric', () => {
    assert.equal(formatPlatformHealthMetric(80, 70), '75%')
  })

  it('counts active matches and deals', () => {
    assert.equal(
      countActiveMatches([
        { status: 'discovered' },
        { status: 'declined' },
        { status: 'accepted' },
      ]),
      2,
    )
    assert.equal(
      countActiveDeals([{ status: 'draft' }, { status: 'completed' }]),
      1,
    )
  })
})
