import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  OPPORTUNITY_ADAPTER_SCORE_WEIGHTS,
  OPPORTUNITY_FIELD_ID_TO_REASON_CODE,
  READINESS_REASON_CODES,
  buildOpportunityExplanation,
  buildReadinessExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  opportunityExplainabilityAdapter,
  opportunityFieldIdToReasonCode,
  readinessExplainabilityAdapter,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'opportunity-001'
const SNAPSHOT_META = {
  generatedAt: '2026-07-09T12:00:00.000Z',
  knowledgeVersion: 2,
  formVersion: '1.2.0',
  engineVersion: '1.0.0',
}

function coreContributions(presentIds) {
  const fields = [
    { fieldId: 'title', label: 'Title', category: 'general', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'intent', label: 'Intent', category: 'general', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'categoryProfession', label: 'Category / Profession', category: 'general', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'roleIntent', label: 'Role Needed or Role Offered', category: 'requirements', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'skillsIntent', label: 'Skills Required or Offered', category: 'requirements', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'servicesIntent', label: 'Services Required or Offered', category: 'requirements', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'location', label: 'Location or Service Area', category: 'location', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'timeline', label: 'Timeline / Availability', category: 'timeline', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'collaborationModel', label: 'Collaboration Model', category: 'commercial', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'descriptionScope', label: 'Description / Scope', category: 'technical', requiredWeight: 8, recommendedWeight: 0 },
    { fieldId: 'budgetValueTerms', label: 'Budget / Value Terms', category: 'financial', requiredWeight: 0, recommendedWeight: 4 },
    { fieldId: 'preferredPartnerType', label: 'Preferred Partner Type', category: 'requirements', requiredWeight: 0, recommendedWeight: 4 },
    { fieldId: 'attachments', label: 'Attachments / Portfolio References', category: 'requirements', requiredWeight: 0, recommendedWeight: 4 },
    { fieldId: 'compliance', label: 'Compliance Requirements', category: 'legal', requiredWeight: 0, recommendedWeight: 4 },
    { fieldId: 'deliveryMilestones', label: 'Delivery Milestones', category: 'timeline', requiredWeight: 0, recommendedWeight: 4 },
  ]

  return fields.map((field) => {
    const present = presentIds.includes(field.fieldId)
    return {
      ...field,
      present,
      earnedRequired: present ? field.requiredWeight : 0,
      earnedRecommended: present ? field.recommendedWeight : 0,
      scope: 'core',
    }
  })
}

