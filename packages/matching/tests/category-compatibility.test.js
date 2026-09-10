import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryFit,
  categoryOverlap,
  collaborationModelCompatible,
  findOffersForNeedPure,
  getCandidates,
  MATCHING_REJECT_REASONS,
  scorePair,
  withMatchingDefaults,
} from '../dist/index.js'

const config = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.50,
  MIN_SKILL_SCORE_FOR_MATCH: 0.50,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
})

function need(categories, extraNormalized = {}, extraPost = {}) {
  return {
    id: 'need-cat',
    creatorId: 'creator-need',
    intent: 'request',
    status: 'published',
    modelType: 'project_based',
    subModelType: 'task_based',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'cash', estimated_value: 100000 },
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
      location: 'remote',
      modelType: 'project_based',
      subModelType: 'task_based',
      categories: ['project_based', 'task_based', ...categories],
      budget: { min: 50000, max: 150000 },
      timeline: { start: '2026-01-01', end: '2026-12-31' },
      reputation: 0.8,
      ...extraNormalized,
    },
    ...extraPost,
  }
}

function offer(categories, extraNormalized = {}, extraPost = {}) {
  return {
    id: 'offer-cat',
    creatorId: 'creator-offer',
    intent: 'offer',
    status: 'published',
    modelType: 'project_based',
    subModelType: 'task_based',
    attributes: { targetRole: 'Architect' },
    value_exchange: { mode: 'cash', estimated_value: 95000 },
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
      location: 'remote',
      modelType: 'project_based',
      subModelType: 'task_based',
      categories: ['project_based', 'task_based', ...categories],
      budget: { min: 80000, max: 120000 },
      availability: { start: '2026-02-01', end: '2026-11-30' },
      reputation: 0.9,
      ...extraNormalized,
    },
    ...extraPost,
  }
}

describe('category matching — soft compatibility', () => {
  it('A. same category remains eligible and scores categoryFit positively', () => {
    const needPost = need(['Electrical'])
    const offerPost = offer(['Electrical'])
    const result = findOffersForNeedPure(needPost, [offerPost], config)
    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].breakdown.categoryFit, 1)
    assert.ok(result.matches[0].matchScore >= 0.5)
    assert.equal(categoryOverlap(needPost.normalized, offerPost.normalized), true)
  })

  it('B. different categories stay eligible and score lower than same-category', () => {
    const sameNeed = need(['Electrical'])
    const sameOffer = offer(['Electrical'])
    const mismatchOffer = offer(['HVAC'])
    const sameResult = findOffersForNeedPure(sameNeed, [sameOffer], config)
    const mismatchResult = findOffersForNeedPure(sameNeed, [mismatchOffer], config)

    assert.equal(mismatchResult.matches.length, 1, 'category mismatch must not reject')
    assert.equal(mismatchResult.matches[0].breakdown.categoryFit, 0)
    assert.ok(sameResult.matches.length === 1)
    assert.ok(
      mismatchResult.matches[0].matchScore < sameResult.matches[0].matchScore,
      'mismatch score should be below same-category score',
    )
    assert.equal(
      mismatchResult.diagnostic.candidates[0]?.rejectReason,
      undefined,
    )
  })

  it('C. empty Need category does not reject', () => {
    const result = findOffersForNeedPure(need([]), [offer(['Electrical'])], config)
    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].breakdown.categoryFit, 1)
  })

  it('D. empty Offer category does not reject', () => {
    const result = findOffersForNeedPure(need(['Electrical']), [offer([])], config)
    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].breakdown.categoryFit, 1)
  })

  it('E. both categories empty does not reject', () => {
    const result = findOffersForNeedPure(need([]), [offer([])], config)
    assert.equal(result.matches.length, 1)
  })

  it('F. incompatible collaboration models still reject', () => {
    const hiringOffer = offer(['Electrical'], {
      modelType: 'hiring',
      subModelType: 'professional_hiring',
      categories: ['hiring', 'professional_hiring', 'Electrical'],
    }, {
      modelType: 'hiring',
      subModelType: 'professional_hiring',
    })
    const result = findOffersForNeedPure(need(['Electrical']), [hiringOffer], config)
    assert.equal(result.matches.length, 0)
    assert.equal(
      result.diagnostic.candidates[0]?.rejectReason,
      MATCHING_REJECT_REASONS.COLLABORATION_MODEL_INCOMPATIBLE,
    )
    assert.equal(
      collaborationModelCompatible(
        need(['Electrical']).normalized,
        hiringOffer.normalized,
      ),
      false,
    )
  })

  it('candidate generator does not drop sector mismatch under the same model', () => {
    const candidates = getCandidates(
      need(['Electrical']),
      [offer(['HVAC'])],
      config,
    )
    assert.equal(candidates.length, 1)
  })

  it('scorePair applies a small category bonus without leaving 0–1', () => {
    const same = scorePair(need(['Electrical']), offer(['Electrical']), config)
    const different = scorePair(need(['Electrical']), offer(['HVAC']), config)
    assert.ok(same.score <= 1)
    assert.ok(different.score <= 1)
    assert.ok(same.score > different.score)
    assert.equal(same.breakdown.categoryFit, 1)
    assert.equal(different.breakdown.categoryFit, 0)
    assert.equal(categoryFit(need(['Electrical']).normalized, offer(['HVAC']).normalized).score, 0)
  })
})
