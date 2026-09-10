import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  scorePair,
  timelineFit,
  timelineOverlap,
  withMatchingDefaults,
} from '../dist/index.js'

const MS_PER_UTC_DAY = 86_400_000
const config = withMatchingDefaults()

function utcDay(value) {
  return new Date(value).getTime()
}

function inclusiveDays(start, end) {
  return Math.round((utcDay(end) - utcDay(start)) / MS_PER_UTC_DAY) + 1
}

function expectedFit(needStart, needEnd, offerStart, offerEnd) {
  const nStart = utcDay(needStart)
  const nEnd = utcDay(needEnd)
  const oStart = utcDay(offerStart)
  const oEnd = utcDay(offerEnd)
  if (oStart > nEnd || nStart > oEnd) return 0
  const needDays = inclusiveDays(needStart, needEnd)
  if (needDays <= 0) return 0
  const overlapDays = inclusiveDays(
    nStart > oStart ? needStart : offerStart,
    nEnd < oEnd ? needEnd : offerEnd,
  )
  return Math.max(0, Math.min(1, overlapDays / needDays))
}

function needNorm(start, end) {
  return { timeline: { start, end } }
}

function offerNorm(start, end) {
  return { availability: { start, end } }
}

const NEED_Q4 = needNorm('2026-10-01', '2026-12-31')
const NEED_DAYS = inclusiveDays('2026-10-01', '2026-12-31')

const scoredPairBase = {
  intent: 'request',
  value_exchange: { mode: 'cash', estimated_value: 100000 },
  normalized: {
    role: 'Architect',
    requiredServices: ['BIM', 'Revit'],
    location: 'Riyadh',
    budget: { min: 50000, max: 150000 },
    reputation: 0.8,
  },
}

function pairWithTimeline(needTimeline, offerAvailability) {
  const need = {
    ...scoredPairBase,
    id: 'need-timeline',
    normalized: {
      ...scoredPairBase.normalized,
      timeline: needTimeline,
    },
  }
  const offer = {
    id: 'offer-timeline',
    intent: 'offer',
    value_exchange: { mode: 'cash', estimated_value: 95000 },
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM', 'Revit'],
      location: 'Riyadh',
      budget: { min: 80000, max: 120000 },
      availability: offerAvailability,
      reputation: 0.9,
    },
  }
  return scorePair(need, offer, config)
}

describe('timelineFit — complete identical timelines', () => {
  it('scores identical complete windows as 1.0', () => {
    const result = timelineFit(
      NEED_Q4,
      offerNorm('2026-10-01', '2026-12-31'),
    )
    assert.equal(result.score, 1)
    assert.equal(result.label, 'Match')
  })
})

describe('timelineFit — proportional overlap', () => {
  it('scores October-only overlap as overlapDays / needDays', () => {
    const result = timelineFit(
      NEED_Q4,
      offerNorm('2026-10-01', '2026-10-31'),
    )
    const expected = expectedFit(
      '2026-10-01',
      '2026-12-31',
      '2026-10-01',
      '2026-10-31',
    )
    assert.equal(NEED_DAYS, 92)
    assert.equal(inclusiveDays('2026-10-01', '2026-10-31'), 31)
    assert.equal(expected, 31 / 92)
    assert.equal(result.score, expected)
    assert.ok(result.score > 0 && result.score < 1)
    assert.notEqual(result.score, 0.5)
  })

  it('scores a smaller December overlap lower than the October-only overlap', () => {
    const october = timelineFit(NEED_Q4, offerNorm('2026-10-01', '2026-10-31'))
    const december = timelineFit(NEED_Q4, offerNorm('2026-12-01', '2026-12-15'))
    assert.equal(
      december.score,
      expectedFit('2026-10-01', '2026-12-31', '2026-12-01', '2026-12-15'),
    )
    assert.equal(december.score, 15 / 92)
    assert.ok(december.score < october.score)
  })

  it('scores an Offer that fully covers the Need as 1.0', () => {
    const result = timelineFit(
      NEED_Q4,
      offerNorm('2026-09-01', '2027-01-31'),
    )
    assert.equal(result.score, 1)
  })
})

describe('timelineFit — no overlap', () => {
  it('scores disjoint complete windows as 0.0', () => {
    const result = timelineFit(
      needNorm('2026-10-01', '2026-10-31'),
      offerNorm('2026-11-01', '2026-12-31'),
    )
    assert.equal(result.score, 0)
    assert.equal(timelineOverlap(
      needNorm('2026-10-01', '2026-10-31'),
      offerNorm('2026-11-01', '2026-12-31'),
    ), false)
  })
})