function createIncompleteSnapshot() {
  const presentIds = ['title', 'intent', 'categoryProfession', 'roleIntent', 'skillsIntent']
  const contributions = coreContributions(presentIds)
  const missingRequired = ['servicesIntent', 'location', 'timeline', 'collaborationModel', 'descriptionScope']
  const missingRecommended = [
    'budgetValueTerms',
    'preferredPartnerType',
    'attachments',
    'compliance',
    'deliveryMilestones',
  ]

  return {
    entityId: ENTITY_ID,
    score: 44,
    requiredScore: 50,
    recommendedScore: 0,
    publishReady: false,
    readinessLevel: 'basic',
    health: 'critical',
    missingRequiredFields: missingRequired,
    missingRecommendedFields: missingRecommended,
    completedRequiredFields: ['title', 'intent', 'categoryProfession', 'roleIntent', 'skillsIntent'],
    completedRecommendedFields: [],
    fieldContributions: contributions,
    explanations: [
      {
        code: 'READINESS_SCORE_SUMMARY',
        message: 'Readiness 44%',
        severity: 'info',
      },
      ...missingRequired.map((fieldId) => {
        const field = contributions.find((entry) => entry.fieldId === fieldId)
        return {
          code: `READINESS_MISSING_${fieldId.replace(/([A-Z])/g, '_$1').toUpperCase()}`,
          message: `Missing required: ${field?.label ?? fieldId}`,
          severity: 'critical',
          category: field?.category,
          fieldId,
        }
      }),
      {
        code: 'READINESS_RECOMMENDED_GAPS',
        message: '5 recommended field(s) remaining',
        severity: 'warning',
      },
    ],
    nextBestActions: [
      {
        fieldId: 'servicesIntent',
        label: 'Services Required or Offered',
        category: 'requirements',
        reasonCode: 'READINESS_MISSING_SERVICES_INTENT',
        impactPercent: 8,
        estimatedGain: 8,
        estimatedScore: 52,
        estimatedReadinessLevel: 'partial',
        priority: 'required',
      },
      {
        fieldId: 'location',
        label: 'Location or Service Area',
        category: 'location',
        reasonCode: 'READINESS_MISSING_LOCATION',
        impactPercent: 8,
        estimatedGain: 8,
        estimatedScore: 60,
        estimatedReadinessLevel: 'partial',
        priority: 'required',
      },
      {
        fieldId: 'budgetValueTerms',
        label: 'Budget / Value Terms',
        category: 'financial',
        reasonCode: 'READINESS_MISSING_BUDGET_VALUE_TERMS',
        impactPercent: 4,
        estimatedGain: 4,
        estimatedScore: 48,
        estimatedReadinessLevel: 'basic',
        priority: 'recommended',
      },
    ],
    blockingReasons: missingRequired.map((fieldId) => {
      const field = contributions.find((entry) => entry.fieldId === fieldId)
      return {
        code: `READINESS_MISSING_${fieldId.replace(/([A-Z])/g, '_$1').toUpperCase()}`,
        message: `Complete ${field?.label ?? fieldId}`,
        severity: 'critical',
        fieldId,
        category: field?.category,
      }
    }),
    snapshot: SNAPSHOT_META,
    evaluatedAt: '2026-07-09T12:00:00.000Z',
    locale: 'en-SA',
  }
}

