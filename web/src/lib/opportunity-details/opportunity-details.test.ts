import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countStrongMatches,
  buildOpportunityDetailsKpis,
} from './opportunity-details-kpis.ts'
import { resolveOpportunityDetailsCapabilities } from './opportunity-details-actions.ts'
import { resolveOpportunityDetailsNextAction } from './opportunity-details-next-action.ts'
import {
  buildOpportunityDetailsWorkspaceVisibility,
  parseWorkspaceId,
} from './opportunity-details-visibility.ts'
import { buildOpportunityDetailsHistory } from './opportunity-details-history.ts'
import { deriveTimelineState } from './opportunity-details-formatters.ts'
import type { Opportunity } from '@/types/domain.ts'
import type { OpportunityDetailVisibility } from '@/lib/entity-view-visibility.ts'
import type { OpportunityReadinessResult } from '@/domain/opportunity-readiness/types.ts'

const baseVisibility = (access: OpportunityDetailVisibility['access']): OpportunityDetailVisibility => ({
  access,
  showMatchingSection: access === 'owner',
  showParticipantMatchChip: access === 'participant',
  showReadiness: access === 'owner',
  showOwnerActions: access === 'owner',
  showContractSection: false,
  showLegacyApplications: false,
  showCreatorName: true,
  showBudgetAndTimeline: access !== 'teaser' && access !== 'denied',
  showFullDescription: access !== 'teaser' && access !== 'denied',
  showMatchScoreInHero: access === 'owner',
  showCollaborationWorkflow: access === 'owner',
  showRecommendedActions: access === 'owner',
})

const draftOpp = {
  id: 'opp-1',
  title: 'Test',
  status: 'draft',
  creatorId: 'user-1',
} as Opportunity

const readiness: OpportunityReadinessResult = {
  score: 0.72,
  status: 'needs_review',
  missingRequired: ['a', 'b', 'c'],
  missingRecommended: ['d', 'e', 'f', 'g'],
  presentRequired: [],
  presentRecommended: [],
}

describe('opportunity-details-formatters', () => {
  it('marks timeline unscheduled when dates missing', () => {
    assert.equal(deriveTimelineState({}), 'unscheduled')
  })
})

describe('opportunity-details-visibility', () => {
  it('parses workspace ids and defaults unknown', () => {
    assert.equal(parseWorkspaceId('scope'), 'scope')
    assert.equal(parseWorkspaceId('nope'), 'overview')
    assert.equal(parseWorkspaceId(null), 'overview')
  })

  it('restricts matching for public viewers', () => {
    const map = buildOpportunityDetailsWorkspaceVisibility(baseVisibility('public'))
    assert.equal(map.matching, 'restricted')
    assert.equal(map.canViewRelatedObjectExistence, false)
    assert.equal(map.commercialAudience, 'marketplace')
  })

  it('allows owner matching and commercial amounts', () => {
    const map = buildOpportunityDetailsWorkspaceVisibility(baseVisibility('owner'))
    assert.equal(map.matching, 'ready')
    assert.equal(map.canViewCommercialAmounts, true)
  })
})

