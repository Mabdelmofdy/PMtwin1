import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AGREEMENT_ADAPTER_SCORE_WEIGHTS,
  AGREEMENT_ADAPTER_VERSION,
  AGREEMENT_REASON_CODES,
  AGREEMENT_STATUS_TO_REASON_CODE,
  COMMERCIAL_REASON_CODES,
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  buildAgreementExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  agreementExplainabilityAdapter,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'deal-001'
const EVALUATED_AT = '2026-07-09T14:00:00.000Z'

function createSigningWithPendingApprovalSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'signing',
    decisionStatus: 'pending',
    pendingSignatures: 2,
    totalSignatures: 3,
    linkedNegotiationId: 'neg-001',
    evaluatedAt: EVALUATED_AT,
    locale: 'en-SA',
  }
}

function createReviewSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'review',
    decisionStatus: 'not_required',
    evaluatedAt: EVALUATED_AT,
  }
}

function createExecutingWithContractSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'executing',
    decisionStatus: 'approved',
    linkedContractId: 'contract-001',
    canCreateContract: false,
    evaluatedAt: EVALUATED_AT,
  }
}

function createCompletedSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'completed',
    decisionStatus: 'approved',
    linkedContractId: 'contract-001',
    evaluatedAt: EVALUATED_AT,
  }
}

function createCancelledSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'cancelled',
    evaluatedAt: EVALUATED_AT,
  }
}

function createContractMissingSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'signing',
    decisionStatus: 'approved',
    canCreateContract: true,
    pendingSignatures: 0,
    totalSignatures: 2,
    evaluatedAt: EVALUATED_AT,
  }
}

function createStageBlockersSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'review',
    stageBlockers: [
      {
        code: 'vat_validation',
        label: 'VAT validation required',
        resolutionHint: 'Upload valid VAT certificate',
      },
    ],
    evaluatedAt: EVALUATED_AT,
  }
}

function createTimelineSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'executing',
    createdAt: '2026-07-01T08:00:00.000Z',
    stageTransitions: [
      { stage: 'draft', timestamp: '2026-07-01T08:00:00.000Z' },
      { stage: 'review', timestamp: '2026-07-03T10:00:00.000Z' },
      { stage: 'signing', timestamp: '2026-07-05T12:00:00.000Z' },
      { stage: 'executing', timestamp: '2026-07-08T14:00:00.000Z' },
    ],
    evaluatedAt: EVALUATED_AT,
  }
}

function collectReasonCodes(bundle) {
  const codes = new Set()

  for (const reason of bundle.reasons) codes.add(reason.code)
  for (const blocker of bundle.blockers) codes.add(blocker.reasonCode)
  for (const entry of bundle.strengths) codes.add(entry.code)
  for (const entry of bundle.weaknesses) codes.add(entry.code)
  for (const recommendation of bundle.recommendations) {
    codes.add(recommendation.reasonCode)
  }
  for (const breakdown of bundle.scoreBreakdown) {
    for (const code of breakdown.reasonCodes) codes.add(code)
  }

  return [...codes]
}

