import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DASHBOARD_ADAPTER_SCORE_WEIGHTS,
  DASHBOARD_ADAPTER_VERSION,
  DASHBOARD_REASON_CODES,
  ENGINE_ID,
  HEALTH,
  buildDashboardExplanation,
  dashboardExplainabilityAdapter,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'user-001'
const EVALUATED_AT = '2026-07-09T14:00:00.000Z'

function createHealthyDashboardSnapshot() {
  return {
    entityId: ENTITY_ID,
    profileScore: 88,
    vettingScore: 92,
    opportunityCount: 4,
    matchCount: 3,
    negotiationCount: 2,
    dealCount: 1,
    contractCount: 1,
    heroMetric: { label: 'Active matches', value: 3 },
    evaluatedAt: EVALUATED_AT,
    locale: 'en',
  }
}

function createStalledPipelineSnapshot() {
  return {
    entityId: ENTITY_ID,
    profileScore: 40,
    opportunityCount: 2,
    matchCount: 5,
    negotiationCount: 0,
    dealCount: 0,
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

describe('dashboard explainability adapter', () => {
  it('maps dashboard reason codes from field map vocabulary', () => {
    for (const code of Object.values(DASHBOARD_REASON_CODES)) {
      assert.equal(isReasonCode(code), true)
    }
  })

  it('builds a healthy dashboard bundle', () => {
    const bundle = buildDashboardExplanation(createHealthyDashboardSnapshot())

    assert.equal(bundle.engine, ENGINE_ID.DASHBOARD)
    assert.equal(bundle.entityId, ENTITY_ID)
    assert.ok(bundle.score >= 70)
    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.metadata.engineVersion, DASHBOARD_ADAPTER_VERSION)
    assert.equal(bundle.metadata.source, 'dashboard-adapter')
  })

  it('flags stalled pipeline with recommendations', () => {
    const bundle = buildDashboardExplanation(createStalledPipelineSnapshot())

    assert.ok(bundle.reasons.some((reason) => reason.code === DASHBOARD_REASON_CODES.PIPELINE_STALLED))
    assert.ok(bundle.recommendations.some((rec) => rec.reasonCode === DASHBOARD_REASON_CODES.PIPELINE_STALLED))
    assert.ok(bundle.blockers.length > 0)
  })

  it('uses registered reason codes only', () => {
    const bundle = buildDashboardExplanation(createStalledPipelineSnapshot())
    for (const code of collectReasonCodes(bundle)) {
      assert.equal(isReasonCode(code), true)
    }
  })

  it('breakdown weights sum to 100', () => {
    const total = Object.values(DASHBOARD_ADAPTER_SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
    assert.equal(total, 100)
  })

  it('round-trips through AI payload', () => {
    const bundle = buildDashboardExplanation(createHealthyDashboardSnapshot())
    const payload = toAIExplanationPayload(bundle, EVALUATED_AT)
    const restored = deserializeExplanationBundle(JSON.stringify(payload.bundle))
    assert.deepEqual(restored, bundle)
  })

  it('exposes ExplainabilityAdapter surface', () => {
    const snapshot = createHealthyDashboardSnapshot()
    const bundle = dashboardExplainabilityAdapter.buildExplanation(snapshot)
    assert.equal(bundle.engine, ENGINE_ID.DASHBOARD)
    assert.ok(dashboardExplainabilityAdapter.buildBreakdown(snapshot).length > 0)
    assert.ok(dashboardExplainabilityAdapter.buildRecommendations(snapshot).length >= 0)
  })
})
