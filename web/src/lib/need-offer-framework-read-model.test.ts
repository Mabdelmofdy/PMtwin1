import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatFrameworkMatchTypeLabel,
  formatFrameworkMatchTypeSubtitle,
  MATCHING_MODELS,
  SEMANTIC_MIRROR_PAIRS,
  VALUE_EXCHANGE_MODES,
} from '@/config/need-offer-framework.ts'
import { buildMatchTopologyReadModel } from '@/lib/match-topology-read-model.ts'
import { buildOpportunitySemanticReadModel } from '@/lib/need-offer-semantic-read-model.ts'
import type { Opportunity, PostMatch } from '@/types/domain.ts'

describe('need-offer framework config', () => {
  it('defines four matching models with framework labels', () => {
    assert.equal(MATCHING_MODELS.one_way.label, 'One Way Matching')
    assert.equal(MATCHING_MODELS.one_way.subtitle, 'Simple Matching')
    assert.equal(MATCHING_MODELS.two_way.label, 'Two-Way Dependency')
    assert.equal(MATCHING_MODELS.two_way.subtitle, 'Barter')
    assert.equal(MATCHING_MODELS.consortium.label, 'Group Formation')
    assert.equal(MATCHING_MODELS.circular.label, 'Circular Exchange')
  })

  it('defines five value exchange modes', () => {
    assert.equal(VALUE_EXCHANGE_MODES.length, 5)
    assert.deepEqual(
      VALUE_EXCHANGE_MODES.map((mode) => mode.label),
      ['Cash', 'Equity', 'Profit-Sharing', 'Barter', 'Hybrid'],
    )
  })

  it('defines semantic mirror pairs', () => {
    assert.equal(SEMANTIC_MIRROR_PAIRS.length, 4)
    assert.equal(SEMANTIC_MIRROR_PAIRS[0]?.needLabel, 'Required Skills')
    assert.equal(SEMANTIC_MIRROR_PAIRS[0]?.offerLabel, 'Available Skills')
  })
})

describe('buildOpportunitySemanticReadModel', () => {
  it('maps need intent to required-skills vocabulary', () => {
    const model = buildOpportunitySemanticReadModel({
      id: 'need-1',
      title: 'Architect Needed',
      intent: 'need',
      status: 'published',
      scope: { requiredSkills: ['BIM', 'Revit'] },
      exchangeData: { budgetRange: { min: 100_000, max: 200_000, currency: 'SAR' } },
      attributes: { tenderDeadline: '2026-06-01' },
      location: 'Riyadh',
    } as Opportunity)

    assert.equal(model.postTypeLabel, 'Need')
    assert.equal(model.attributes[0]?.label, 'Required Skills')
    assert.match(model.attributes[0]?.value ?? '', /BIM/)
    assert.equal(model.attributes[1]?.label, 'Budget')
    assert.equal(model.attributes[2]?.label, 'Deadline')
    assert.equal(model.attributes[3]?.label, 'Location')
  })

  it('maps offer intent to available-skills vocabulary', () => {
    const model = buildOpportunitySemanticReadModel({
      id: 'offer-1',
      title: 'Structural Engineer Available',
      intent: 'offer',
      status: 'published',
      scope: { offeredSkills: ['SAP2000'] },
      exchangeData: { rateRange: { min: 500, max: 800, currency: 'SAR' } },
      attributes: { availabilityDate: '2026-03-01', preferredLocation: 'Jeddah' },
    } as Opportunity)

    assert.equal(model.postTypeLabel, 'Offer')
    assert.equal(model.attributes[0]?.label, 'Available Skills')
    assert.equal(model.attributes[1]?.label, 'Rate')
    assert.equal(model.attributes[2]?.label, 'Availability')
    assert.equal(model.attributes[3]?.label, 'Preferred Location')
  })
})

