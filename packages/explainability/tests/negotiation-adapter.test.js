import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  NEGOTIATION_ADAPTER_SCORE_WEIGHTS,
  NEGOTIATION_ADAPTER_VERSION,
  NEGOTIATION_REASON_CODES,
  NEGOTIATION_STATUS_TO_REASON_CODE,
  buildNegotiationExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  negotiationExplainabilityAdapter,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'neg-001'
const EVALUATED_AT = '2026-07-09T14:00:00.000Z'

function createActiveWithPendingCounterSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'countered',
    currentOffer: {
      amount: 120000,
      currency: 'SAR',
      termsSummary: 'Revised payment schedule — net-45',
      submittedAt: '2026-07-08T10:00:00.000Z',
      submittedBy: 'party-b',
    },
    pendingCounterOffer: true,
    offerCount: 2,
    counterOfferCount: 1,
    evaluatedAt: EVALUATED_AT,
    locale: 'en-SA',
  }
}

function createAgreedSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'agreed',
    acceptedOffer: {
      amount: 115000,
      currency: 'SAR',
      termsSummary: 'Final agreed commercial terms',
      submittedAt: '2026-07-09T12:00:00.000Z',
      submittedBy: 'party-a',
    },
    offerCount: 3,
    counterOfferCount: 2,
    evaluatedAt: EVALUATED_AT,
  }
}

function createExpiredSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'expired',
    offerCount: 1,
    evaluatedAt: EVALUATED_AT,
  }
}

function createCancelledSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'cancelled',
    offerCount: 1,
    counterOfferCount: 1,
    evaluatedAt: EVALUATED_AT,
  }
}

function createPriceGapSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'active',
    currentOffer: {
      amount: 100000,
      currency: 'SAR',
      termsSummary: 'Initial offer',
      submittedAt: '2026-07-07T09:00:00.000Z',
    },
    priceGap: { percent: 25, absolute: 25000, currency: 'SAR' },
    offerCount: 1,
    evaluatedAt: EVALUATED_AT,
  }
}

function createChangesRequestedSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'active',
    changesRequested: true,
    reviewNotes: 'Clarify delivery milestones before approval',
    requestedItems: ['deliveryMilestones', 'paymentTerms'],
    currentOffer: {
      termsSummary: 'Draft offer pending review',
      submittedAt: '2026-07-06T08:00:00.000Z',
    },
    offerCount: 1,
    evaluatedAt: EVALUATED_AT,
  }
}

function createTermsGapsSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'countered',
    commercialTermsGaps: [
      {
        field: 'paymentTerms',
        label: 'Payment terms',
        priorValue: 'Net-30',
        proposedValue: 'Net-60',
        changeSummary: 'Payment terms extended from Net-30 to Net-60',
      },
      {
        field: 'deliveryMilestones',
        label: 'Delivery milestones',
        priorValue: '3 milestones',
        proposedValue: '5 milestones',
      },
    ],
    offerCount: 2,
    counterOfferCount: 1,
    evaluatedAt: EVALUATED_AT,
  }
}

function createTimelineSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'active',
    currentOffer: {
      termsSummary: 'Opening offer',
      submittedAt: '2026-07-05T08:00:00.000Z',
    },
    offerCount: 1,
    evaluatedAt: EVALUATED_AT,
  }
}

function createPrebuiltTimelineSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'countered',
    timelineEvents: [
      {
        type: 'offer.submitted',
        title: 'Offer submitted',
        description: 'Party A submitted initial offer',
        timestamp: '2026-07-05T08:00:00.000Z',
        status: 'completed',
      },
      {
        type: 'offer.countered',
        title: 'Counter-offer',
        description: 'Party B countered with revised terms',
        timestamp: '2026-07-06T10:00:00.000Z',
        status: 'in_progress',
      },
    ],
    evaluatedAt: EVALUATED_AT,
  }
}

