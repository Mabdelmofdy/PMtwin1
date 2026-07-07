/**
 * Phase D — Web seed sync validation against POC PostMatch-first dataset.
 * Ensures seed-loader imports and read models work with lifecycle-aligned seed data.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { toCanonical } from '@pm-twin/lifecycle'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/matching-quality-analytics.ts'
import { collectPostMatchOpportunityIds } from '@/domain/normalized/post-match-strong-key.ts'
import {
  loadApplications,
  loadContracts,
  loadDeals,
  loadNegotiations,
  loadOpportunities,
  loadPostMatches,
} from '@/infrastructure/seed/seed-loader.ts'
import { buildContractDetailReadModel } from '@/lib/contract-detail-read-model.ts'
import { buildDealDetailReadModel } from '@/lib/deal-detail-read-model.ts'
import { buildMatchDetailReadModel } from '@/lib/match-detail-read-model.ts'
import {
  buildOpportunityMatchesReadModel,
  OPPORTUNITY_MATCHES_EMPTY_MESSAGE,
} from '@/lib/opportunity-matches-read-model.ts'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import type {
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PostMatch,
} from '@/types/domain.ts'

const SEED = {
  completedOpp: 'seed-opp-001',
  negotiatingOpp: 'seed-opp-005',
  matchedOpp: 'seed-opp-023',
  matchedOppPm: 'demo-pm-oneway-16',
  publishedOnlyOpp: 'seed-opp-003',
  pendingPm: 'demo-pm-oneway-02',
  acceptedPm: 'demo-pm-oneway-15',
  confirmedPm: 'demo-pm-oneway-01',
  oneWayPm: 'demo-pm-oneway-01',
  twoWayPm: 'demo-pm-barter-01',
  consortiumPm: 'demo-pm-consortium-01',
  circularPm: 'demo-pm-circular-01',
  dealOneway: 'seed-deal-oneway-01',
  dealConsortium: 'seed-deal-consortium-01',
  contractOneway: 'seed-contract-oneway-01',
  contractConsortium: 'seed-contract-consortium-01',
  counterNegotiation: 'seed-neg-02',
  demoHiringApplication: 'seed-app-demo-hiring-01',
} as const

type SeedContext = {
  readonly opportunities: Opportunity[]
  readonly postMatches: PostMatch[]
  readonly negotiations: Negotiation[]
  readonly deals: Deal[]
  readonly contracts: Contract[]
  readonly opportunityById: Record<string, Opportunity>
  readonly postMatchById: Record<string, PostMatch>
}

function loadSeedContext(): SeedContext {
  const opportunities = loadOpportunities()
  const postMatches = loadPostMatches()
  const negotiations = loadNegotiations()
  const deals = loadDeals()
  const contracts = loadContracts()

  return {
    opportunities,
    postMatches,
    negotiations,
    deals,
    contracts,
    opportunityById: Object.fromEntries(opportunities.map((opp) => [opp.id, opp])),
    postMatchById: Object.fromEntries(postMatches.map((pm) => [pm.id, pm])),
  }
}

function createOpportunityMatchesDeps(ctx: SeedContext) {
  return {
    getPostMatchesByOpportunity: (opportunityId: string) =>
      ctx.postMatches.filter((pm) =>
        collectPostMatchOpportunityIds(pm).includes(opportunityId),
      ),
    getOpportunity: (id: string) => ctx.opportunityById[id],
    getNegotiationsForPostMatch: (postMatchId: string) =>
      ctx.negotiations.filter(
        (neg) => (neg.postMatchId ?? neg.matchId) === postMatchId,
      ),
    getDealForPostMatch: (postMatchId: string) =>
      ctx.deals.find((deal) => (deal.postMatchId ?? deal.matchId) === postMatchId),
    currentUserId: null as string | null,
  }
}

function createDealDetailDeps(ctx: SeedContext) {
  const negotiationById = Object.fromEntries(
    ctx.negotiations.map((neg) => [neg.id, neg]),
  )
  return {
    getDeal: (id: string) => ctx.deals.find((deal) => deal.id === id),
    getNegotiation: (id: string) => negotiationById[id],
    getPostMatch: (id: string) => ctx.postMatchById[id],
    getOpportunity: (id: string) => ctx.opportunityById[id],
    getContractsForDeal: (dealId: string) =>
      ctx.contracts.filter((contract) => contract.dealId === dealId),
  }
}

function createContractDetailDeps(ctx: SeedContext) {
  const dealById = Object.fromEntries(ctx.deals.map((deal) => [deal.id, deal]))
  const negotiationById = Object.fromEntries(
    ctx.negotiations.map((neg) => [neg.id, neg]),
  )
  return {
    getContract: (id: string) => ctx.contracts.find((contract) => contract.id === id),
    getDeal: (id: string) => dealById[id],
    getNegotiation: (id: string) => negotiationById[id],
    getOpportunity: (id: string) => ctx.opportunityById[id],
  }
}

describe('seed loader — PostMatch-first POC sync', () => {
  const ctx = loadSeedContext()

  it('loads 40 opportunities from opportunities.json merge', () => {
    assert.ok(ctx.opportunities.length >= 40)
  })

  it('loads post-matches from demo-post-matches.json', () => {
    assert.ok(ctx.postMatches.length >= 23)
  })

  it('loads negotiations, deals, and contracts', () => {
    assert.ok(ctx.negotiations.length >= 10)
    assert.ok(ctx.deals.length >= 3)
    assert.ok(ctx.contracts.length >= 3)
  })

  it('loads demo applications for hiring path', () => {
    const applications = loadApplications()
    assert.ok(applications.length >= 1)
    assert.ok(applications.some((app) => app.id === SEED.demoHiringApplication))
  })

  it('preserves mixed post-match match types from seed', () => {
    const types = new Set(ctx.postMatches.map((pm) => pm.matchType))
    assert.equal(types.has('one_way'), true)
    assert.equal(types.has('two_way'), true)
    assert.equal(types.has('consortium'), true)
    assert.equal(types.has('circular'), true)
  })

  it('supports both PostMatch-first and hiring application-linked records', () => {
    assert.ok(ctx.negotiations.some((neg) => neg.applicationId === null))
    assert.ok(ctx.negotiations.some((neg) => neg.applicationId != null))
    assert.ok(ctx.deals.some((deal) => deal.applicationId === null))
    assert.ok(ctx.deals.some((deal) => deal.applicationId != null))
    assert.ok(ctx.contracts.some((contract) => contract.applicationId === null))
    assert.ok(ctx.contracts.some((contract) => contract.applicationId != null))
  })

  it('reflects lifecycle-aligned opportunity statuses (not all published)', () => {
    const statuses = new Set(ctx.opportunities.map((opp) => opp.status))
    assert.equal(statuses.has('published'), true)
    assert.equal(statuses.has('in_negotiation'), true)
    assert.equal(statuses.has('matched'), true)
    assert.equal(statuses.has('completed'), true)
    assert.equal(ctx.opportunities.every((opp) => opp.status === 'published'), false)
  })
})

describe('status normalization — POC seed aliases', () => {
  const ctx = loadSeedContext()

  it('maps in_negotiation opportunity status to negotiating', () => {
    const opp = ctx.opportunityById[SEED.negotiatingOpp]
    assert.ok(opp)
    assert.equal(opp.status, 'in_negotiation')
    assert.equal(resolveCanonicalStatus('opportunity', opp.status), 'negotiating')
    assert.equal(toCanonical('opportunity', opp.status), 'negotiating')
  })

  it('maps in_execution opportunity status to executing', () => {
    const opp = ctx.opportunities.find((row) => row.status === 'in_execution')
    assert.ok(opp)
    assert.equal(resolveCanonicalStatus('opportunity', opp.status), 'executing')
  })

  it('maps pending post-match status to discovered', () => {
    const pm = ctx.postMatchById[SEED.pendingPm]
    assert.ok(pm)
    assert.equal(pm.status, 'pending')
    assert.equal(toCanonical('match', pm.status), 'discovered')
  })

  it('maps counter_offered negotiation status to countered', () => {
    const neg = ctx.negotiations.find((row) => row.id === SEED.counterNegotiation)
    assert.ok(neg)
    assert.equal(neg.status, 'counter_offered')
    assert.equal(toCanonical('negotiation', neg.status), 'countered')
  })

  it('maps execution deal status to executing', () => {
    const deal = ctx.deals.find((row) => row.status === 'execution')
    assert.ok(deal)
    assert.equal(toCanonical('deal', deal.status), 'executing')
  })
})

describe('RelatedMatchesPanel read model — POC seed scenarios', () => {
  const ctx = loadSeedContext()
  const deps = createOpportunityMatchesDeps(ctx)

  it('finds matches for completed opportunity with view deal action', () => {
    const model = buildOpportunityMatchesReadModel(SEED.completedOpp, deps)
    assert.equal(model.isEmpty, false)
    assert.equal(model.matchesArePrimaryFlow, true)
    assert.ok(model.matches.some((card) => card.actions.showViewDeal))
    assert.ok(model.matches.some((card) => card.actions.dealId === SEED.dealOneway))
  })

  it('finds matches for in_negotiation opportunity', () => {
    const model = buildOpportunityMatchesReadModel(SEED.negotiatingOpp, deps)
    assert.equal(model.isEmpty, false)
    assert.ok(model.matches.length > 0)
    const hasNegotiationFlow = model.matches.some(
      (card) =>
        card.actions.showViewNegotiation ||
        card.actions.showStartNegotiation ||
        card.actions.showCreateDeal,
    )
    assert.equal(hasNegotiationFlow, true)
  })

  it('finds matches for matched opportunity with discovered post-match', () => {
    const model = buildOpportunityMatchesReadModel(SEED.matchedOpp, deps)
    assert.equal(model.isEmpty, false)
    const card = model.matches.find((row) => row.match.id === SEED.matchedOppPm)
    assert.ok(card)
    assert.equal(card.canonicalStatus, 'discovered')
    assert.equal(card.actions.showAccept, false)
    assert.equal(card.actions.showViewDetails, true)
  })

  it('returns empty state for published-only opportunity without post-matches', () => {
    const model = buildOpportunityMatchesReadModel(SEED.publishedOnlyOpp, deps)
    assert.equal(model.isEmpty, true)
    assert.equal(model.emptyMessage, OPPORTUNITY_MATCHES_EMPTY_MESSAGE)
    assert.equal(model.matchesArePrimaryFlow, true)
  })
})

describe('match detail read model — POC seed match types', () => {
  const ctx = loadSeedContext()
  const matchDeps = {
    getOpportunity: (id: string) => ctx.opportunityById[id],
    getNegotiationsForPostMatch: (postMatchId: string) =>
      ctx.negotiations.filter(
        (neg) => (neg.postMatchId ?? neg.matchId) === postMatchId,
      ),
    getDealForPostMatch: (postMatchId: string) =>
      ctx.deals.find((deal) => (deal.postMatchId ?? deal.matchId) === postMatchId),
    currentUserId: null,
    canAct: false,
  }

  function modelFor(pmId: string) {
    const match = ctx.postMatchById[pmId]
    assert.ok(match, `missing post-match ${pmId}`)
    return buildMatchDetailReadModel(match, matchDeps)
  }

  it('handles pending/discovered one_way match', () => {
    const model = modelFor(SEED.pendingPm)
    assert.equal(model.matchTypeLabel, 'One Way Matching')
    assert.equal(model.canonicalStatus, 'discovered')
    assert.ok(model.relatedOpportunities.length >= 1)
  })

  it('handles accepted one_way match linked to active negotiation', () => {
    const model = modelFor(SEED.acceptedPm)
    assert.equal(model.canonicalStatus, 'accepted')
    assert.equal(model.actions.showViewNegotiation, true)
  })

  it('handles confirmed one_way match with deal', () => {
    const model = modelFor(SEED.confirmedPm)
    assert.equal(model.canonicalStatus, 'confirmed')
    assert.equal(model.actions.showViewDeal, true)
    assert.equal(model.actions.dealId, SEED.dealOneway)
  })

  it('handles two_way match topology', () => {
    const model = modelFor(SEED.twoWayPm)
    assert.equal(model.matchTypeLabel, 'Two-Way Dependency')
    assert.ok(model.relatedOpportunities.length >= 2)
  })

  it('handles consortium match topology', () => {
    const model = modelFor(SEED.consortiumPm)
    assert.equal(model.matchTypeLabel, 'Group Formation')
    assert.ok(model.relatedOpportunities.length >= 1)
  })

  it('handles circular match topology', () => {
    const model = modelFor(SEED.circularPm)
    assert.equal(model.matchTypeLabel, 'Circular Exchange')
    assert.ok(model.relatedOpportunities.length >= 2)
  })
})

describe('deal and contract read models — restored seed entities', () => {
  const ctx = loadSeedContext()
  const dealDeps = createDealDetailDeps(ctx)
  const contractDeps = createContractDetailDeps(ctx)

  it('resolves completed one-way deal with linked post-match and contract record', () => {
    const model = buildDealDetailReadModel(SEED.dealOneway, dealDeps)
    assert.ok(model)
    assert.equal(model.postMatchId, SEED.oneWayPm)
    assert.equal(model.canonicalStatus, 'completed')
    assert.equal(model.deal.contractId, SEED.contractOneway)
    const contracts = dealDeps.getContractsForDeal(SEED.dealOneway)
    assert.equal(contracts.length, 1)
    assert.equal(contracts[0]?.id, SEED.contractOneway)
    assert.equal(contracts[0]?.status, 'completed')
    assert.equal(model.existingContract, null)
    assert.equal(model.contractLink, null)
    assert.equal(model.links.match?.path, `/matches/${SEED.oneWayPm}`)
  })

  it('resolves executing consortium deal with active contract', () => {
    const model = buildDealDetailReadModel(SEED.dealConsortium, dealDeps)
    assert.ok(model)
    assert.equal(model.canonicalStatus, 'executing')
    assert.ok(model.existingContract)
    assert.equal(model.existingContract?.status, 'active')
    assert.equal(model.existingContract?.id, SEED.contractConsortium)
  })

  it('loads active consortium contract with linked deal and match', () => {
    const model = buildContractDetailReadModel(SEED.contractConsortium, contractDeps)
    assert.ok(model)
    assert.equal(model.dealId, SEED.dealConsortium)
    assert.equal(model.dealStatus, 'execution')
    assert.equal(model.postMatchId, SEED.consortiumPm)
    assert.equal(model.links.deal?.path, `/commercial-agreements/${SEED.dealConsortium}`)
    assert.equal(model.links.match?.path, `/matches/${SEED.consortiumPm}`)
  })

  it('loads completed one-way contract with completed deal', () => {
    const model = buildContractDetailReadModel(SEED.contractOneway, contractDeps)
    assert.ok(model)
    assert.equal(model.dealId, SEED.dealOneway)
    assert.equal(model.dealStatus, 'completed')
    assert.equal(model.status, 'completed')
  })
})

describe('post-match-first flow without applications', () => {
  const ctx = loadSeedContext()

  it('builds opportunity matches read model with or without applications', () => {
    assert.ok(loadApplications().length >= 1)
    const model = buildOpportunityMatchesReadModel(
      SEED.completedOpp,
      createOpportunityMatchesDeps(ctx),
    )
    assert.equal(model.isEmpty, false)
    assert.equal(model.matchesArePrimaryFlow, true)
  })

  it('resolves all seed deals through post-match linkage', () => {
    for (const deal of ctx.deals) {
      const matchId = deal.postMatchId ?? deal.matchId
      assert.ok(matchId, `deal ${deal.id} missing post-match link`)
      assert.ok(ctx.postMatchById[matchId], `deal ${deal.id} references missing ${matchId}`)
    }
  })
})

describe('seed taxonomy coverage — collaboration and matching', () => {
  const ctx = loadSeedContext()
  const opportunities = ctx.opportunities
  const postMatches = ctx.postMatches

  const REQUIRED_MATCH_TYPES = ['one_way', 'two_way', 'consortium', 'circular']
  const REQUIRED_MAIN_MODELS = [
    'cash_subcontracting',
    'service_exchange',
    'joint_venture',
    'resource_sharing',
    'hiring',
  ]
  const REQUIRED_SUB_MODELS = [
    'task_based',
    'consortium',
    'project_jv',
    'spv',
    'strategic_jv',
    'strategic_alliance',
    'mentorship',
    'bulk_purchasing',
    'equipment_sharing',
    'resource_sharing',
    'professional_hiring',
    'consultant_hiring',
    'competition_rfp',
  ]
  const REQUIRED_EXCHANGE_MODES = [
    'cash',
    'barter',
    'equity',
    'profit_sharing',
    'hybrid',
  ]

  it('every match type appears in seed', () => {
    const types = new Set(postMatches.map((pm) => pm.matchType))
    for (const type of REQUIRED_MATCH_TYPES) assert.equal(types.has(type), true)
  })

  it('every main model appears in seed opportunities', () => {
    const models = new Set(opportunities.map((opp) => opp.mainCollaborationModel).filter(Boolean))
    for (const model of REQUIRED_MAIN_MODELS) assert.equal(models.has(model), true)
  })

  it('every sub-model appears in seed opportunities', () => {
    const subModels = new Set(opportunities.map((opp) => opp.subModelType).filter(Boolean))
    for (const subModel of REQUIRED_SUB_MODELS) assert.equal(subModels.has(subModel), true)
  })

  it('every value exchange mode appears in seed opportunities', () => {
    const modes = new Set(opportunities.map((opp) => opp.exchangeMode).filter(Boolean))
    for (const mode of REQUIRED_EXCHANGE_MODES) assert.equal(modes.has(mode), true)
  })

  it('every postMatch.matchType is valid', () => {
    const allowed = new Set(REQUIRED_MATCH_TYPES)
    for (const postMatch of postMatches) {
      assert.equal(allowed.has(postMatch.matchType), true, `invalid matchType: ${postMatch.id}`)
    }
  })

  it('no opportunity subModelType contains one_way/two_way/circular topology values', () => {
    const invalid = new Set(['one_way', 'two_way', 'circular'])
    for (const opp of opportunities) {
      if (!opp.subModelType) continue
      assert.equal(invalid.has(opp.subModelType), false, `invalid subModelType: ${opp.id}`)
    }
  })
})

describe('seed linkage integrity — commercial agreements and contracts', () => {
  const ctx = loadSeedContext()

  it('every commercial agreement links to an agreed negotiation', () => {
    const negotiationById = new Map(ctx.negotiations.map((neg) => [neg.id, neg]))
    for (const deal of ctx.deals) {
      const negotiation = negotiationById.get(deal.negotiationId)
      assert.ok(negotiation, `deal ${deal.id} missing negotiation`)
      assert.equal(negotiation?.status, 'agreed', `deal ${deal.id} negotiation must be agreed`)
    }
  })

  it('every contract links to commercial agreement', () => {
    const dealIds = new Set(ctx.deals.map((deal) => deal.id))
    for (const contract of ctx.contracts) {
      const linkedId = contract.commercialAgreementId ?? contract.dealId
      assert.ok(linkedId, `contract ${contract.id} missing commercial agreement link`)
      assert.equal(dealIds.has(linkedId), true, `contract ${contract.id} links missing deal`)
    }
  })
})

describe('visibility coverage — admin analytics and client browse', () => {
  const ctx = loadSeedContext()

  it('admin analytics includes all match types', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: ctx.opportunities,
      matches: ctx.postMatches,
      negotiations: ctx.negotiations,
      deals: ctx.deals,
    })
    assert.ok(analytics.byMatchType.one_way.total > 0)
    assert.ok(analytics.byMatchType.two_way.total > 0)
    assert.ok(analytics.byMatchType.consortium.total > 0)
    assert.ok(analytics.byMatchType.circular.total > 0)
  })

  it('client browse includes all main collaboration models', () => {
    const models = new Set(ctx.opportunities.map((opp) => opp.mainCollaborationModel).filter(Boolean))
    assert.equal(models.has('cash_subcontracting'), true)
    assert.equal(models.has('service_exchange'), true)
    assert.equal(models.has('joint_venture'), true)
    assert.equal(models.has('resource_sharing'), true)
    assert.equal(models.has('hiring'), true)
  })
})

class MemoryStorageAdapter implements IStorageAdapter {
  get<T>(): T | null {
    return null
  }

  set(): void {}

  remove(): void {}

  clear(): void {}
}

describe('repositories — POC seed wiring', () => {
  it('PostMatchRepository loads post-matches from seed', () => {
    const repo = new PostMatchRepository(new MemoryStorageAdapter(), loadPostMatches)
    assert.ok(repo.getAll().length >= 23)
  })

  it('OpportunityRepository loads opportunities from seed merge', () => {
    const repo = new OpportunityRepository(new MemoryStorageAdapter(), loadOpportunities)
    assert.ok(repo.getAll().length >= 40)
  })

  it('PostMatchRepository indexes lifecycle-aligned opportunity matches', () => {
    const repo = new PostMatchRepository(new MemoryStorageAdapter(), loadPostMatches)
    assert.ok(repo.getByOpportunity(SEED.completedOpp).length > 0)
    assert.equal(repo.getByOpportunity(SEED.publishedOnlyOpp).length, 0)
  })
})
