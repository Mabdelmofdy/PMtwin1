import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMatchingDiscoveryContext,
  buildDiscoverParticipant,
  filterCrossOwnerPartyMatches,
  resolveOpportunityOwner,
  sameOwnerParty,
} from './matching-discovery-context.ts'
import { modelRunResultToDiscoverCommands } from '@/services/matching/model-run-discover-adapter.ts'
import type { Opportunity } from '@/types/domain.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'

const ctx = buildMatchingDiscoveryContext(
  ['user-personal-a', 'user-personal-b', 'employee-co-a'],
  ['seed-co-corp-001'],
)

function opp(
  id: string,
  overrides: Partial<Opportunity> = {},
): Opportunity {
  return {
    id,
    title: id,
    status: 'published',
    creatorId: overrides.creatorId ?? 'user-personal-a',
    ...overrides,
  } as Opportunity
}

describe('matching discovery canonical scoping', () => {
  it('isolates personal workspace discovery by owner party', () => {
    const personalA = opp('opp-a', {
      creatorId: 'user-personal-a',
      ownerPartyId: 'party-individual-user-personal-a',
      workspaceId: 'ws-personal-user-personal-a',
      createdByUserId: 'user-personal-a',
    })
    const personalB = opp('opp-b', {
      creatorId: 'user-personal-b',
      ownerPartyId: 'party-individual-user-personal-b',
      workspaceId: 'ws-personal-user-personal-b',
      createdByUserId: 'user-personal-b',
    })

    assert.equal(
      filterCrossOwnerPartyMatches('opp-a', 'opp-b', new Map([
        ['opp-a', personalA],
        ['opp-b', personalB],
      ]), ctx),
      true,
    )
    assert.equal(
      sameOwnerParty(
        resolveOpportunityOwner(personalA, ctx)?.ownerPartyId,
        resolveOpportunityOwner(personalB, ctx)?.ownerPartyId,
      ),
      false,
    )
  })

  it('isolates company workspace discovery by owner party', () => {
    const companyNeed = opp('need-co', {
      creatorId: 'seed-co-corp-001',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
    })
    const personalOffer = opp('offer-personal', {
      creatorId: 'user-personal-b',
      ownerPartyId: 'party-individual-user-personal-b',
      workspaceId: 'ws-personal-user-personal-b',
      createdByUserId: 'user-personal-b',
    })

    assert.equal(
      filterCrossOwnerPartyMatches(
        'need-co',
        'offer-personal',
        new Map([
          ['need-co', companyNeed],
          ['offer-personal', personalOffer],
        ]),
        ctx,
      ),
      true,
    )
  })

  it('shares company-owned discovery context across employees with same owner party', () => {
    const employeeOne = opp('co-opp-1', {
      creatorId: 'employee-co-a',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
      createdByUserId: 'employee-co-a',
    })
    const employeeTwo = opp('co-opp-2', {
      creatorId: 'employee-co-b',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
      createdByUserId: 'employee-co-b',
    })

    const ownerOne = resolveOpportunityOwner(employeeOne, ctx)?.ownerPartyId
    const ownerTwo = resolveOpportunityOwner(employeeTwo, ctx)?.ownerPartyId
    assert.equal(ownerOne, ownerTwo)
    assert.equal(
      filterCrossOwnerPartyMatches('co-opp-1', 'co-opp-2', new Map([
        ['co-opp-1', employeeOne],
        ['co-opp-2', employeeTwo],
      ]), ctx),
      false,
    )
  })

  it('scopes differently when switching between personal and company workspaces', () => {
    const personal = opp('personal-opp', {
      ownerPartyId: 'party-individual-user-personal-a',
      workspaceId: 'ws-personal-user-personal-a',
      createdByUserId: 'user-personal-a',
    })
    const company = opp('company-opp', {
      creatorId: 'seed-co-corp-001',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
    })

    const personalOwner = resolveOpportunityOwner(personal, ctx)
    const companyOwner = resolveOpportunityOwner(company, ctx)
    assert.notEqual(personalOwner?.workspaceId, companyOwner?.workspaceId)
    assert.notEqual(personalOwner?.ownerPartyId, companyOwner?.ownerPartyId)
  })

  it('does not treat creatorId alone as business ownership when canonical fields exist', () => {
    const companyOwned = opp('company-owned', {
      creatorId: 'employee-co-a',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
      createdByUserId: 'employee-co-a',
    })
    const owner = resolveOpportunityOwner(companyOwned, ctx)
    assert.notEqual(owner?.ownerPartyId, 'employee-co-a')
    assert.equal(owner?.ownerPartyId, 'party-company-seed-co-corp-001')
  })

  it('filters one-way discover commands with same owner party (no cross-workspace leakage)', () => {
    const need = opp('need', {
      creatorId: 'employee-co-a',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
      createdByUserId: 'employee-co-a',
      intent: 'request',
    })
    const offer = opp('offer', {
      creatorId: 'employee-co-b',
      ownerPartyId: 'party-company-seed-co-corp-001',
      workspaceId: 'ws-company-seed-co-corp-001',
      createdByUserId: 'employee-co-b',
      intent: 'offer',
    })
    const opportunityById = new Map([
      ['need', need],
      ['offer', offer],
    ])
    const posts = [opportunityToPost(need), opportunityToPost(offer)]
    const postById = new Map(posts.map((post) => [post.id as string, post]))

    const commands = modelRunResultToDiscoverCommands(
      {
        model: 'one_way',
        matches: [{
          needOpportunityId: 'need',
          offerOpportunityId: 'offer',
          matchScore: 0.9,
        }],
      },
      {
        anchorOpportunity: need,
        opportunityById,
        postById,
        ownershipContext: ctx,
        runId: 'run-test',
        createAggregateId: () => 'pm-test',
      },
      posts,
    )

    assert.equal(commands.length, 0)
  })

  it('builds discover participants with canonical party and workspace metadata', () => {
    const opportunity = opp('opp-canonical', {
      ownerPartyId: 'party-individual-user-personal-a',
      workspaceId: 'ws-personal-user-personal-a',
      createdByUserId: 'user-personal-a',
    })
    const participant = buildDiscoverParticipant(opportunity, 'need_owner', ctx)
    assert.equal(participant?.partyId, 'party-individual-user-personal-a')
    assert.equal(participant?.workspaceId, 'ws-personal-user-personal-a')
    assert.equal(participant?.userId, 'user-personal-a')
  })
})
