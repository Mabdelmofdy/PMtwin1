import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  MATCH_ADAPTER_SCORE_WEIGHTS,
  MATCH_DIMENSION_TO_REASON_CODE,
  MATCH_REASON_CODES,
  MATCHING_ADAPTER_VERSION,
  buildMatchingExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  matchingExplainabilityAdapter,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'match-001'
const COUNTERPART_ID = 'post-need-42'
const EVALUATED_AT = '2026-07-09T14:00:00.000Z'

function strongBreakdown() {
  return {
    skillMatch: 0.95,
    attributeOverlap: 0.95,
    serviceOverlapPct: 0.95,
    exchangeCompatibility: 0.9,
    valueCompatibility: 0.88,
    budgetFit: 0.85,
    timelineFit: 0.9,
    locationFit: 1,
    reputation: 0.8,
  }
}

function strongLabels() {
  return {
    skillMatch: 'Match',
    attributeOverlap: 'Match',
    exchangeCompatibility: 'Match',
    valueCompatibility: 'Match',
    budgetFit: 'Match',
    timelineFit: 'Match',
    locationFit: 'Match',
    reputation: 'Match',
  }
}

function createStrongMatchSnapshot() {
  return {
    entityId: ENTITY_ID,
    matchScore: 0.91,
    topology: 'two_way',
    topologyReason: 'Mutual need-offer exchange detected',
    breakdown: strongBreakdown(),
    labels: strongLabels(),
    recommendation: {
      tier: 'top',
      reason: 'Strong skill and value fit',
      actionRequired: false,
    },
    counterpartEntityId: COUNTERPART_ID,
    evaluatedAt: EVALUATED_AT,
    locale: 'en-SA',
  }
}

function createWeakMatchSnapshot() {
  return {
    entityId: ENTITY_ID,
    matchScore: 0.58,
    topology: 'one_way',
    breakdown: {
      skillMatch: 0.55,
      attributeOverlap: 0.55,
      serviceOverlapPct: 0.4,
      exchangeCompatibility: 0.45,
      valueCompatibility: 0.5,
      budgetFit: 0.35,
      timelineFit: 0.6,
      locationFit: 0.2,
      reputation: 0.55,
    },
    labels: {
      skillMatch: 'Partial',
      exchangeCompatibility: 'Partial',
      valueCompatibility: 'Partial',
      budgetFit: 'No Match',
      timelineFit: 'Partial',
      locationFit: 'No Match',
      reputation: 'Partial',
    },
    recommendation: {
      tier: 'possible',
      reason: 'Possible match; negotiation may be needed',
      actionRequired: true,
    },
    counterpartEntityId: COUNTERPART_ID,
    evaluatedAt: EVALUATED_AT,
  }
}

function createHardGateSnapshot() {
  return {
    entityId: ENTITY_ID,
    matchScore: 0,
    breakdown: {
      skillMatch: 0,
      exchangeCompatibility: 0,
      valueCompatibility: 0,
      budgetFit: 0,
      timelineFit: 0,
      locationFit: 0,
      reputation: 0,
    },
    hardGateFailure: {
      code: 'role_incompatible',
      message: 'Need role Project Manager is incompatible with offer role Designer',
    },
    counterpartEntityId: COUNTERPART_ID,
    evaluatedAt: EVALUATED_AT,
  }
}

