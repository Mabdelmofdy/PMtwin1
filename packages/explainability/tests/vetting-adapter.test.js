import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DOCUMENT_REASON_CODES,
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  VETTING_ADAPTER_SCORE_WEIGHTS,
  VETTING_DOCUMENT_LABEL_TO_REASON_CODE,
  VETTING_REASON_CODES,
  buildVettingExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  serializeExplanationBundle,
  toAIExplanationPayload,
  vettingDocumentLabelToReasonCode,
  vettingExplainabilityAdapter,
} from '../dist/index.js'

const ENTITY_ID = 'vetting-party-001'

function createIncompleteSnapshot() {
  return {
    entityId: ENTITY_ID,
    score: 18,
    status: 'incomplete',
    missingRequired: [
      'Document: Commercial Registration',
      'Document: VAT Certificate',
      'Document: Insurance Certificate',
      'Document: License',
      'Document: National ID',
    ],
    missingRecommended: ['Start admin review'],
    recommendations: [
      'Upload Commercial Registration',
      'Upload VAT Certificate',
      'Upload Insurance Certificate',
      'Upload License',
      'Upload National ID',
      'Start admin review',
    ],
    documentsProgress: {
      approvedRequired: 0,
      totalRequired: 5,
    },
    reviewProgress: 'not_started',
    evaluatedAt: '2026-07-09T12:00:00.000Z',
    locale: 'en-SA',
  }
}

