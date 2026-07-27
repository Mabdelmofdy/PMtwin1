import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  barterSidePost,
  buildCircularLinkScores,
  findBarterMatchesPure,
  findCircularExchangesPure,
  findConsortiumMatchesPure,
  findNeedsForOfferPure,
  findOffersForNeedPure,
  normalizeCycleRing,
  withMatchingDefaults,
} from '../dist/index.js'

const config = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.50,
  MIN_SKILL_SCORE_FOR_MATCH: 0.50,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
})

function publishedNeed(id, creatorId, role, services, overrides = {}) {
  return {
    id,
    creatorId,
    intent: 'request',
    status: 'published',
    modelType: 'project_based',
    attributes: { targetRole: role, locationRequirement: 'remote' },
    normalized: {
      role,
      requiredServices: services,
      skills: services,
      location: 'remote',
      modelType: 'project_based',
    },
    ...overrides,
  }
}

function publishedOffer(id, creatorId, role, services, overrides = {}) {
  return {
    id,
    creatorId,
    intent: 'offer',
    status: 'published',
    modelType: 'project_based',
    attributes: { targetRole: role, locationRequirement: 'remote' },
    normalized: {
      role,
      offeredServices: services,
      skills: services,
      location: 'remote',
      modelType: 'project_based',
    },
    ...overrides,
  }
}

describe('model runners — one-way', () => {
  it('finds compatible offer for a need', () => {
    const need = publishedNeed('need-1', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const offers = [
      publishedOffer('offer-1', 'creator-b', 'Architect', ['BIM', 'Revit']),
      publishedOffer('offer-2', 'creator-c', 'Civil Engineer', ['Structural Analysis']),
    ]

    const result = findOffersForNeedPure(need, offers, config)
    assert.equal(result.model, 'one_way')
    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].offerOpportunityId, 'offer-1')
    assert.ok(result.matches[0].matchScore >= 0.5)
  })

  it('finds compatible need for an offer', () => {
    const offer = publishedOffer('offer-10', 'creator-b', 'Architect', ['BIM', 'Revit'])
    const needs = [
      publishedNeed('need-10', 'creator-a', 'Architect', ['BIM', 'Revit']),
      publishedNeed('need-11', 'creator-c', 'Civil Engineer', ['Structural Analysis']),
    ]

    const result = findNeedsForOfferPure(offer, needs, config)
    assert.equal(result.direction, 'offer_to_needs')
    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].needOpportunityId, 'need-10')
  })

  it('hard constraints block invalid role matches', () => {
    const need = publishedNeed('need-2', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const offers = [
      publishedOffer('offer-3', 'creator-b', 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
    ]

    const result = findOffersForNeedPure(need, offers, config)
    assert.equal(result.matches.length, 0)
  })
})

