import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeOpportunityAnalytics } from '@/domain/opportunity-creation/analytics.ts'
import type { Opportunity } from '@/types/domain.ts'

describe('Opportunity presentation analytics', () => {
  it('computes average draft lifetime across publish/archive/delete', () => {
    const opportunities: Opportunity[] = [
      {
        id: 'a',
        title: 'A',
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      } as Opportunity,
      {
        id: 'b',
        title: 'B',
        status: 'draft',
        visibilityStatus: 'archived',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      } as Opportunity,
    ]
    const snapshot = computeOpportunityAnalytics(opportunities, {
      deletedDraftLifetimesHours: [12],
    })
    assert.ok(snapshot.averageDraftLifetimeHours != null)
    assert.ok((snapshot.averageDraftLifetimeHours ?? 0) > 0)
    assert.ok(snapshot.timeToPublishHours != null)
  })
})