function collectReasonCodes(bundle) {
  const codes = new Set()

  for (const reason of bundle.reasons) {
    codes.add(reason.code)
  }
  for (const blocker of bundle.blockers) {
    codes.add(blocker.reasonCode)
  }
  for (const entry of bundle.strengths) {
    codes.add(entry.code)
  }
  for (const entry of bundle.weaknesses) {
    codes.add(entry.code)
  }
  for (const recommendation of bundle.recommendations) {
    codes.add(recommendation.reasonCode)
  }
  for (const breakdown of bundle.scoreBreakdown) {
    for (const code of breakdown.reasonCodes) {
      codes.add(code)
    }
  }

  return [...codes]
}

describe('Negotiation explainability adapter', () => {
  it('maps negotiation status values to registered NEGOTIATION_* reason codes', () => {
    for (const [status, code] of Object.entries(NEGOTIATION_STATUS_TO_REASON_CODE)) {
      assert.equal(code.startsWith('NEGOTIATION_'), true, status)
      assert.equal(isReasonCode(code), true, status)
    }
  })

  it('maps active negotiation with pending counter to warning health', () => {
    const bundle = buildNegotiationExplanation(createActiveWithPendingCounterSnapshot())

    assert.equal(bundle.engine, ENGINE_ID.NEGOTIATION)
    assert.equal(bundle.health, HEALTH.WARNING)
    assert.ok(bundle.score >= 40 && bundle.score <= 60)
    assert.equal(
      bundle.reasons.some((reason) => reason.code === NEGOTIATION_REASON_CODES.COUNTER_PENDING),
      true,
    )
    assert.equal(
      bundle.weaknesses.some((entry) => entry.code === NEGOTIATION_REASON_CODES.COUNTER_PENDING),
      true,
    )
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.find(
        (rec) => rec.reasonCode === NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      )?.href,
      `/negotiation/${ENTITY_ID}/offers`,
    )
  })

  it('maps agreed negotiation to excellent health with accepted-offer strength', () => {
    const bundle = buildNegotiationExplanation(createAgreedSnapshot())

    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.score, 100)
    assert.equal(
      bundle.strengths.some((entry) => entry.code === NEGOTIATION_REASON_CODES.STATUS_AGREED),
      true,
    )
    assert.equal(
      bundle.strengths.some((entry) => entry.code === NEGOTIATION_REASON_CODES.OFFER_ACCEPTED),
      true,
    )
    assert.equal(bundle.blockers.length, 0)
    assert.match(bundle.summary, /agreed/i)
  })

  it('maps expired and cancelled negotiations to critical health with blockers', () => {
    const expired = buildNegotiationExplanation(createExpiredSnapshot())
    const cancelled = buildNegotiationExplanation(createCancelledSnapshot())

    assert.equal(expired.health, HEALTH.CRITICAL)
    assert.equal(cancelled.health, HEALTH.CRITICAL)
    assert.equal(expired.blockers.length, 1)
    assert.equal(cancelled.blockers.length, 1)
    assert.equal(
      expired.blockers[0].reasonCode,
      NEGOTIATION_REASON_CODES.STATUS_EXPIRED,
    )
    assert.equal(
      cancelled.blockers[0].reasonCode,
      NEGOTIATION_REASON_CODES.STATUS_CANCELLED,
    )
  })

  it('surfaces price gap as weakness and recommendation', () => {
    const bundle = buildNegotiationExplanation(createPriceGapSnapshot())

    assert.equal(
      bundle.weaknesses.some((entry) => entry.code === NEGOTIATION_REASON_CODES.PRICE_GAP),
      true,
    )
    assert.equal(
      bundle.recommendations.some((rec) => rec.reasonCode === NEGOTIATION_REASON_CODES.PRICE_GAP),
      true,
    )
    assert.equal(bundle.blockers.length, 1)
    assert.equal(bundle.blockers[0].reasonCode, NEGOTIATION_REASON_CODES.PRICE_GAP)
  })

  it('maps changes requested to blocker and recommendation', () => {
    const bundle = buildNegotiationExplanation(createChangesRequestedSnapshot())

    assert.equal(bundle.blockers.length, 1)
    assert.equal(
      bundle.blockers[0].reasonCode,
      NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
    )
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      ),
      true,
    )
    assert.match(bundle.summary, /changes requested/i)
  })

  it('maps commercial terms gaps to weaknesses and reasons', () => {
    const bundle = buildNegotiationExplanation(createTermsGapsSnapshot())

    assert.equal(bundle.weaknesses.length, 2)
    assert.equal(
      bundle.weaknesses.every((entry) => entry.code === NEGOTIATION_REASON_CODES.TERMS_MISMATCH),
      true,
    )
    assert.equal(
      bundle.reasons.filter((reason) => reason.code === NEGOTIATION_REASON_CODES.TERMS_MISMATCH)
        .length,
      2,
    )
    assert.ok(bundle.recommendations.length >= 2)
  })

  it('buildBreakdown weights sum to 100', () => {
    const breakdown = negotiationExplainabilityAdapter.buildBreakdown(createTermsGapsSnapshot())
    const totalWeight = breakdown.reduce((sum, entry) => sum + entry.weight, 0)

    assert.equal(totalWeight, 100)
    assert.equal(breakdown.length, 4)
    assert.equal(breakdown[0].label, 'Price alignment')
  })

  it('synthesizes timeline from offer timestamps when timelineEvents absent', () => {
    const timeline = negotiationExplainabilityAdapter.buildTimeline(createTimelineSnapshot())

    assert.ok(timeline.length >= 1)
    assert.equal(timeline[0].type, 'offer-submitted')
    assert.equal(timeline[0].timestamp, '2026-07-05T08:00:00.000Z')
  })

  it('uses pre-built timelineEvents when provided', () => {
    const timeline = negotiationExplainabilityAdapter.buildTimeline(
      createPrebuiltTimelineSnapshot(),
    )

    assert.equal(timeline.length, 2)
    assert.equal(timeline[0].type, 'offer.submitted')
    assert.equal(timeline[1].status, 'active')
  })

  it('includes negotiation metadata extensions', () => {
    const bundle = buildNegotiationExplanation(createActiveWithPendingCounterSnapshot())

    assert.equal(bundle.metadata.engineVersion, NEGOTIATION_ADAPTER_VERSION)
    assert.equal(bundle.metadata.source, 'negotiation-adapter')
    assert.equal(bundle.metadata.extensions.status, 'countered')
    assert.equal(bundle.metadata.extensions.offerCount, 2)
    assert.equal(bundle.metadata.extensions.counterOfferCount, 1)
    assert.equal(bundle.metadata.extensions.pendingCounterOffer, true)
  })

  it('produces a valid ExplanationBundle with registered reason codes only', () => {
    const snapshots = [
      createActiveWithPendingCounterSnapshot(),
      createAgreedSnapshot(),
      createExpiredSnapshot(),
      createCancelledSnapshot(),
      createPriceGapSnapshot(),
      createChangesRequestedSnapshot(),
      createTermsGapsSnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildNegotiationExplanation(snapshot)
      assert.equal(isExplanationBundle(bundle), true)

      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, String(code))
      }
    }
  })

  it('round-trips through AI serialization', () => {
    const bundle = buildNegotiationExplanation(createAgreedSnapshot())
    const payload = toAIExplanationPayload(bundle)
    const restored = deserializeExplanationBundle(serializeExplanationBundle(bundle))

    assert.equal(payload.bundle.engine, ENGINE_ID.NEGOTIATION)
    assert.equal(restored.score, 100)
    assert.equal(restored.health, HEALTH.EXCELLENT)
    assert.equal(restored.metadata.extensions.status, 'agreed')
  })
})
