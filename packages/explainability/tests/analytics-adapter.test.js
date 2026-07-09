import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ANALYTICS_ADAPTER_SCORE_WEIGHTS,
  ANALYTICS_ADAPTER_VERSION,
  ANALYTICS_REASON_CODES,
  ENGINE_ID,
  buildAnalyticsExplanation,
  analyticsExplainabilityAdapter,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'intelligence-funnel'
const EVALUATED_AT = '2026-07-09T14:00:00.000Z'

function createHealthyAnalyticsSnapshot() {
  return {
    entityId: ENTITY_ID,
    periodLabel: 'Q3 2026',
    readinessAnalytics: {
      profileTotal: 10,
      profileReady: 8,
      profileNeedsReview: 1,
      profileIncomplete: 1,
      profileAverageScore: 82,
      opportunityTotal: 12,
      opportunityReady: 9,
      opportunityNeedsReview: 2,
      opportunityIncomplete: 1,
      opportunityDraft: 2,
      opportunityPublishBlocked: 1,
      opportunityAverageScore: 78,
    },
    matchingQualityAnalytics: {
      averageProfileReadiness: 80,
      averageOpportunityReadiness: 76,
      averageMatchScore: 74,
      totalMatches: 20,
      acceptedMatches: 14,
      acceptanceRate: 70,
      negotiationsStarted: 10,
      negotiationRate: 50,
      dealsCreated: 6,
      dealConversionRate: 30,
      byMatchType: {
        one_way: { total: 10, accepted: 8, confirmed: 5 },
        two_way: { total: 6, accepted: 4, confirmed: 2 },
        consortium: { total: 3, accepted: 2, confirmed: 1 },
        circular: { total: 1, accepted: 0, confirmed: 0 },
      },
    },
    evaluatedAt: EVALUATED_AT,
    locale: 'en',
  }
}

function createInsufficientDataSnapshot() {
  return {
    entityId: 'intelligence-portfolio',
    readinessAnalytics: {
      profileTotal: 1,
      profileReady: 0,
      profileNeedsReview: 1,
      profileIncomplete: 0,
      profileAverageScore: 40,
      opportunityTotal: 1,
      opportunityReady: 0,
      opportunityNeedsReview: 0,
      opportunityIncomplete: 1,
      opportunityDraft: 1,
      opportunityPublishBlocked: 0,
      opportunityAverageScore: 30,
    },
    matchingQualityAnalytics: {
      averageProfileReadiness: 40,
      averageOpportunityReadiness: 30,
      averageMatchScore: 0,
      totalMatches: 0,
      acceptedMatches: 0,
      acceptanceRate: 0,
      negotiationsStarted: 0,
      negotiationRate: 0,
      dealsCreated: 0,
      dealConversionRate: 0,
      byMatchType: {
        one_way: { total: 0, accepted: 0, confirmed: 0 },
        two_way: { total: 0, accepted: 0, confirmed: 0 },
        consortium: { total: 0, accepted: 0, confirmed: 0 },
        circular: { total: 0, accepted: 0, confirmed: 0 },
      },
    },
    evaluatedAt: EVALUATED_AT,
  }
}

function collectReasonCodes(bundle) {
  const codes = new Set()
  for (const reason of bundle.reasons) codes.add(reason.code)
  for (const blocker of bundle.blockers) codes.add(blocker.reasonCode)
  for (const recommendation of bundle.recommendations) codes.add(recommendation.reasonCode)
  return [...codes]
}

describe('analytics explainability adapter', () => {
  it('maps analytics reason codes from vocabulary', () => {
    for (const code of Object.values(ANALYTICS_REASON_CODES)) {
      assert.equal(isReasonCode(code), true)
    }
  })

  it('builds analytics bundle with funnel drill-down recommendations', () => {
    const bundle = buildAnalyticsExplanation(createHealthyAnalyticsSnapshot())

    assert.equal(bundle.engine, ENGINE_ID.ANALYTICS)
    assert.equal(bundle.entityId, ENTITY_ID)
    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.metadata.engineVersion, ANALYTICS_ADAPTER_VERSION)
    assert.equal(bundle.metadata.source, 'analytics-adapter')
    assert.ok(bundle.recommendations.some((rec) => rec.href?.includes('/intelligence/')))
  })

  it('flags insufficient data and negative trends', () => {
    const bundle = buildAnalyticsExplanation(createInsufficientDataSnapshot())

    assert.ok(bundle.reasons.some((reason) => reason.code === ANALYTICS_REASON_CODES.DATA_INSUFFICIENT))
    assert.ok(bundle.recommendations.some((rec) => rec.reasonCode === ANALYTICS_REASON_CODES.DATA_INSUFFICIENT))
  })

  it('maps risk blockers to weaknesses', () => {
    const bundle = buildAnalyticsExplanation({
      ...createHealthyAnalyticsSnapshot(),
      riskBlockers: [{ label: 'Blocked matches', count: 4, href: '/intelligence/risk' }],
    })

    assert.ok(bundle.weaknesses.some((entry) => entry.label.includes('Blocked matches')))
    assert.ok(bundle.blockers.length > 0)
  })

  it('uses registered reason codes only', () => {
    const bundle = buildAnalyticsExplanation(createHealthyAnalyticsSnapshot())
    for (const code of collectReasonCodes(bundle)) {
      assert.equal(isReasonCode(code), true)
    }
  })

  it('breakdown weights sum to 100', () => {
    const total = Object.values(ANALYTICS_ADAPTER_SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
    assert.equal(total, 100)
  })

  it('round-trips through AI payload', () => {
    const bundle = buildAnalyticsExplanation(createHealthyAnalyticsSnapshot())
    const payload = toAIExplanationPayload(bundle, EVALUATED_AT)
    const restored = deserializeExplanationBundle(JSON.stringify(payload.bundle))
    assert.equal(restored.engine, bundle.engine)
    assert.equal(restored.entityId, bundle.entityId)
    assert.equal(restored.score, bundle.score)
  })

  it('exposes ExplainabilityAdapter surface', () => {
    const snapshot = createHealthyAnalyticsSnapshot()
    const bundle = analyticsExplainabilityAdapter.buildExplanation(snapshot)
    assert.equal(bundle.engine, ENGINE_ID.ANALYTICS)
    assert.equal(analyticsExplainabilityAdapter.buildBreakdown(snapshot).length, 4)
  })
})
