import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_MATCHING_CONFIG,
  runMatchingForPost,
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

describe('runMatchingForPost — auto routing', () => {
  it('auto request runs one-way need→offers', () => {
    const anchor = publishedNeed('need-anchor', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const pool = [
      publishedOffer('offer-1', 'creator-b', 'Architect', ['BIM', 'Revit']),
      publishedOffer('offer-2', 'creator-c', 'Civil Engineer', ['Structural Analysis']),
    ]

    const results = runMatchingForPost({
      anchorPost: anchor,
      opportunities: [anchor, ...pool],
      config,
      options: { model: 'auto' },
    })

    const oneWay = results.find((result) => result.model === 'one_way')
    assert.ok(oneWay)
    assert.equal(oneWay.matches.length, 1)
    assert.equal(oneWay.matches[0].offerOpportunityId, 'offer-1')
  })

  it('auto offer runs one-way offer→needs', () => {
    const anchor = publishedOffer('offer-anchor', 'creator-b', 'Architect', ['BIM', 'Revit'])
    const pool = [
      publishedNeed('need-1', 'creator-a', 'Architect', ['BIM', 'Revit']),
      publishedNeed('need-2', 'creator-c', 'Civil Engineer', ['Structural Analysis']),
    ]

    const results = runMatchingForPost({
      anchorPost: anchor,
      opportunities: [anchor, ...pool],
      config,
      options: { model: 'auto' },
    })

    const oneWay = results.find((result) => result.model === 'one_way')
    assert.ok(oneWay)
    assert.equal(oneWay.direction, 'offer_to_needs')
    assert.equal(oneWay.matches.length, 1)
    assert.equal(oneWay.matches[0].needOpportunityId, 'need-1')
  })
})

describe('runMatchingForPost — explicit models', () => {
  it('explicit two_way runs barter', () => {
    const needA = publishedNeed('need-a', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const offerA = publishedOffer('offer-a', 'creator-a', 'Architect', ['Project Management', 'Planning'])
    const needB = publishedNeed('need-b', 'creator-b', 'Architect', ['Project Management', 'Planning'])
    const offerB = publishedOffer('offer-b', 'creator-b', 'Architect', ['BIM', 'Revit'])

    const results = runMatchingForPost({
      anchorPost: needA,
      opportunities: [needA, offerA, needB, offerB],
      config,
      options: { model: 'two_way' },
    })

    assert.equal(results.length, 1)
    assert.equal(results[0].model, 'two_way')
    assert.ok(results[0].matches.length >= 1)
  })

  it('explicit consortium returns incomplete results when includeIncompleteConsortium is true', () => {
    const leadNeed = publishedNeed('lead-need', 'lead-creator', 'Architect', ['BIM'], {
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

    const results = runMatchingForPost({
      anchorPost: leadNeed,
      opportunities: [leadNeed, ...offers],
      config,
      options: { model: 'consortium', includeIncompleteConsortium: true },
    })

    const consortium = results[0]
    assert.equal(consortium.model, 'consortium')
    assert.equal(consortium.complete, false)
    assert.equal(consortium.matches.length, 1)
  })

  it('explicit consortium hides incomplete matches when includeIncompleteConsortium is false', () => {
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

    const results = runMatchingForPost({
      anchorPost: leadNeed,
      opportunities: [leadNeed, ...offers],
      config,
      options: { model: 'consortium', includeIncompleteConsortium: false },
    })

    const consortium = results[0]
    assert.equal(consortium.complete, false)
    assert.equal(consortium.matches.length, 0)
  })

  it('explicit circular detects cycle', () => {
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

    const results = runMatchingForPost({
      anchorPost: needs[0],
      opportunities: [...needs, ...offers],
      config,
      options: { model: 'circular', minCycleLength: 3 },
    })

    assert.equal(results.length, 1)
    assert.equal(results[0].model, 'circular')
    assert.ok(results[0].matches.length >= 1)
    assert.equal(results[0].matches[0].cycle?.length, 3)
  })
})

describe('runMatchingForPost — limits and constraints', () => {
  it('topN limits ranked output', () => {
    const anchor = publishedNeed('need-anchor', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const pool = [
      publishedOffer('offer-1', 'creator-b', 'Architect', ['BIM', 'Revit']),
      publishedOffer('offer-2', 'creator-c', 'Architect', ['BIM', 'Revit', 'Design']),
      publishedOffer('offer-3', 'creator-d', 'Architect', ['BIM', 'Revit', 'Coordination']),
    ]

    const results = runMatchingForPost({
      anchorPost: anchor,
      opportunities: [anchor, ...pool],
      config,
      options: { model: 'one_way', topN: 1 },
    })

    assert.equal(results[0].matches.length, 1)
    assert.ok(results[0].matches[0].compositeRank != null)
  })

  it('hard constraints still apply', () => {
    const anchor = publishedNeed('need-anchor-2', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const pool = [
      publishedOffer('offer-bad', 'creator-b', 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
    ]

    const results = runMatchingForPost({
      anchorPost: anchor,
      opportunities: [anchor, ...pool],
      config,
      options: { model: 'one_way' },
    })

    assert.equal(results[0].matches.length, 0)
  })

  it('empty pool returns empty one-way results', () => {
    const anchor = publishedNeed('need-alone', 'creator-a', 'Architect', ['BIM', 'Revit'])

    const results = runMatchingForPost({
      anchorPost: anchor,
      opportunities: [anchor],
      config,
      options: { model: 'one_way' },
    })

    assert.equal(results.length, 1)
    assert.equal(results[0].matches.length, 0)
  })

  it('config defaults are applied when config is omitted', () => {
    const anchor = publishedNeed('need-defaults', 'creator-a', 'Architect', ['BIM', 'Revit'])
    const pool = [
      publishedOffer('offer-defaults', 'creator-b', 'Architect', ['BIM', 'Revit']),
    ]

    const results = runMatchingForPost({
      anchorPost: anchor,
      opportunities: [anchor, ...pool],
    })

    assert.equal(results[0].matches.length, 1)
    assert.equal(DEFAULT_MATCHING_CONFIG.POST_TO_POST_THRESHOLD, 0.50)
    assert.ok(results[0].matches[0].matchScore >= DEFAULT_MATCHING_CONFIG.POST_TO_POST_THRESHOLD)
  })
})
