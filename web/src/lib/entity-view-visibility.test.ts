import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { productFlags } from '@/config/product-flags.ts'
import type { Contract, Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  buildViewerContext,
  canEditOpportunity,
  canViewContractDetail,
  canViewDealDetail,
  canViewMatchDetail,
  canViewNegotiationDetail,
  filterContractsForViewer,
  filterDealsForViewer,
  filterOpportunitiesForListScope,
  filterPostMatchesForViewer,
  findParticipantOneWayMatchForOpportunity,
  resolveOpportunityDetailVisibility,
} from '@/lib/entity-view-visibility.ts'

const ownerId = 'owner-1'
const outsiderId = 'outsider-1'
const participantId = 'participant-1'

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1',
    title: 'Test opportunity',
    status: 'published',
    creatorId: ownerId,
    ...overrides,
  }
}

function postMatch(overrides: Partial<PostMatch> = {}): PostMatch {
  return {
    id: 'pm-1',
    matchType: 'one_way',
    status: 'discovered',
    matchScore: 0.82,
    participants: [
      { userId: participantId, role: 'offer_provider', opportunityId: 'opp-1' },
      { userId: ownerId, role: 'need_owner', opportunityId: 'need-1' },
    ],
    needOpportunityId: 'need-1',
    offerOpportunityId: 'opp-1',
    ...overrides,
  }
}

describe('resolveOpportunityDetailVisibility', () => {
  it('grants owner full matching and readiness on published opportunity', () => {
    const viewer = buildViewerContext({ userId: ownerId, role: 'company_owner', status: 'active' })
    const visibility = resolveOpportunityDetailVisibility(opportunity(), viewer, {
      postMatches: [postMatch()],
    })
    assert.equal(visibility.access, 'owner')
    assert.equal(visibility.showMatchingSection, true)
    assert.equal(visibility.showReadiness, true)
    assert.equal(visibility.showOwnerActions, true)
  })

  it('denies unrelated users on draft opportunities', () => {
    const viewer = buildViewerContext({ userId: outsiderId, role: 'professional', status: 'active' })
    const visibility = resolveOpportunityDetailVisibility(
      opportunity({ status: 'draft' }),
      viewer,
    )
    assert.equal(visibility.access, 'denied')
    assert.equal(visibility.showFullDescription, false)
  })

  it('allows admin staff read without owner matching section', () => {
    const viewer = buildViewerContext({
      userId: 'admin-1',
      role: 'admin',
      status: 'active',
      canAccessAdmin: true,
    })
    const visibility = resolveOpportunityDetailVisibility(opportunity(), viewer, {
      showLegacyApplicationsFlag: productFlags.showLegacyApplications,
    })
    assert.equal(visibility.access, 'admin')
    assert.equal(visibility.showMatchingSection, false)
    assert.equal(visibility.showLegacyApplications, false)
  })

  it('shows participant chip without matching section for matched non-owner', () => {
    const viewer = buildViewerContext({
      userId: participantId,
      role: 'professional',
      status: 'active',
    })
    const visibility = resolveOpportunityDetailVisibility(opportunity(), viewer, {
      postMatches: [postMatch()],
    })
    assert.equal(visibility.access, 'participant')
    assert.equal(visibility.showParticipantMatchChip, true)
    assert.equal(visibility.showMatchingSection, false)
    assert.equal(visibility.showReadiness, false)
  })

  it('limits unrelated users to public marketplace fields', () => {
    const viewer = buildViewerContext({ userId: outsiderId, role: 'professional', status: 'active' })
    const visibility = resolveOpportunityDetailVisibility(opportunity(), viewer)
    assert.equal(visibility.access, 'public')
    assert.equal(visibility.showMatchingSection, false)
    assert.equal(visibility.showReadiness, false)
    assert.equal(visibility.showMatchScoreInHero, false)
    assert.equal(visibility.showFullDescription, true)
  })

  it('uses teaser mode for suspended users', () => {
    const viewer = buildViewerContext({
      userId: outsiderId,
      role: 'professional',
      status: 'suspended',
    })
    const visibility = resolveOpportunityDetailVisibility(opportunity(), viewer)
    assert.equal(visibility.access, 'teaser')
    assert.equal(visibility.showBudgetAndTimeline, false)
  })
})