describe('timelineFit — boundary-date overlap', () => {
  it('keeps shared boundary dates eligible and scores one inclusive day', () => {
    const need = needNorm('2026-10-01', '2026-10-31')
    const offer = offerNorm('2026-10-31', '2026-11-30')
    assert.equal(timelineOverlap(need, offer), true)
    const result = timelineFit(need, offer)
    assert.equal(result.score, 1 / 31)
    assert.ok(result.score > 0)
    assert.ok(result.score < 1)
  })
})

describe('timelineFit — missing and partial information', () => {
  it('scores both timelines missing as 0.0, not 1.0', () => {
    const result = timelineFit({}, {})
    assert.equal(result.score, 0)
    assert.notEqual(result.score, 1)
    assert.equal(timelineOverlap({}, {}), true)
  })

  it('scores Need start-only as 0.0, not 0.5', () => {
    const result = timelineFit(
      { timeline: { start: '2026-10-01' } },
      offerNorm('2026-10-01', '2026-12-31'),
    )
    assert.equal(result.score, 0)
    assert.notEqual(result.score, 0.5)
    assert.notEqual(result.score, 1)
  })

  it('scores Need end-only as 0.0, not 0.5', () => {
    const result = timelineFit(
      { timeline: { end: '2026-12-31' }, deadline: '2026-12-31' },
      offerNorm('2026-10-01', '2026-12-31'),
    )
    assert.equal(result.score, 0)
    assert.notEqual(result.score, 0.5)
  })

  it('scores Offer start-only as 0.0, not 0.5', () => {
    const result = timelineFit(
      NEED_Q4,
      { availability: { start: '2026-10-01' } },
    )
    assert.equal(result.score, 0)
    assert.notEqual(result.score, 0.5)
  })

  it('scores Offer end-only as 0.0, not 0.5', () => {
    const result = timelineFit(
      NEED_Q4,
      { availability: { end: '2026-12-31' } },
    )
    assert.equal(result.score, 0)
    assert.notEqual(result.score, 0.5)
  })
})

describe('timelineFit — overlap ordering', () => {
  it('orders no overlap < small < large < full for the same Need', () => {
    const none = timelineFit(NEED_Q4, offerNorm('2026-08-01', '2026-08-31'))
    const small = timelineFit(NEED_Q4, offerNorm('2026-12-01', '2026-12-15'))
    const large = timelineFit(NEED_Q4, offerNorm('2026-10-01', '2026-10-31'))
    const full = timelineFit(NEED_Q4, offerNorm('2026-10-01', '2026-12-31'))
    assert.equal(none.score, 0)
    assert.equal(small.score, 15 / 92)
    assert.equal(large.score, 31 / 92)
    assert.equal(full.score, 1)
    assert.ok(none.score < small.score)
    assert.ok(small.score < large.score)
    assert.ok(large.score < full.score)
  })
})

describe('timelineFit — edge cases', () => {
  it('scores a same-day Need and Offer as 1.0', () => {
    const result = timelineFit(
      needNorm('2026-10-15', '2026-10-15'),
      offerNorm('2026-10-15', '2026-10-15'),
    )
    assert.equal(result.score, 1)
  })

  it('scores start == end Need against a covering Offer as 1.0', () => {
    const result = timelineFit(
      needNorm('2026-10-15', '2026-10-15'),
      offerNorm('2026-10-01', '2026-10-31'),
    )
    assert.equal(result.score, 1)
  })

  it('scores an inverted Need range as 0.0', () => {
    const result = timelineFit(
      needNorm('2026-12-31', '2026-10-01'),
      offerNorm('2026-10-01', '2026-12-31'),
    )
    assert.equal(result.score, 0)
  })
})

describe('timelineFit — aggregate match score', () => {
  it('raises overall score when only timeline overlap increases', () => {
    const small = pairWithTimeline(
      { start: '2026-10-01', end: '2026-12-31' },
      { start: '2026-12-01', end: '2026-12-15' },
    )
    const large = pairWithTimeline(
      { start: '2026-10-01', end: '2026-12-31' },
      { start: '2026-10-01', end: '2026-10-31' },
    )
    assert.equal(small.breakdown.skillMatch, large.breakdown.skillMatch)
    assert.equal(small.breakdown.locationFit, large.breakdown.locationFit)
    assert.equal(small.breakdown.budgetFit, large.breakdown.budgetFit)
    assert.ok(large.breakdown.timelineFit > small.breakdown.timelineFit)
    assert.ok(large.score > small.score)
  })

  it('does not award a positive Timeline Fit contribution when dates are missing', () => {
    const missing = pairWithTimeline(undefined, undefined)
    const full = pairWithTimeline(
      { start: '2026-10-01', end: '2026-12-31' },
      { start: '2026-10-01', end: '2026-12-31' },
    )
    assert.equal(missing.breakdown.timelineFit, 0)
    assert.equal(full.breakdown.timelineFit, 1)
    assert.ok(full.score > missing.score)
  })
})