describe('model runners — two-way barter', () => {
  it('requires both directions above threshold', () => {
    const needA = publishedNeed('need-a', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const offerA = publishedOffer('offer-a', 'creator-a', 'Architect', ['Project Management', 'Planning'])
    const needB = publishedNeed('need-b', 'creator-b', 'Architect', ['Project Management', 'Planning'])
    const offerB = publishedOffer('offer-b', 'creator-b', 'Architect', ['BIM', 'Revit'])
    const weakOffer = publishedOffer('offer-c', 'creator-c', 'Architect', ['SketchUp'])

    const positive = findBarterMatchesPure(
      needA,
      [needA, needB],
      [offerA, offerB, weakOffer],
      config,
    )
    assert.ok(positive.matches.length >= 1)
    assert.equal(positive.matches[0].suggestedPartners.length, 2)

    const negative = findBarterMatchesPure(
      needA,
      [needA, publishedNeed('need-x', 'creator-x', 'Architect', ['BIM'])],
      [offerA, publishedOffer('offer-x', 'creator-x', 'Architect', ['SketchUp'])],
      config,
    )
    assert.equal(negative.matches.length, 0)
  })

  it('builds deterministic barter side payload', () => {
    const need = publishedNeed('need-barter', 'creator-a', 'Architect', ['BIM'], {
      value_exchange: { estimated_value: 100000 },
    })
    const offer = publishedOffer('offer-barter', 'creator-a', 'Architect', ['BIM'], {
      value_exchange: { estimated_value: 90000 },
    })

    const first = barterSidePost(need, offer)
    const second = barterSidePost(need, offer)
    assert.deepEqual(first, second)
    assert.equal(first.value_exchange._normalized.totalOffered, 90000)
    assert.equal(first.value_exchange._normalized.totalExpected, 100000)
  })
})

describe('model runners — consortium', () => {
  it('assigns best offer per role', () => {
    const leadNeed = publishedNeed('lead-need', 'lead-creator', 'Architect', ['BIM'], {
      attributes: {
        targetRole: 'Architect',
        memberRoles: [
          { role: 'Architect', scope: 'BIM Revit' },
          { role: 'Civil Engineer' },
        ],
      },
    })

    const offers = [
      publishedOffer('offer-arch-1', 'arch-1', 'Architect', ['BIM', 'Revit', 'Architect']),
      publishedOffer('offer-arch-2', 'arch-2', 'Architect', ['BIM']),
      publishedOffer('offer-civil-1', 'civil-1', 'Civil Engineer', [
        'Civil Engineer',
        'Structural Analysis',
        'SAP2000',
      ]),
    ]

    const result = findConsortiumMatchesPure(leadNeed, offers, config)
    assert.equal(result.model, 'consortium')
    assert.equal(result.complete, true)
    assert.equal(result.roleResults?.length, 2)
    assert.equal(result.matches[0].suggestedPartners.length, 2)
    const roles = result.roleResults?.map((entry) => entry.role)
    assert.ok(roles?.includes('Architect'))
    assert.ok(roles?.includes('Civil Engineer'))
  })

  it('fails when a required role has no compatible offer', () => {
    const leadNeed = publishedNeed('lead-need-2', 'lead-creator', 'Architect', ['BIM'], {
      attributes: {
        targetRole: 'Architect',
        memberRoles: [
          { role: 'Architect', scope: 'BIM' },
          { role: 'Structural Engineer', scope: 'Bridge Design' },
        ],
      },
    })

    const offers = [
      publishedOffer('offer-arch-only', 'arch-only', 'Architect', ['BIM', 'Revit']),
    ]

    const result = findConsortiumMatchesPure(leadNeed, offers, config)
    assert.equal(result.complete, false)
    assert.equal(result.roleResults?.length, 1)
    assert.equal(result.matches.length, 1)
    assert.ok(result.matches[0].matchScore > 0)
  })

  it('fills Architect + Structural roles with UAT-like scopes despite lead coreSkills', () => {
    const leadNeed = publishedNeed(
      'lead-uat',
      'company-lead',
      'Architect',
      ['BIM', 'Revit'],
      {
        attributes: {
          targetRole: 'Architect',
          memberRoles: [
            {
              role: 'Architect',
              scope: 'BIM coordination, Revit modeling, design packages',
            },
            {
              role: 'Structural Engineer',
              scope: 'Structural analysis, SAP2000 models, foundation design',
            },
          ],
        },
        normalized: {
          role: 'Architect',
          requiredServices: ['BIM', 'Revit'],
          skills: ['BIM', 'Revit'],
          coreSkills: ['BIM', 'Revit'],
          location: 'remote',
          modelType: 'project_based',
        },
      },
    )

    const offers = [
      publishedOffer('offer-khalid', 'khalid', 'Architect', ['BIM', 'Revit']),
      publishedOffer('offer-hala', 'hala', 'Structural Engineer', [
        'Structural Analysis',
        'SAP2000',
      ]),
    ]

    const result = findConsortiumMatchesPure(leadNeed, offers, config)
    assert.equal(result.complete, true)
    assert.equal(result.roleResults?.length, 2)
    const byRole = Object.fromEntries(
      (result.roleResults ?? []).map((entry) => [entry.role, entry.opportunityId]),
    )
    assert.equal(byRole.Architect, 'offer-khalid')
    assert.equal(byRole['Structural Engineer'], 'offer-hala')
  })
})

describe('model runners — circular', () => {
  it('detects a 3-party cycle', () => {
    const needs = [
      publishedNeed('need-a', 'creator-a', 'Architect', ['BIM', 'Revit']),
      publishedNeed('need-b', 'creator-b', 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
      publishedNeed('need-c', 'creator-c', 'Architect', ['Project Management', 'Planning']),
    ]
    const offers = [
      publishedOffer('offer-a', 'creator-a', 'Architect', ['Project Management', 'Planning']),
      publishedOffer('offer-b', 'creator-b', 'Architect', ['BIM', 'Revit']),
      publishedOffer('offer-c', 'creator-c', 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
    ]

    const result = findCircularExchangesPure(needs, offers, config, {}, { minCycleLength: 3 })
    assert.equal(result.model, 'circular')
    assert.ok(result.matches.length >= 1)
    const cycle = result.matches[0].cycle ?? []
    assert.equal(cycle.length, 3)
    assert.equal(result.matches[0].linkScores?.length, 3)
  })

  it('normalizes duplicate closing rings', () => {
    assert.deepEqual(normalizeCycleRing(['creator-a', 'creator-b', 'creator-c', 'creator-a']), [
      'creator-a',
      'creator-b',
      'creator-c',
    ])
  })

  it('builds stable circular link scores', () => {
    const ring = ['creator-a', 'creator-b', 'creator-c']
    const edgeDetails = {
      'creator-a->creator-b': {
        score: 0.8,
        need: { id: 'need-a' },
        offer: { id: 'offer-b' },
      },
      'creator-b->creator-c': {
        score: 0.7,
        need: { id: 'need-b' },
        offer: { id: 'offer-c' },
      },
      'creator-c->creator-a': {
        score: 0.9,
        need: { id: 'need-c' },
        offer: { id: 'offer-a' },
      },
    }

    const first = buildCircularLinkScores(ring, edgeDetails)
    const second = buildCircularLinkScores(ring, edgeDetails)
    assert.deepEqual(first, second)
    assert.deepEqual(first, [
      {
        fromCreatorId: 'creator-a',
        toCreatorId: 'creator-b',
        needId: 'need-a',
        offerId: 'offer-b',
        score: 0.8,
      },
      {
        fromCreatorId: 'creator-b',
        toCreatorId: 'creator-c',
        needId: 'need-b',
        offerId: 'offer-c',
        score: 0.7,
      },
      {
        fromCreatorId: 'creator-c',
        toCreatorId: 'creator-a',
        needId: 'need-c',
        offerId: 'offer-a',
        score: 0.9,
      },
    ])
  })
})