describe('collaboration entity view gates', () => {
  const match = postMatch()
  const negotiation: Negotiation = {
    id: 'neg-1',
    status: 'active',
    participants: [{ userId: participantId, role: 'offer_provider' }],
  }
  const deal: Deal = {
    id: 'deal-1',
    negotiationId: 'neg-1',
    opportunityId: 'opp-1',
    title: 'Deal',
    status: 'draft',
    participants: [{ userId: participantId, role: 'offer_provider' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }
  const contract: Contract = {
    id: 'contract-1',
    dealId: 'deal-1',
    status: 'draft',
    participants: [{ userId: participantId, role: 'offer_provider' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }

  it('blocks match detail for outsiders', () => {
    const outsider = buildViewerContext({ userId: outsiderId, status: 'active' })
    assert.equal(canViewMatchDetail(match, outsider), false)
    const participant = buildViewerContext({ userId: participantId, status: 'active' })
    assert.equal(canViewMatchDetail(match, participant), true)
  })

  it('blocks negotiation detail for outsiders', () => {
    const outsider = buildViewerContext({ userId: outsiderId, status: 'active' })
    assert.equal(canViewNegotiationDetail(negotiation, outsider), false)
    const participant = buildViewerContext({ userId: participantId, status: 'active' })
    assert.equal(canViewNegotiationDetail(negotiation, participant), true)
  })

  it('allows deal detail for participants and admin staff only', () => {
    const outsider = buildViewerContext({ userId: outsiderId, status: 'active' })
    assert.equal(canViewDealDetail(deal, outsider), false)
    const participant = buildViewerContext({ userId: participantId, status: 'active' })
    assert.equal(canViewDealDetail(deal, participant), true)
    const admin = buildViewerContext({
      userId: 'admin-1',
      role: 'auditor',
      status: 'active',
      canAccessAdmin: true,
    })
    assert.equal(canViewDealDetail(deal, admin), true)
  })

  it('allows contract detail for parties and admin staff only', () => {
    const outsider = buildViewerContext({ userId: outsiderId, status: 'active' })
    assert.equal(canViewContractDetail(contract, outsider), false)
    const participant = buildViewerContext({ userId: participantId, status: 'active' })
    assert.equal(canViewContractDetail(contract, participant), true)
  })
})

describe('list filters', () => {
  it('filters post-matches to participants', () => {
    const matches = [postMatch(), postMatch({ id: 'pm-2', participants: [{ userId: 'other', role: 'need_owner' }] })]
    const viewer = buildViewerContext({ userId: participantId, status: 'active' })
    const filtered = filterPostMatchesForViewer(matches, viewer)
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.id, 'pm-1')
  })

  it('filters deals and contracts to participants', () => {
    const deal: Deal = {
      id: 'deal-1',
      negotiationId: 'neg-1',
      opportunityId: 'opp-1',
      title: 'Deal',
      status: 'draft',
      participants: [{ userId: participantId, role: 'offer_provider' }],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }
    const contract: Contract = {
      id: 'contract-1',
      dealId: 'deal-1',
      status: 'draft',
      participants: [{ userId: participantId, role: 'offer_provider' }],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }
    const viewer = buildViewerContext({ userId: participantId, status: 'active' })
    assert.equal(filterDealsForViewer([deal], viewer).length, 1)
    assert.equal(filterContractsForViewer([contract], viewer).length, 1)
  })

  it('hides other users drafts from all scope', () => {
    const opps = [
      opportunity({ id: 'draft-other', status: 'draft', creatorId: 'other' }),
      opportunity({ id: 'draft-mine', status: 'draft', creatorId: ownerId }),
      opportunity({ id: 'pub-other', status: 'published', creatorId: 'other' }),
    ]
    const viewer = buildViewerContext({ userId: ownerId, status: 'active' })
    const filtered = filterOpportunitiesForListScope(opps, viewer, 'all')
    assert.equal(filtered.some((o) => o.id === 'draft-other'), false)
    assert.equal(filtered.some((o) => o.id === 'draft-mine'), true)
    assert.equal(filtered.some((o) => o.id === 'pub-other'), true)
  })
})

describe('canEditOpportunity', () => {
  it('allows owner and platform admin roles', () => {
    const owner = buildViewerContext({ userId: ownerId, role: 'company_owner' })
    assert.equal(canEditOpportunity(opportunity(), owner), true)
    const admin = buildViewerContext({ userId: 'admin-1', role: 'admin' })
    assert.equal(canEditOpportunity(opportunity(), admin), true)
    const auditor = buildViewerContext({ userId: 'auditor-1', role: 'auditor' })
    assert.equal(canEditOpportunity(opportunity(), auditor), false)
  })
})

describe('findParticipantOneWayMatchForOpportunity', () => {
  it('finds one_way match linking viewer to opportunity', () => {
    const viewer = buildViewerContext({ userId: participantId })
    const found = findParticipantOneWayMatchForOpportunity('opp-1', [postMatch()], viewer)
    assert.equal(found?.id, 'pm-1')
  })
})

describe('productFlags', () => {
  it('keeps legacy applications UI disabled by default', () => {
    assert.equal(productFlags.showLegacyApplications, false)
  })
})