describe('opportunity-details-kpis', () => {
  it('counts strong matches with threshold', () => {
    assert.equal(countStrongMatches([0.9, 0.5, 0.8, undefined]), 2)
  })

  it('does not use publish-blocked as primary when published', () => {
    const kpis = buildOpportunityDetailsKpis({
      opportunity: { ...draftOpp, status: 'published' },
      readiness,
      healthState: 'Needs Attention',
      workPackageCount: 3,
      taskCount: 5,
      deliverableCount: 4,
      milestoneCount: 2,
      matchCount: 5,
      matchScores: [0.9, 0.4],
      matchingAvailable: true,
      commercialSummary: {
        derivedExchangeMode: 'Hybrid',
        isHybrid: true,
        componentLabels: ['Cash', 'Barter'],
        allocationLines: [],
        linkedWorkPackageCount: 0,
        linkedMilestoneCount: 0,
        previewLines: [],
      },
      allocationMethod: 'mixed',
      validationErrorCount: 3,
      publishReady: false,
    })
    assert.equal(kpis.lifecycle.primaryLabel, 'Published')
    assert.equal(kpis.scope.workPackageCount, 3)
    assert.equal(kpis.matching.count, 5)
    assert.equal(kpis.matching.strongCount, 1)
    assert.equal(kpis.commercial.allocationMethod, 'mixed')
  })

  it('shows negotiating stage instead of Published', () => {
    const kpis = buildOpportunityDetailsKpis({
      opportunity: { ...draftOpp, status: 'negotiating' },
      readiness,
      healthState: 'Needs Attention',
      workPackageCount: 0,
      taskCount: 0,
      deliverableCount: 0,
      milestoneCount: 0,
      matchingAvailable: true,
      matchCount: 2,
      validationErrorCount: 0,
      publishReady: true,
    })
    assert.equal(kpis.lifecycle.primaryLabel, 'Negotiating')
  })

  it('omits matching counts when unavailable', () => {
    const kpis = buildOpportunityDetailsKpis({
      opportunity: draftOpp,
      readiness,
      healthState: 'Draft',
      workPackageCount: 0,
      taskCount: 0,
      deliverableCount: 0,
      milestoneCount: 0,
      matchingAvailable: false,
      validationErrorCount: 0,
      publishReady: false,
    })
    assert.equal(kpis.matching.count, undefined)
    assert.equal(kpis.matching.available, false)
  })
})

describe('opportunity-details-actions', () => {
  it('grants owner draft capabilities', () => {
    const caps = resolveOpportunityDetailsCapabilities({
      opportunity: draftOpp,
      visibility: baseVisibility('owner'),
      userId: 'user-1',
      canMutate: true,
      canViewCommercialAmounts: true,
    })
    assert.equal(caps.canEdit, true)
    assert.equal(caps.canDeleteDraft, true)
    assert.equal(caps.canArchive, false)
  })

  it('keeps auditor read-only', () => {
    const caps = resolveOpportunityDetailsCapabilities({
      opportunity: { ...draftOpp, status: 'published' },
      visibility: baseVisibility('admin'),
      isAuditor: true,
      canMutate: true,
      canViewCommercialAmounts: true,
    })
    assert.equal(caps.isReadOnly, true)
    assert.equal(caps.canEdit, false)
    assert.equal(caps.canPublish, false)
  })
})

describe('opportunity-details-next-action', () => {
  it('prefers complete-required when draft has blockers', () => {
    const caps = resolveOpportunityDetailsCapabilities({
      opportunity: draftOpp,
      visibility: baseVisibility('owner'),
      userId: 'user-1',
      canMutate: true,
    })
    const next = resolveOpportunityDetailsNextAction({
      capabilities: { ...caps, canPublish: false },
      opportunityId: 'opp-1',
      isDraft: true,
      blockersCount: 3,
      matchCount: 0,
      showRecommendedActions: true,
    })
    assert.equal(next?.id, 'complete-required')
  })
})

describe('opportunity-details-history', () => {
  it('builds real events only and orders newest first', () => {
    const events = buildOpportunityDetailsHistory({
      opportunity: {
        ...draftOpp,
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
      matchCount: 2,
      auditEntries: [
        {
          id: 'a1',
          action: 'opportunity.updated',
          entityId: 'opp-1',
          entityType: 'opportunity',
          timestamp: '2026-01-15T00:00:00.000Z',
        },
      ],
    })
    assert.ok(events.some((e) => e.kind === 'created'))
    assert.ok(events.some((e) => e.kind === 'match'))
    assert.ok(events.some((e) => e.kind === 'published'))
    assert.equal(events[0]!.kind === 'match' || events[0]!.kind === 'published' || events[0]!.kind === 'updated', true)
  })
})
