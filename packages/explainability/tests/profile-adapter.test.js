import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  PROFILE_ADAPTER_SCORE_WEIGHTS,
  PROFILE_FIELD_LABEL_TO_REASON_CODE,
  PROFILE_REASON_CODES,
  buildProfileExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  profileExplainabilityAdapter,
  profileFieldLabelToReasonCode,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'profile-user-001'

function createIncompleteIndividualSnapshot() {
  return {
    entityId: ENTITY_ID,
    profileKind: 'individual',
    score: 35,
    status: 'incomplete',
    missingRequired: ['Full Name', 'Role', 'Skills', 'Services', 'Location', 'Availability'],
    missingRecommended: ['Portfolio', 'Experience', 'Certifications', 'Previous Projects'],
    recommendations: [
      'Complete Full Name',
      'Complete Role',
      'Complete Skills',
      'Complete Services',
      'Complete Location',
      'Complete Availability',
      'Complete Portfolio',
      'Complete Experience',
      'Complete Certifications',
      'Complete Previous Projects',
    ],
    requiredTotal: 6,
    recommendedTotal: 4,
    evaluatedAt: '2026-07-09T12:00:00.000Z',
    locale: 'en-SA',
  }
}

function createReadyIndividualSnapshot() {
  return {
    entityId: ENTITY_ID,
    profileKind: 'individual',
    score: 100,
    status: 'ready_for_matching',
    missingRequired: [],
    missingRecommended: [],
    recommendations: [],
    requiredTotal: 6,
    recommendedTotal: 4,
    createdAt: '2026-06-01T08:00:00.000Z',
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

function createNeedsReviewCompanySnapshot() {
  return {
    entityId: 'profile-company-002',
    profileKind: 'company',
    score: 70,
    status: 'needs_review',
    missingRequired: [],
    missingRecommended: [
      'Portfolio',
      'Team Size',
      'Coverage Areas',
      'Certifications',
      'Financial Capacity',
    ],
    recommendations: [
      'Complete Portfolio',
      'Complete Team Size',
      'Complete Coverage Areas',
      'Complete Certifications',
      'Complete Financial Capacity',
    ],
    requiredTotal: 6,
    recommendedTotal: 5,
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

function createLockedSnapshot() {
  return {
    entityId: ENTITY_ID,
    profileKind: 'individual',
    score: 0,
    status: 'incomplete',
    missingRequired: ['Full Name', 'Role', 'Skills', 'Services', 'Location', 'Availability'],
    missingRecommended: ['Portfolio', 'Experience', 'Certifications', 'Previous Projects'],
    recommendations: [],
    requiredTotal: 6,
    recommendedTotal: 4,
    completionLocked: true,
    evaluatedAt: '2026-07-09T12:00:00.000Z',
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

describe('Profile explainability adapter', () => {
  it('maps field labels to registered PROFILE_* reason codes', () => {
    for (const [label, code] of Object.entries(PROFILE_FIELD_LABEL_TO_REASON_CODE)) {
      assert.equal(profileFieldLabelToReasonCode(label), code)
      assert.equal(isReasonCode(code), true)
    }
  })

  it('buildBreakdown returns required 70% / recommended 30% decomposition', () => {
    const snapshot = createIncompleteIndividualSnapshot()
    const breakdown = profileExplainabilityAdapter.buildBreakdown(snapshot)

    assert.equal(breakdown.length, 2)
    assert.equal(breakdown[0].label, 'Required fields')
    assert.equal(breakdown[0].weight, PROFILE_ADAPTER_SCORE_WEIGHTS.required)
    assert.equal(breakdown[0].maxScore, 70)
    assert.equal(breakdown[0].score, 0)
    assert.equal(breakdown[1].label, 'Recommended fields')
    assert.equal(breakdown[1].weight, PROFILE_ADAPTER_SCORE_WEIGHTS.recommended)
    assert.equal(breakdown[1].maxScore, 30)
    assert.equal(breakdown[1].score, 0)
  })

  it('buildRecommendations assigns impact from weight shares', () => {
    const snapshot = createNeedsReviewCompanySnapshot()
    const recommendations = profileExplainabilityAdapter.buildRecommendations(snapshot)

    assert.equal(recommendations.length, 5)
    assert.equal(
      recommendations[0].reasonCode,
      PROFILE_REASON_CODES.MISSING_PORTFOLIO,
    )
    assert.equal(recommendations[0].impactPercent, 6)
    assert.equal(recommendations[0].href, '/profile/edit#portfolio')
    assert.equal(recommendations[0].estimatedScore, 76)
  })

  it('buildTimeline emits created and evaluated events when timestamps exist', () => {
    const snapshot = createReadyIndividualSnapshot()
    const timeline = profileExplainabilityAdapter.buildTimeline(snapshot)

    assert.equal(timeline.length, 2)
    assert.equal(timeline[0].type, 'profile-created')
    assert.equal(timeline[1].type, 'profile-evaluated')
    assert.equal(timeline[1].status, 'completed')
  })

  it('buildTimeline synthesizes evaluation event when only evaluatedAt is provided', () => {
    const snapshot = createIncompleteIndividualSnapshot()
    const timeline = profileExplainabilityAdapter.buildTimeline(snapshot)

    assert.equal(timeline.length, 1)
    assert.equal(timeline[0].type, 'profile-evaluated')
    assert.equal(timeline[0].status, 'blocked')
  })

  it('buildExplanation produces a valid ExplanationBundle for incomplete profiles', () => {
    const bundle = buildProfileExplanation(createIncompleteIndividualSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.engine, ENGINE_ID.PROFILE)
    assert.equal(bundle.entityId, ENTITY_ID)
    assert.equal(bundle.health, HEALTH.CRITICAL)
    assert.equal(bundle.blockers.length, 6)
    assert.equal(bundle.weaknesses.length, 10)
    assert.ok(bundle.summary.includes('incomplete'))
  })

  it('buildExplanation marks ready profiles as excellent with completion strengths', () => {
    const bundle = buildProfileExplanation(createReadyIndividualSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.reasons[0].code, PROFILE_REASON_CODES.COMPLETE)
    assert.ok(
      bundle.strengths.some((entry) => entry.code === PROFILE_REASON_CODES.COMPLETE),
    )
    assert.equal(bundle.recommendations.length, 0)
    assert.equal(bundle.blockers.length, 0)
  })

  it('buildExplanation surfaces completion lock as blocker and reason', () => {
    const bundle = buildProfileExplanation(createLockedSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.blockers[0].reasonCode, PROFILE_REASON_CODES.COMPLETION_LOCKED)
    assert.ok(
      bundle.reasons.some(
        (reason) => reason.code === PROFILE_REASON_CODES.COMPLETION_LOCKED,
      ),
    )
    assert.equal(bundle.blockers.length, 1)
  })

  it('uses only valid ReasonCode values across the bundle', () => {
    const snapshots = [
      createIncompleteIndividualSnapshot(),
      createReadyIndividualSnapshot(),
      createNeedsReviewCompanySnapshot(),
      createLockedSnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildProfileExplanation(snapshot)
      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, `Invalid reason code: ${code}`)
      }
    }
  })

  it('adapter methods stay consistent inside buildExplanation', () => {
    const snapshot = createNeedsReviewCompanySnapshot()
    const bundle = profileExplainabilityAdapter.buildExplanation(snapshot)

    assert.deepEqual(bundle.recommendations, profileExplainabilityAdapter.buildRecommendations(snapshot))
    assert.deepEqual(bundle.scoreBreakdown, profileExplainabilityAdapter.buildBreakdown(snapshot))
    assert.deepEqual(bundle.timeline, profileExplainabilityAdapter.buildTimeline(snapshot))
  })

  it('round-trips profile ExplanationBundle through AI serialization', () => {
    const bundle = buildProfileExplanation(createIncompleteIndividualSnapshot())
    const json = serializeExplanationBundle(bundle)
    const restored = deserializeExplanationBundle(json)
    const payload = toAIExplanationPayload(restored, '2026-07-09T12:00:00.000Z')

    assert.deepEqual(restored, bundle)
    assert.equal(payload.bundle.engine, ENGINE_ID.PROFILE)
    assert.equal(isExplanationBundle(payload.bundle), true)
  })

  it('maps required-field gaps to critical severity recommendations', () => {
    const snapshot = {
      ...createIncompleteIndividualSnapshot(),
      missingRequired: ['Skills'],
      missingRecommended: [],
      requiredTotal: 6,
      recommendedTotal: 4,
      score: 58.33,
    }
    const [recommendation] = profileExplainabilityAdapter.buildRecommendations(snapshot)

    assert.equal(recommendation.reasonCode, PROFILE_REASON_CODES.MISSING_SKILLS)
    assert.equal(recommendation.priority, 'critical')
    assert.equal(recommendation.severity, EXPLANATION_SEVERITY.CRITICAL)
    assert.ok(Math.abs(recommendation.impactPercent - 70 / 6) < 0.01)
  })
})