describe('Agreement explainability adapter', () => {
  it('maps agreement status values to registered AGREEMENT_* reason codes', () => {
    for (const [status, code] of Object.entries(AGREEMENT_STATUS_TO_REASON_CODE)) {
      assert.equal(code.startsWith('AGREEMENT_'), true, status)
      assert.equal(isReasonCode(code), true, status)
    }
  })

  it('maps signing with pending approval to warning health with commercial blocker', () => {
    const bundle = buildAgreementExplanation(createSigningWithPendingApprovalSnapshot())

    assert.equal(bundle.engine, ENGINE_ID.AGREEMENT)
    assert.equal(bundle.health, HEALTH.WARNING)
    assert.equal(
      bundle.blockers.some(
        (blocker) => blocker.reasonCode === COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      ),
      true,
    )
    assert.equal(
      bundle.weaknesses.some(
        (entry) => entry.code === AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      ),
      true,
    )
  })

  it('maps review stage to review recommendation', () => {
    const bundle = buildAgreementExplanation(createReviewSnapshot())

    assert.equal(bundle.health, HEALTH.WARNING)
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === AGREEMENT_REASON_CODES.REVIEW_INCOMPLETE,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.find(
        (rec) => rec.reasonCode === AGREEMENT_REASON_CODES.REVIEW_INCOMPLETE,
      )?.href,
      `/commercial-agreements/${ENTITY_ID}/review`,
    )
  })

  it('maps executing with linked contract to good health', () => {
    const bundle = buildAgreementExplanation(createExecutingWithContractSnapshot())

    assert.equal(bundle.health, HEALTH.GOOD)
    assert.equal(
      bundle.strengths.some(
        (entry) => entry.code === AGREEMENT_REASON_CODES.STATUS_EXECUTING,
      ),
      true,
    )
  })

  it('maps completed agreement to excellent health', () => {
    const bundle = buildAgreementExplanation(createCompletedSnapshot())

    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.score, 100)
    assert.equal(bundle.blockers.length, 0)
    assert.match(bundle.summary, /completed/i)
  })

  it('maps cancelled agreement to critical health with blocker', () => {
    const bundle = buildAgreementExplanation(createCancelledSnapshot())

    assert.equal(bundle.health, HEALTH.CRITICAL)
    assert.equal(bundle.blockers.length, 1)
    assert.equal(
      bundle.blockers[0].reasonCode,
      AGREEMENT_REASON_CODES.STATUS_CANCELLED,
    )
  })

  it('recommends contract creation when eligible and missing', () => {
    const bundle = buildAgreementExplanation(createContractMissingSnapshot())

    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      ),
      true,
    )
    assert.equal(
      bundle.reasons.some(
        (reason) => reason.code === AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      ),
      true,
    )
  })

  it('surfaces stage blockers as critical recommendations', () => {
    const bundle = buildAgreementExplanation(createStageBlockersSnapshot())

    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      ),
      true,
    )
    assert.equal(bundle.blockers.length, 1)
  })

  it('buildBreakdown weights sum to 100', () => {
    const breakdown = agreementExplainabilityAdapter.buildBreakdown(
      createSigningWithPendingApprovalSnapshot(),
    )
    const totalWeight = breakdown.reduce((sum, entry) => sum + entry.weight, 0)

    assert.equal(totalWeight, 100)
    assert.equal(breakdown.length, 4)
    assert.equal(breakdown[0].label, 'Stage progression')
  })

  it('synthesizes timeline from stage transitions', () => {
    const timeline = agreementExplainabilityAdapter.buildTimeline(createTimelineSnapshot())

    assert.ok(timeline.length >= 4)
    assert.equal(timeline[0].type, 'agreement-created')
    assert.equal(timeline.some((event) => event.type === 'agreement-executing'), true)
  })

  it('includes agreement metadata extensions', () => {
    const bundle = buildAgreementExplanation(createSigningWithPendingApprovalSnapshot())

    assert.equal(bundle.metadata.engineVersion, AGREEMENT_ADAPTER_VERSION)
    assert.equal(bundle.metadata.source, 'agreement-adapter')
    assert.equal(bundle.metadata.extensions.status, 'signing')
    assert.equal(bundle.metadata.extensions.decisionStatus, 'pending')
    assert.equal(bundle.metadata.extensions.pendingSignatures, 2)
  })

  it('produces a valid ExplanationBundle with registered reason codes only', () => {
    const snapshots = [
      createSigningWithPendingApprovalSnapshot(),
      createReviewSnapshot(),
      createExecutingWithContractSnapshot(),
      createCompletedSnapshot(),
      createCancelledSnapshot(),
      createContractMissingSnapshot(),
      createStageBlockersSnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildAgreementExplanation(snapshot)
      assert.equal(isExplanationBundle(bundle), true)

      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, String(code))
      }
    }
  })

  it('round-trips through AI serialization', () => {
    const bundle = buildAgreementExplanation(createCompletedSnapshot())
    const payload = toAIExplanationPayload(bundle)
    const restored = deserializeExplanationBundle(serializeExplanationBundle(bundle))

    assert.equal(payload.bundle.engine, ENGINE_ID.AGREEMENT)
    assert.equal(restored.score, 100)
    assert.equal(restored.health, HEALTH.EXCELLENT)
    assert.equal(restored.metadata.extensions.status, 'completed')
  })

  it('uses commercial reason codes for approval gates within agreement adapter', () => {
    const bundle = buildAgreementExplanation(createSigningWithPendingApprovalSnapshot())

    assert.equal(
      bundle.reasons.some(
        (reason) => reason.code === COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      ),
      true,
    )
    assert.equal(
      Object.values(AGREEMENT_ADAPTER_SCORE_WEIGHTS).reduce((a, b) => a + b, 0),
      100,
    )
  })
})