function createPublishReadySnapshot() {
  const requiredIds = [
    'title',
    'intent',
    'categoryProfession',
    'roleIntent',
    'skillsIntent',
    'servicesIntent',
    'location',
    'timeline',
    'collaborationModel',
    'descriptionScope',
  ]
  const recommendedIds = [
    'budgetValueTerms',
    'preferredPartnerType',
    'attachments',
    'compliance',
    'deliveryMilestones',
  ]
  const presentIds = [...requiredIds, ...recommendedIds]
  const contributions = coreContributions(presentIds)

  return {
    entityId: ENTITY_ID,
    score: 100,
    requiredScore: 100,
    recommendedScore: 100,
    publishReady: true,
    readinessLevel: 'excellent',
    health: 'excellent',
    missingRequiredFields: [],
    missingRecommendedFields: [],
    completedRequiredFields: requiredIds,
    completedRecommendedFields: recommendedIds,
    fieldContributions: contributions,
    explanations: [
      {
        code: 'READINESS_SCORE_SUMMARY',
        message: 'Readiness 100%',
        severity: 'info',
      },
    ],
    nextBestActions: [],
    blockingReasons: [],
    snapshot: SNAPSHOT_META,
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

function createWarningSnapshot() {
  const requiredIds = [
    'title',
    'intent',
    'categoryProfession',
    'roleIntent',
    'skillsIntent',
    'servicesIntent',
    'location',
    'timeline',
    'collaborationModel',
    'descriptionScope',
  ]
  const missingRecommended = ['budgetValueTerms', 'attachments']
  const presentIds = requiredIds.filter((id) => !missingRecommended.includes(id))
  const contributions = coreContributions(presentIds)

  return {
    entityId: ENTITY_ID,
    score: 84,
    requiredScore: 100,
    recommendedScore: 60,
    publishReady: true,
    readinessLevel: 'ready',
    health: 'warning',
    missingRequiredFields: [],
    missingRecommendedFields: missingRecommended,
    fieldContributions: contributions,
    explanations: [
      {
        code: 'READINESS_SCORE_SUMMARY',
        message: 'Readiness 84%',
        severity: 'info',
      },
      {
        code: 'READINESS_RECOMMENDED_GAPS',
        message: '2 recommended field(s) remaining',
        severity: 'warning',
      },
    ],
    nextBestActions: [
      {
        fieldId: 'budgetValueTerms',
        label: 'Budget / Value Terms',
        category: 'financial',
        reasonCode: 'READINESS_MISSING_BUDGET_VALUE_TERMS',
        impactPercent: 4,
        estimatedGain: 4,
        estimatedScore: 88,
        estimatedReadinessLevel: 'ready',
        priority: 'recommended',
      },
    ],
    blockingReasons: [],
    snapshot: SNAPSHOT_META,
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

describe('Opportunity explainability adapter', () => {
  it('maps field IDs to registered READINESS_* reason codes', () => {
    for (const [fieldId, code] of Object.entries(OPPORTUNITY_FIELD_ID_TO_REASON_CODE)) {
      assert.equal(opportunityFieldIdToReasonCode(fieldId), code)
      assert.equal(isReasonCode(code), true)
    }
  })

  it('buildBreakdown returns required 80% / recommended 20% decomposition', () => {
    const snapshot = createIncompleteSnapshot()
    const breakdown = opportunityExplainabilityAdapter.buildBreakdown(snapshot)

    assert.equal(breakdown.length, 2)
    assert.equal(breakdown[0].label, 'Required fields')
    assert.equal(breakdown[0].weight, OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required)
    assert.equal(breakdown[0].maxScore, 80)
    assert.equal(breakdown[0].score, 40)
    assert.equal(breakdown[1].label, 'Recommended fields')
    assert.equal(breakdown[1].weight, OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended)
    assert.equal(breakdown[1].maxScore, 20)
    assert.equal(breakdown[1].score, 0)
  })

  it('buildRecommendations maps nextBestActions with impact and estimatedScore', () => {
    const snapshot = createIncompleteSnapshot()
    const recommendations = opportunityExplainabilityAdapter.buildRecommendations(snapshot)

    assert.equal(recommendations.length, 3)
    assert.equal(
      recommendations[0].reasonCode,
      READINESS_REASON_CODES.MISSING_SERVICES_INTENT,
    )
    assert.equal(recommendations[0].impactPercent, 8)
    assert.equal(recommendations[0].estimatedScore, 52)
    assert.equal(recommendations[0].href, '/opportunity/edit#services-intent')
    assert.equal(
      recommendations[2].reasonCode,
      READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS,
    )
  })

  it('buildTimeline emits evaluation and publish-ready milestone events', () => {
    const readySnapshot = {
      ...createPublishReadySnapshot(),
      createdAt: '2026-06-01T08:00:00.000Z',
    }
    const timeline = opportunityExplainabilityAdapter.buildTimeline(readySnapshot)

    assert.equal(timeline.length, 3)
    assert.equal(timeline[0].type, 'opportunity-created')
    assert.equal(timeline[1].type, 'opportunity-evaluated')
    assert.equal(timeline[2].type, 'opportunity-publish-ready')
    assert.equal(timeline[2].status, 'completed')
  })

  it('buildTimeline synthesizes evaluation event when only evaluatedAt is provided', () => {
    const snapshot = createIncompleteSnapshot()
    const timeline = opportunityExplainabilityAdapter.buildTimeline(snapshot)

    assert.equal(timeline.length, 1)
    assert.equal(timeline[0].type, 'opportunity-evaluated')
    assert.equal(timeline[0].status, 'blocked')
  })

  it('buildExplanation produces a valid ExplanationBundle for incomplete opportunities', () => {
    const bundle = buildOpportunityExplanation(createIncompleteSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.engine, ENGINE_ID.OPPORTUNITY)
    assert.equal(bundle.entityId, ENTITY_ID)
    assert.equal(bundle.health, HEALTH.CRITICAL)
    assert.equal(bundle.blockers.length, 5)
    assert.equal(bundle.weaknesses.length, 10)
    assert.ok(bundle.summary.includes('incomplete'))
  })

  it('buildExplanation marks publish-ready opportunities as excellent', () => {
    const bundle = buildOpportunityExplanation(createPublishReadySnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.reasons[0].code, READINESS_REASON_CODES.SCORE_SUMMARY)
    assert.ok(
      bundle.strengths.some((entry) => entry.code === READINESS_REASON_CODES.PUBLISH_READY),
    )
    assert.equal(bundle.recommendations.length, 0)
    assert.equal(bundle.blockers.length, 0)
  })

  it('buildExplanation surfaces blockingReasons as blockers', () => {
    const bundle = buildOpportunityExplanation(createIncompleteSnapshot())

    assert.ok(
      bundle.blockers.some(
        (blocker) => blocker.reasonCode === READINESS_REASON_CODES.MISSING_LOCATION,
      ),
    )
    assert.ok(
      bundle.reasons.some(
        (reason) => reason.code === READINESS_REASON_CODES.MISSING_SERVICES_INTENT,
      ),
    )
  })

  it('maps readiness health values to bundle health', () => {
    const warningBundle = buildOpportunityExplanation(createWarningSnapshot())
    assert.equal(warningBundle.health, HEALTH.WARNING)

    const criticalBundle = buildOpportunityExplanation(createIncompleteSnapshot())
    assert.equal(criticalBundle.health, HEALTH.CRITICAL)

    const excellentBundle = buildOpportunityExplanation(createPublishReadySnapshot())
    assert.equal(excellentBundle.health, HEALTH.EXCELLENT)
  })

  it('readinessExplainabilityAdapter alias uses ENGINE_ID.READINESS', () => {
    const snapshot = createPublishReadySnapshot()
    const bundle = buildReadinessExplanation(snapshot)

    assert.equal(bundle.engine, ENGINE_ID.READINESS)
    assert.equal(bundle.metadata.source, 'readiness-adapter')
    assert.deepEqual(
      bundle.recommendations,
      readinessExplainabilityAdapter.buildRecommendations(snapshot),
    )
  })

  it('includes snapshot metadata in bundle extensions', () => {
    const bundle = buildOpportunityExplanation(createIncompleteSnapshot())

    assert.equal(bundle.metadata.extensions.knowledgeVersion, 2)
    assert.equal(bundle.metadata.extensions.formVersion, '1.2.0')
    assert.equal(bundle.metadata.engineVersion, '1.0.0')
  })

  it('uses only valid ReasonCode values across the bundle', () => {
    const snapshots = [
      createIncompleteSnapshot(),
      createPublishReadySnapshot(),
      createWarningSnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildOpportunityExplanation(snapshot)
      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, `Invalid reason code: ${code}`)
      }
    }
  })

  it('adapter methods stay consistent inside buildExplanation', () => {
    const snapshot = createWarningSnapshot()
    const bundle = opportunityExplainabilityAdapter.buildExplanation(snapshot)

    assert.deepEqual(
      bundle.recommendations,
      opportunityExplainabilityAdapter.buildRecommendations(snapshot),
    )
    assert.deepEqual(
      bundle.scoreBreakdown,
      opportunityExplainabilityAdapter.buildBreakdown(snapshot),
    )
    assert.deepEqual(
      bundle.timeline,
      opportunityExplainabilityAdapter.buildTimeline(snapshot),
    )
  })

  it('round-trips opportunity ExplanationBundle through AI serialization', () => {
    const bundle = buildOpportunityExplanation(createIncompleteSnapshot())
    const json = serializeExplanationBundle(bundle)
    const restored = deserializeExplanationBundle(json)
    const payload = toAIExplanationPayload(restored, '2026-07-09T12:00:00.000Z')

    assert.deepEqual(restored, bundle)
    assert.equal(payload.bundle.engine, ENGINE_ID.OPPORTUNITY)
    assert.equal(isExplanationBundle(payload.bundle), true)
  })

  it('maps required-field gaps to critical severity recommendations', () => {
    const snapshot = createIncompleteSnapshot()
    const [recommendation] = opportunityExplainabilityAdapter.buildRecommendations(snapshot)

    assert.equal(recommendation.reasonCode, READINESS_REASON_CODES.MISSING_SERVICES_INTENT)
    assert.equal(recommendation.priority, 'critical')
    assert.equal(recommendation.severity, EXPLANATION_SEVERITY.CRITICAL)
  })
})
