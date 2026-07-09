import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  COMMERCIAL_REASON_CODES,
  PROFILE_REASON_CODES,
  RECOMMENDATION_PRIORITY,
  VETTING_REASON_CODES,
  aggregateRecommendations,
  buildProfileExplanation,
  buildVettingExplanation,
  createRecommendationService,
  isReasonCode,
} from '../dist/index.js'

const PROFILE_ENTITY = 'profile-user-001'
const VETTING_ENTITY = 'vetting-party-001'

function createIncompleteProfileSnapshot() {
  return {
    entityId: PROFILE_ENTITY,
    profileKind: 'individual',
    score: 35,
    status: 'incomplete',
    missingRequired: ['Full Name', 'Skills'],
    missingRecommended: ['Portfolio'],
    recommendations: ['Complete Full Name', 'Complete Skills', 'Complete Portfolio'],
    requiredTotal: 6,
    recommendedTotal: 4,
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

function createIncompleteVettingSnapshot() {
  return {
    entityId: VETTING_ENTITY,
    score: 18,
    status: 'incomplete',
    missingRequired: ['Document: Commercial Registration'],
    missingRecommended: ['Start admin review'],
    recommendations: ['Upload Commercial Registration', 'Start admin review'],
    documentsProgress: { approvedRequired: 0, totalRequired: 5 },
    reviewProgress: 'not_started',
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

describe('RecommendationService implementation', () => {
  const service = createRecommendationService()

  it('exposes forProfile, forVetting, forAgreement, and forContract methods', () => {
    assert.equal(typeof service.forProfile, 'function')
    assert.equal(typeof service.forVetting, 'function')
    assert.equal(typeof service.forOpportunity, 'function')
    assert.equal(typeof service.forMatching, 'function')
    assert.equal(typeof service.forNegotiation, 'function')
    assert.equal(typeof service.forAgreement, 'function')
    assert.equal(typeof service.forContract, 'function')
  })

  it('forProfile returns recommendations from profile adapter', () => {
    const snapshot = createIncompleteProfileSnapshot()
    const { entityId, ...input } = snapshot
    const recommendations = service.forProfile(entityId, input)

    assert.ok(recommendations.length > 0)
    assert.equal(
      recommendations.some(
        (rec) => rec.reasonCode === PROFILE_REASON_CODES.MISSING_SKILLS,
      ),
      true,
    )
    for (const rec of recommendations) {
      assert.equal(isReasonCode(rec.reasonCode), true, rec.reasonCode)
    }
  })

  it('forVetting returns recommendations from vetting adapter', () => {
    const snapshot = createIncompleteVettingSnapshot()
    const { entityId, ...input } = snapshot
    const recommendations = service.forVetting(entityId, input)

    assert.ok(recommendations.length > 0)
    for (const rec of recommendations) {
      assert.equal(isReasonCode(rec.reasonCode), true, rec.reasonCode)
    }
  })

  it('forAgreement returns recommendations for signing stage', () => {
    const recommendations = service.forAgreement('deal-001', {
      status: 'signing',
      decisionStatus: 'pending',
      pendingSignatures: 1,
      totalSignatures: 2,
      evaluatedAt: '2026-07-09T12:00:00.000Z',
    })

    assert.ok(recommendations.length > 0)
    assert.equal(
      recommendations.some(
        (rec) => rec.reasonCode === COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      ),
      true,
    )
  })

  it('forContract returns sign recommendation when canSign', () => {
    const recommendations = service.forContract('contract-001', {
      status: 'pending_signature',
      partiesSigned: 0,
      totalParties: 2,
      canSign: true,
      evaluatedAt: '2026-07-09T12:00:00.000Z',
    })

    assert.ok(recommendations.length > 0)
    assert.equal(recommendations[0].priority, RECOMMENDATION_PRIORITY.HIGH)
  })

  it('aggregateRecommendations merges profile and vetting bundles', () => {
    const profileBundle = buildProfileExplanation(createIncompleteProfileSnapshot())
    const vettingBundle = buildVettingExplanation(createIncompleteVettingSnapshot())
    const aggregated = aggregateRecommendations([profileBundle, vettingBundle])

    assert.ok(aggregated.length > 0)
    assert.ok(aggregated.length <= 10)

    for (const rec of aggregated) {
      assert.equal(isReasonCode(rec.reasonCode), true, rec.reasonCode)
    }
  })

  it('aggregateRecommendations de-duplicates by reasonCode + label', () => {
    const duplicateRec = {
      id: 'rec-a',
      label: 'Complete Skills',
      reasonCode: PROFILE_REASON_CODES.MISSING_SKILLS,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 10,
      estimatedScore: 50,
      category: 'profile',
      severity: 'warning',
    }
    const duplicateRecHigherImpact = {
      ...duplicateRec,
      id: 'rec-b',
      impactPercent: 25,
    }

    const bundleA = {
      ...buildProfileExplanation(createIncompleteProfileSnapshot()),
      recommendations: [duplicateRec],
    }
    const bundleB = {
      ...buildVettingExplanation(createIncompleteVettingSnapshot()),
      recommendations: [duplicateRecHigherImpact],
    }

    const aggregated = aggregateRecommendations([bundleA, bundleB])

    assert.equal(
      aggregated.filter(
        (rec) =>
          rec.reasonCode === PROFILE_REASON_CODES.MISSING_SKILLS
          && rec.label === 'Complete Skills',
      ).length,
      1,
    )
    assert.equal(
      aggregated.find(
        (rec) =>
          rec.reasonCode === PROFILE_REASON_CODES.MISSING_SKILLS
          && rec.label === 'Complete Skills',
      )?.impactPercent,
      25,
    )
  })

  it('aggregateRecommendations sorts by priority then impactPercent desc', () => {
    const criticalRec = {
      id: 'rec-critical',
      label: 'Critical action',
      reasonCode: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      impactPercent: 10,
      estimatedScore: 60,
      category: 'commercial',
      severity: 'critical',
    }
    const highRec = {
      id: 'rec-high',
      label: 'High action',
      reasonCode: VETTING_REASON_CODES.REVIEW_NOT_STARTED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 30,
      estimatedScore: 70,
      category: 'vetting',
      severity: 'warning',
    }
    const lowRec = {
      id: 'rec-low',
      label: 'Low action',
      reasonCode: PROFILE_REASON_CODES.MISSING_PORTFOLIO,
      priority: RECOMMENDATION_PRIORITY.LOW,
      impactPercent: 50,
      estimatedScore: 80,
      category: 'profile',
      severity: 'info',
    }

    const aggregated = aggregateRecommendations([
      {
        ...buildProfileExplanation(createIncompleteProfileSnapshot()),
        recommendations: [lowRec, highRec, criticalRec],
      },
    ])

    assert.equal(aggregated[0].priority, RECOMMENDATION_PRIORITY.CRITICAL)
    assert.equal(aggregated[1].priority, RECOMMENDATION_PRIORITY.HIGH)
    assert.equal(aggregated[2].priority, RECOMMENDATION_PRIORITY.LOW)
  })

  it('aggregateRecommendations respects configurable limit', () => {
    const recommendations = Array.from({ length: 15 }, (_, index) => ({
      id: `rec-${index}`,
      label: `Action ${index}`,
      reasonCode: PROFILE_REASON_CODES.MISSING_SKILLS,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: index,
      estimatedScore: 50,
      category: 'profile',
      severity: 'warning',
    }))

    const aggregated = aggregateRecommendations(
      [
        {
          ...buildProfileExplanation(createIncompleteProfileSnapshot()),
          recommendations,
        },
      ],
      { limit: 5 },
    )

    assert.equal(aggregated.length, 5)
  })
})
