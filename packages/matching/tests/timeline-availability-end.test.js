import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractAndNormalize,
  extractTimeline,
  getCandidates,
  timelineFit,
  timelineOverlap,
  withMatchingDefaults,
} from '../dist/index.js'

/** Same Date parsing as timelineFit / timelineOverlap (ISO date-only = UTC). */
function expectedTimelineFitScore(needStart, needEnd, offerStart, offerEnd) {
  const toDate = (value) => new Date(value).getTime()
  const nStart = toDate(needStart)
  const nEnd = toDate(needEnd)
  const oStart = toDate(offerStart)
  const oEnd = toDate(offerEnd)
  const overlap = Math.max(0, Math.min(nEnd, oEnd) - Math.max(nStart, oStart))
  const needLen = nEnd - nStart
  return needLen > 0 ? overlap / needLen : 0.5
}

function needPost(overrides = {}) {
  return {
    intent: 'request',
    attributes: {
      startDate: '2026-01-01',
      tenderDeadline: '2026-12-31',
      ...(overrides.attributes ?? {}),
    },
    ...overrides,
  }
}

function offerPost(availabilityEndDate, extraAttributes = {}) {
  return {
    intent: 'offer',
    attributes: {
      startDate: '2026-01-01',
      availabilityEndDate,
      ...extraAttributes,
    },
  }
}

describe('timelineFit — Offer availabilityEndDate', () => {
  it('scores a short Offer window as low partial overlap against a year-long Need', () => {
    const needNorm = extractAndNormalize(
      needPost({
        attributes: { startDate: '2026-01-01', tenderDeadline: '2026-12-31' },
      }),
    )
    const offerNorm = extractAndNormalize(offerPost('2026-03-01'))
    const result = timelineFit(needNorm, offerNorm)
    const expected = expectedTimelineFitScore(
      '2026-01-01',
      '2026-12-31',
      '2026-01-01',
      '2026-03-01',
    )
    assert.equal(offerNorm.timeline?.end, '2026-03-01')
    assert.equal(offerNorm.availability?.end, '2026-03-01')
    assert.ok(expected > 0 && expected < 0.25, `expected low partial, got ${expected}`)
    assert.equal(result.score, expected)
    assert.equal(result.label, 'No Match')
  })

  it('scores identical Need and Offer windows as 1.0', () => {
    const needNorm = extractAndNormalize(
      needPost({
        attributes: { startDate: '2026-01-01', tenderDeadline: '2026-06-01' },
      }),
    )
    const offerNorm = extractAndNormalize(offerPost('2026-06-01'))
    const result = timelineFit(needNorm, offerNorm)
    assert.equal(offerNorm.availability?.end, '2026-06-01')
    assert.equal(result.score, 1)
    assert.equal(result.label, 'Match')
  })

  it('rejects an Offer whose availabilityEndDate is before the Need start date', () => {
    const needNorm = extractAndNormalize(
      needPost({
        attributes: { startDate: '2026-06-01', tenderDeadline: '2026-12-31' },
      }),
    )
    const offerNorm = extractAndNormalize(offerPost('2026-03-01'))
    assert.equal(timelineOverlap(needNorm, offerNorm), false)
    assert.equal(timelineFit(needNorm, offerNorm).score, 0)
  })

  it('produces different Offer ends and Timeline Fit when only availabilityEndDate differs', () => {
    const needNorm = extractAndNormalize(
      needPost({
        attributes: { startDate: '2026-01-01', tenderDeadline: '2026-06-01' },
      }),
    )
    const shortOffer = extractAndNormalize(offerPost('2026-03-01'))
    const fullOffer = extractAndNormalize(offerPost('2026-06-01'))

    assert.equal(extractTimeline(offerPost('2026-03-01')).end, '2026-03-01')
    assert.equal(extractTimeline(offerPost('2026-06-01')).end, '2026-06-01')
    assert.notEqual(shortOffer.timeline?.end, fullOffer.timeline?.end)
    assert.notEqual(
      timelineFit(needNorm, shortOffer).score,
      timelineFit(needNorm, fullOffer).score,
    )
    assert.equal(timelineFit(needNorm, fullOffer).score, 1)
    assert.ok(timelineFit(needNorm, shortOffer).score < 1)
  })
})

describe('candidate generation — Offer availabilityEndDate overlap', () => {
  it('excludes an Offer whose availabilityEndDate is before the Need start', () => {
    const config = withMatchingDefaults()
    const need = {
      id: 'need-1',
      creatorId: 'user-need',
      intent: 'request',
      status: 'published',
      attributes: {
        targetRole: 'Architect',
        startDate: '2026-06-01',
        tenderDeadline: '2026-12-31',
      },
      scope: { requiredSkills: ['BIM'] },
    }
    const overlapping = {
      id: 'offer-overlap',
      creatorId: 'user-offer-a',
      intent: 'offer',
      status: 'published',
      attributes: {
        targetRole: 'Architect',
        startDate: '2026-01-01',
        availabilityEndDate: '2026-12-31',
      },
      scope: { offeredSkills: ['BIM'] },
    }
    const tooEarly = {
      id: 'offer-early',
      creatorId: 'user-offer-b',
      intent: 'offer',
      status: 'published',
      attributes: {
        targetRole: 'Architect',
        startDate: '2026-01-01',
        availabilityEndDate: '2026-03-01',
      },
      scope: { offeredSkills: ['BIM'] },
    }

    const needNorm = extractAndNormalize(need)
    const candidates = getCandidates(
      { ...need, normalized: needNorm },
      [
        { ...overlapping, normalized: extractAndNormalize(overlapping) },
        { ...tooEarly, normalized: extractAndNormalize(tooEarly) },
      ],
      config,
    )
    assert.deepEqual(
      candidates.map((candidate) => candidate.id),
      ['offer-overlap'],
    )
  })
})