function createSkillFloorSnapshot() {
  return {
    entityId: ENTITY_ID,
    matchScore: 0,
    breakdown: {
      skillMatch: 0.2,
      attributeOverlap: 0.2,
      serviceOverlapPct: 0.2,
      exchangeCompatibility: 0.7,
      valueCompatibility: 0.6,
      budgetFit: 0.8,
      timelineFit: 0.7,
      locationFit: 1,
      reputation: 0.6,
      rejected: 'skill_floor',
    },
    labels: {
      skillMatch: 'No Match',
      exchangeCompatibility: 'Match',
      valueCompatibility: 'Partial',
      budgetFit: 'Match',
      timelineFit: 'Partial',
      locationFit: 'Match',
      reputation: 'Partial',
    },
    counterpartEntityId: COUNTERPART_ID,
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

describe('Matching explainability adapter', () => {
  it('maps dimensions to registered MATCH_* reason codes', () => {
    for (const [dimension, code] of Object.entries(MATCH_DIMENSION_TO_REASON_CODE)) {
      assert.equal(code.startsWith('MATCH_'), true, dimension)
      assert.equal(isReasonCode(code), true, dimension)
    }
  })

  it('buildBreakdown covers all scored and supplementary dimensions', () => {
    const snapshot = createStrongMatchSnapshot()
    const breakdown = matchingExplainabilityAdapter.buildBreakdown(snapshot)

    assert.equal(breakdown.length, 9)
    assert.equal(breakdown[0].label, 'Skill match')
    assert.equal(breakdown[0].weight, MATCH_ADAPTER_SCORE_WEIGHTS.skillMatch)
    assert.equal(breakdown[0].maxScore, 25)
    assert.equal(breakdown[0].score, 23.75)
    assert.equal(breakdown.find((entry) => entry.label === 'Service overlap')?.maxScore, 100)
  })

  it('normalizes 0-1 matchScore to 0-100 on the bundle', () => {
    const bundle = buildMatchingExplanation(createStrongMatchSnapshot())
    assert.equal(bundle.score, 91)
  })

  it('maps strong top-tier match to excellent health with strengths', () => {
    const bundle = buildMatchingExplanation(createStrongMatchSnapshot())

    assert.equal(bundle.engine, ENGINE_ID.MATCHING)
    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.ok(bundle.strengths.length >= 7)
    assert.equal(
      bundle.strengths.some((entry) => entry.code === MATCH_REASON_CODES.TIER_TOP),
      true,
    )
    assert.equal(bundle.weaknesses.length, 0)
    assert.equal(bundle.blockers.length, 0)
  })

  it('maps weak possible-tier match to weaknesses and recommendations', () => {
    const bundle = buildMatchingExplanation(createWeakMatchSnapshot())

    assert.equal(bundle.health, HEALTH.WARNING)
    assert.ok(bundle.weaknesses.length >= 3)
    assert.ok(bundle.recommendations.length >= 1)
    assert.equal(
      bundle.recommendations[0].reasonCode,
      MATCH_REASON_CODES.TIER_POSSIBLE,
    )
    assert.equal(
      bundle.weaknesses.some((entry) => entry.code === MATCH_REASON_CODES.LOCATION_LOW),
      true,
    )
    assert.equal(
      bundle.weaknesses.some((entry) => entry.code === MATCH_REASON_CODES.BUDGET_LOW),
      true,
    )
  })

  it('maps hard gate failure to blockers with canonical reason code', () => {
    const bundle = buildMatchingExplanation(createHardGateSnapshot())

    assert.equal(bundle.blockers.length, 1)
    assert.equal(
      bundle.blockers[0].reasonCode,
      MATCH_REASON_CODES.HARD_GATE_ROLE_INCOMPATIBLE,
    )
    assert.equal(bundle.blockers[0].severity, EXPLANATION_SEVERITY.CRITICAL)
    assert.match(bundle.summary, /blocked/i)
  })

  it('maps skill_floor rejection to MATCH_SKILL_LOW blocker', () => {
    const bundle = buildMatchingExplanation(createSkillFloorSnapshot())

    assert.equal(bundle.blockers.length, 1)
    assert.equal(bundle.blockers[0].reasonCode, MATCH_REASON_CODES.SKILL_LOW)
    assert.match(bundle.summary, /skill overlap below minimum/i)
  })

  it('includes topology metadata in bundle extensions', () => {
    const bundle = buildMatchingExplanation(createStrongMatchSnapshot())

    assert.equal(bundle.metadata.extensions.topology, 'two_way')
    assert.equal(bundle.metadata.extensions.counterpartEntityId, COUNTERPART_ID)
    assert.equal(
      bundle.reasons.some((reason) => reason.code === MATCH_REASON_CODES.TOPOLOGY_TWO_WAY),
      true,
    )
    assert.equal(bundle.metadata.engineVersion, MATCHING_ADAPTER_VERSION)
    assert.equal(bundle.metadata.source, 'matching-adapter')
  })

  it('buildTimeline emits match-discovered and match-evaluated events', () => {
    const timeline = matchingExplainabilityAdapter.buildTimeline(createStrongMatchSnapshot())

    assert.equal(timeline.length, 2)
    assert.equal(timeline[0].type, 'match-discovered')
    assert.equal(timeline[1].type, 'match-evaluated')
    assert.equal(timeline[1].status, 'completed')
  })

  it('produces a valid ExplanationBundle with registered reason codes only', () => {
    const snapshots = [
      createStrongMatchSnapshot(),
      createWeakMatchSnapshot(),
      createHardGateSnapshot(),
      createSkillFloorSnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildMatchingExplanation(snapshot)
      assert.equal(isExplanationBundle(bundle), true)

      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, String(code))
      }
    }
  })

  it('round-trips through AI serialization', () => {
    const bundle = buildMatchingExplanation(createStrongMatchSnapshot())
    const payload = toAIExplanationPayload(bundle)
    const restored = deserializeExplanationBundle(serializeExplanationBundle(bundle))

    assert.equal(payload.bundle.engine, ENGINE_ID.MATCHING)
    assert.equal(restored.score, bundle.score)
    assert.equal(restored.metadata.extensions.topology, 'two_way')
    assert.equal(restored.health, HEALTH.EXCELLENT)
  })
})
