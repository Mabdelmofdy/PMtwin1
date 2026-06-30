import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countActiveDeals,
  countActiveMatches,
  countActiveOpportunities,
  countPipelineWorkflowItems,
  formatPlatformHealthMetric,
  summarizeOpportunityListHero,
} from '@/components/layout/page-hero-display.ts'

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