function createChangesRequestedSnapshot() {
  return {
    entityId: ENTITY_ID,
    score: 72,
    status: 'needs_review',
    missingRequired: [
      'Document: VAT Certificate',
      'Document: Insurance Certificate',
      'Document: License',
      'Document: National ID',
    ],
    missingRecommended: ['Resolve requested changes and resubmit'],
    recommendations: [
      'Upload VAT Certificate',
      'Upload Insurance Certificate',
      'Upload License',
      'Upload National ID',
      'Resolve requested changes and resubmit',
    ],
    documentsProgress: {
      approvedRequired: 1,
      totalRequired: 5,
    },
    reviewProgress: 'changes_requested',
    changesResolved: false,
    documents: [
      {
        type: 'commercial_registration',
        status: 'approved',
        uploadedAt: '2026-07-01T08:00:00.000Z',
      },
      {
        type: 'vat_certificate',
        status: 'pending_review',
        uploadedAt: '2026-07-02T08:00:00.000Z',
      },
    ],
    createdAt: '2026-06-15T08:00:00.000Z',
    reviewStartedAt: '2026-07-03T10:00:00.000Z',
    changesRequestedAt: '2026-07-05T14:00:00.000Z',
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

function createActiveSnapshot() {
  return {
    entityId: ENTITY_ID,
    score: 100,
    status: 'ready_for_matching',
    missingRequired: [],
    missingRecommended: [],
    recommendations: [],
    documentsProgress: {
      approvedRequired: 5,
      totalRequired: 5,
    },
    reviewProgress: 'approved',
    accountStatus: 'active',
    evaluatedAt: '2026-07-09T12:00:00.000Z',
  }
}

function createReadySnapshot() {
  return {
    entityId: ENTITY_ID,
    score: 96,
    status: 'ready_for_matching',
    missingRequired: [],
    missingRecommended: [],
    recommendations: [],
    documentsProgress: {
      approvedRequired: 5,
      totalRequired: 5,
    },
    reviewProgress: 'approved',
    reviewApprovedAt: '2026-07-08T16:00:00.000Z',
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

describe('Vetting explainability adapter', () => {
  it('maps document labels to registered DOCUMENT_* reason codes', () => {
    for (const [label, code] of Object.entries(VETTING_DOCUMENT_LABEL_TO_REASON_CODE)) {
      assert.equal(vettingDocumentLabelToReasonCode(label), code)
      assert.equal(isReasonCode(code), true)
    }
  })

  it('buildBreakdown returns documents 80% / review 20% decomposition', () => {
    const snapshot = createIncompleteSnapshot()
    const breakdown = vettingExplainabilityAdapter.buildBreakdown(snapshot)

    assert.equal(breakdown.length, 2)
    assert.equal(breakdown[0].label, 'Documents')
    assert.equal(breakdown[0].weight, VETTING_ADAPTER_SCORE_WEIGHTS.documents)
    assert.equal(breakdown[0].maxScore, 80)
    assert.equal(breakdown[0].score, 0)
    assert.equal(breakdown[1].label, 'Review')
    assert.equal(breakdown[1].weight, VETTING_ADAPTER_SCORE_WEIGHTS.review)
    assert.equal(breakdown[1].maxScore, 20)
    assert.equal(breakdown[1].score, 2)
  })

  it('buildBreakdown applies partial document credit when statuses are provided', () => {
    const snapshot = createChangesRequestedSnapshot()
    const breakdown = vettingExplainabilityAdapter.buildBreakdown(snapshot)

    assert.equal(breakdown[0].score, 26.4)
    assert.equal(breakdown[1].score, 4)
  })

  it('buildRecommendations assigns impact from weight shares', () => {
    const snapshot = createChangesRequestedSnapshot()
    const recommendations = vettingExplainabilityAdapter.buildRecommendations(snapshot)

    assert.equal(recommendations.length, 5)
    assert.equal(
      recommendations[0].reasonCode,
      DOCUMENT_REASON_CODES.VAT_MISSING,
    )
    assert.equal(recommendations[0].impactPercent, 16)
    assert.equal(recommendations[0].href, '/vetting/documents#vat_certificate')
    assert.equal(recommendations[4].reasonCode, VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED)
    assert.equal(recommendations[4].href, '/vetting/review#resubmit')
  })

  it('buildTimeline emits upload, review, and evaluation events when timestamps exist', () => {
    const snapshot = createChangesRequestedSnapshot()
    const timeline = vettingExplainabilityAdapter.buildTimeline(snapshot)

    assert.ok(timeline.length >= 4)
    assert.equal(timeline[0].type, 'vetting-started')
    assert.ok(timeline.some((event) => event.type === 'vetting-document-uploaded'))
    assert.ok(timeline.some((event) => event.type === 'vetting-changes-requested'))
    assert.equal(timeline.at(-1)?.type, 'vetting-evaluated')
  })

  it('buildTimeline synthesizes evaluation event when only evaluatedAt is provided', () => {
    const snapshot = createIncompleteSnapshot()
    const timeline = vettingExplainabilityAdapter.buildTimeline(snapshot)

    assert.equal(timeline.length, 1)
    assert.equal(timeline[0].type, 'vetting-evaluated')
    assert.equal(timeline[0].status, 'blocked')
  })

  it('buildExplanation produces a valid ExplanationBundle for incomplete vetting', () => {
    const bundle = buildVettingExplanation(createIncompleteSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.engine, ENGINE_ID.VETTING)
    assert.equal(bundle.entityId, ENTITY_ID)
    assert.equal(bundle.health, HEALTH.CRITICAL)
    assert.equal(bundle.blockers.length, 5)
    assert.equal(bundle.weaknesses.length, 6)
    assert.ok(bundle.summary.includes('incomplete'))
  })

  it('buildExplanation marks active accounts as excellent with VETTING_ACTIVE', () => {
    const bundle = buildVettingExplanation(createActiveSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.reasons[0].code, VETTING_REASON_CODES.ACTIVE)
    assert.ok(
      bundle.strengths.some((entry) => entry.code === VETTING_REASON_CODES.ACTIVE),
    )
    assert.equal(bundle.recommendations.length, 0)
    assert.equal(bundle.blockers.length, 0)
  })

  it('buildExplanation surfaces changes-requested review as blocker', () => {
    const bundle = buildVettingExplanation(createChangesRequestedSnapshot())

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.health, HEALTH.WARNING)
    assert.ok(
      bundle.blockers.some(
        (blocker) => blocker.reasonCode === VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
      ),
    )
    assert.ok(
      bundle.reasons.some(
        (reason) => reason.code === VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
      ),
    )
  })

  it('buildExplanation marks cleared vetting as complete', () => {
    const bundle = buildVettingExplanation(createReadySnapshot())

    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.reasons[0].code, VETTING_REASON_CODES.COMPLETE)
    assert.ok(
      bundle.strengths.some((entry) => entry.code === VETTING_REASON_CODES.DOCUMENTS_COMPLETE),
    )
  })

  it('uses only valid ReasonCode values across the bundle', () => {
    const snapshots = [
      createIncompleteSnapshot(),
      createChangesRequestedSnapshot(),
      createActiveSnapshot(),
      createReadySnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildVettingExplanation(snapshot)
      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, `Invalid reason code: ${code}`)
      }
    }
  })

  it('adapter methods stay consistent inside buildExplanation', () => {
    const snapshot = createChangesRequestedSnapshot()
    const bundle = vettingExplainabilityAdapter.buildExplanation(snapshot)

    assert.deepEqual(bundle.recommendations, vettingExplainabilityAdapter.buildRecommendations(snapshot))
    assert.deepEqual(bundle.scoreBreakdown, vettingExplainabilityAdapter.buildBreakdown(snapshot))
    assert.deepEqual(bundle.timeline, vettingExplainabilityAdapter.buildTimeline(snapshot))
  })

  it('round-trips vetting ExplanationBundle through AI serialization', () => {
    const bundle = buildVettingExplanation(createIncompleteSnapshot())
    const json = serializeExplanationBundle(bundle)
    const restored = deserializeExplanationBundle(json)
    const payload = toAIExplanationPayload(restored, '2026-07-09T12:00:00.000Z')

    assert.deepEqual(restored, bundle)
    assert.equal(payload.bundle.engine, ENGINE_ID.VETTING)
    assert.equal(isExplanationBundle(payload.bundle), true)
  })

  it('maps document gaps to critical severity recommendations', () => {
    const snapshot = {
      ...createIncompleteSnapshot(),
      missingRequired: ['Document: VAT Certificate'],
      missingRecommended: [],
      recommendations: ['Upload VAT Certificate'],
      documentsProgress: {
        approvedRequired: 0,
        totalRequired: 5,
      },
      score: 2,
    }
    const [recommendation] = vettingExplainabilityAdapter.buildRecommendations(snapshot)

    assert.equal(recommendation.reasonCode, DOCUMENT_REASON_CODES.VAT_MISSING)
    assert.equal(recommendation.priority, 'critical')
    assert.equal(recommendation.severity, EXPLANATION_SEVERITY.CRITICAL)
    assert.equal(recommendation.impactPercent, 16)
  })
})