describe('buildMatchTopologyReadModel', () => {
  const opportunities: Opportunity[] = [
    { id: 'need-1', title: 'Need A', intent: 'need', status: 'published' },
    { id: 'offer-1', title: 'Offer B', intent: 'offer', status: 'published' },
    { id: 'need-b', title: 'Need B', intent: 'need', status: 'published' },
    { id: 'offer-a', title: 'Offer A', intent: 'offer', status: 'published' },
    { id: 'lead-need', title: 'Lead Need', intent: 'need', status: 'published' },
    { id: 'role-1', title: 'Architect Offer', intent: 'offer', status: 'published' },
  ]

  const lookup = (id: string) => opportunities.find((opp) => opp.id === id)

  it('builds one_way Need → Offer topology', () => {
    const match: PostMatch = {
      id: 'pm-1',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.8,
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [],
    }

    const topology = buildMatchTopologyReadModel(match, lookup)
    assert.equal(topology.topology, 'one_way')
    assert.equal(formatFrameworkMatchTypeLabel(topology.topology), 'One Way Matching')
    assert.equal(topology.nodes.length, 2)
    assert.equal(topology.edges[0]?.fromId, 'need')
    assert.equal(topology.edges[0]?.toId, 'offer')
  })

  it('builds two_way reciprocal edges', () => {
    const match: PostMatch = {
      id: 'pm-2',
      matchType: 'two_way',
      status: 'discovered',
      matchScore: 0.7,
      participants: [],
      payload: {
        sideA: { userId: 'A', needId: 'need-1', offerId: 'offer-a' },
        sideB: { userId: 'B', needId: 'need-b', offerId: 'offer-1' },
      },
    }

    const topology = buildMatchTopologyReadModel(match, lookup)
    assert.equal(topology.topology, 'two_way')
    assert.equal(formatFrameworkMatchTypeSubtitle('two_way'), 'Barter')
    assert.equal(topology.nodes.length, 2)
    assert.equal(topology.nodes[0]?.subtitle, 'Need A')
    assert.equal(topology.nodes[1]?.subtitle, 'Need B')
    assert.equal(topology.edges.length, 1)
    assert.equal(topology.edges[0]?.bidirectional, true)
    assert.equal(topology.edges[0]?.fromId, 'need-a')
    assert.equal(topology.edges[0]?.toId, 'need-b')
  })

  it('builds consortium lead + partner offers', () => {
    const match: PostMatch = {
      id: 'pm-3',
      matchType: 'consortium',
      status: 'discovered',
      matchScore: 0.75,
      participants: [],
      payload: {
        leadNeedId: 'lead-need',
        roles: [{ role: 'Architect', opportunityId: 'role-1', userId: 'u1', score: 0.8 }],
      },
    }

    const topology = buildMatchTopologyReadModel(match, lookup)
    assert.equal(topology.topology, 'consortium')
    assert.equal(topology.nodes[0]?.kind, 'need')
    assert.equal(topology.nodes[1]?.kind, 'offer')
    assert.equal(topology.edges[0]?.fromId, 'lead-need')
  })

  it('builds circular exchange ring', () => {
    const match: PostMatch = {
      id: 'pm-4',
      matchType: 'circular',
      status: 'discovered',
      matchScore: 0.66,
      participants: [],
      payload: {
        cycle: ['c1', 'c2', 'c3'],
        links: [
          { fromCreatorId: 'c1', toCreatorId: 'c2', needId: 'need-b', offerId: 'offer-a', score: 0.7 },
          { fromCreatorId: 'c2', toCreatorId: 'c3', needId: 'need-1', offerId: 'offer-1', score: 0.7 },
          { fromCreatorId: 'c3', toCreatorId: 'c1', needId: 'need-b', offerId: 'offer-a', score: 0.7 },
        ],
      },
    }

    const topology = buildMatchTopologyReadModel(match, lookup, (id) =>
      id === 'c1' ? 'Creator A' : id,
    )
    assert.equal(topology.topology, 'circular')
    assert.equal(topology.nodes.length, 3)
    assert.equal(topology.edges.length, 3)
    assert.equal(topology.edges[2]?.toId, 'party-0')
  })
})
