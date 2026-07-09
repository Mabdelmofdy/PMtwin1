import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CONTRACT_ADAPTER_SCORE_WEIGHTS,
  CONTRACT_ADAPTER_VERSION,
  CONTRACT_REASON_CODES,
  CONTRACT_STATUS_TO_REASON_CODE,
  ENGINE_ID,
  HEALTH,
  buildContractExplanation,
  deserializeExplanationBundle,
  isExplanationBundle,
  isReasonCode,
  contractExplainabilityAdapter,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'

const ENTITY_ID = 'contract-001'
const EVALUATED_AT = '2026-07-09T14:00:00.000Z'

function createPendingSignatureSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'pending_signature',
    parties: [
      { userId: 'user-a', role: 'client', signedAt: '2026-07-08T10:00:00.000Z' },
      { userId: 'user-b', role: 'provider', signedAt: null },
    ],
    canSign: true,
    evaluatedAt: EVALUATED_AT,
    locale: 'en-SA',
  }
}

function createActivationReadySnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'pending_signature',
    partiesSigned: 2,
    totalParties: 2,
    canSign: false,
    evaluatedAt: EVALUATED_AT,
  }
}

function createActiveSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'active',
    partiesSigned: 2,
    totalParties: 2,
    canComplete: true,
    canTerminate: true,
    activatedAt: '2026-07-09T08:00:00.000Z',
    evaluatedAt: EVALUATED_AT,
  }
}

function createCompletedSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'completed',
    partiesSigned: 2,
    totalParties: 2,
    completedAt: '2026-07-09T16:00:00.000Z',
    completionReason: 'All milestones delivered',
    evaluatedAt: EVALUATED_AT,
  }
}

function createTerminatedSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'terminated',
    terminationReason: 'Mutual agreement to terminate',
    terminatedAt: '2026-07-09T12:00:00.000Z',
    evaluatedAt: EVALUATED_AT,
  }
}

function createBlockedMilestonesSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'active',
    partiesSigned: 2,
    totalParties: 2,
    milestones: [
      { id: 'm1', title: 'Phase 1', status: 'completed' },
      { id: 'm2', title: 'Phase 2', status: 'blocked' },
    ],
    evaluatedAt: EVALUATED_AT,
  }
}

function createTimelineSnapshot() {
  return {
    entityId: ENTITY_ID,
    status: 'active',
    createdAt: '2026-07-01T08:00:00.000Z',
    parties: [
      { userId: 'user-a', signedAt: '2026-07-05T10:00:00.000Z' },
      { userId: 'user-b', signedAt: '2026-07-06T11:00:00.000Z' },
    ],
    activatedAt: '2026-07-07T09:00:00.000Z',
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

describe('Contract explainability adapter', () => {
  it('maps contract status values to registered CONTRACT_* reason codes', () => {
    for (const [status, code] of Object.entries(CONTRACT_STATUS_TO_REASON_CODE)) {
      assert.equal(code.startsWith('CONTRACT_'), true, status)
      assert.equal(isReasonCode(code), true, status)
    }
  })

  it('maps pending signature with unsigned party to warning health', () => {
    const bundle = buildContractExplanation(createPendingSignatureSnapshot())

    assert.equal(bundle.engine, ENGINE_ID.CONTRACT)
    assert.equal(bundle.health, HEALTH.WARNING)
    assert.equal(
      bundle.reasons.some(
        (reason) => reason.code === CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.find(
        (rec) => rec.reasonCode === CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      )?.href,
      `/contracts/${ENTITY_ID}/sign`,
    )
  })

  it('recommends activation when all signatures collected', () => {
    const bundle = buildContractExplanation(createActivationReadySnapshot())

    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      ),
      true,
    )
    assert.equal(
      bundle.reasons.some(
        (reason) => reason.code === CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      ),
      true,
    )
  })

  it('maps active contract with completion eligibility', () => {
    const bundle = buildContractExplanation(createActiveSnapshot())

    assert.equal(bundle.health, HEALTH.GOOD)
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === CONTRACT_REASON_CODES.COMPLETION_READY,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === CONTRACT_REASON_CODES.TERMINATION_AVAILABLE,
      ),
      true,
    )
  })

  it('maps completed contract to excellent health', () => {
    const bundle = buildContractExplanation(createCompletedSnapshot())

    assert.equal(bundle.health, HEALTH.EXCELLENT)
    assert.equal(bundle.score, 100)
    assert.equal(bundle.blockers.length, 0)
    assert.match(bundle.summary, /completed/i)
  })

  it('maps terminated contract to critical health with blocker', () => {
    const bundle = buildContractExplanation(createTerminatedSnapshot())

    assert.equal(bundle.health, HEALTH.CRITICAL)
    assert.equal(bundle.blockers.length, 1)
    assert.equal(
      bundle.blockers[0].reasonCode,
      CONTRACT_REASON_CODES.STATUS_TERMINATED,
    )
    assert.match(bundle.summary, /terminated/i)
  })

  it('surfaces blocked milestones as weakness and recommendation', () => {
    const bundle = buildContractExplanation(createBlockedMilestonesSnapshot())

    assert.equal(
      bundle.weaknesses.some(
        (entry) => entry.code === CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      ),
      true,
    )
    assert.equal(
      bundle.recommendations.some(
        (rec) => rec.reasonCode === CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      ),
      true,
    )
    assert.equal(bundle.blockers.length, 1)
  })

  it('buildBreakdown weights sum to 100', () => {
    const breakdown = contractExplainabilityAdapter.buildBreakdown(
      createPendingSignatureSnapshot(),
    )
    const totalWeight = breakdown.reduce((sum, entry) => sum + entry.weight, 0)

    assert.equal(totalWeight, 100)
    assert.equal(breakdown.length, 4)
    assert.equal(breakdown[0].label, 'Party signatures')
  })

  it('synthesizes timeline from created, signatures, and activation', () => {
    const timeline = contractExplainabilityAdapter.buildTimeline(createTimelineSnapshot())

    assert.ok(timeline.length >= 3)
    assert.equal(timeline[0].type, 'contract-created')
    assert.equal(timeline.some((event) => event.type === 'contract-signed'), true)
    assert.equal(timeline.some((event) => event.type === 'contract-activated'), true)
  })

  it('includes contract metadata extensions', () => {
    const bundle = buildContractExplanation(createActiveSnapshot())

    assert.equal(bundle.metadata.engineVersion, CONTRACT_ADAPTER_VERSION)
    assert.equal(bundle.metadata.source, 'contract-adapter')
    assert.equal(bundle.metadata.extensions.status, 'active')
    assert.equal(bundle.metadata.extensions.canComplete, true)
    assert.equal(bundle.metadata.extensions.partiesSigned, 2)
  })

  it('produces a valid ExplanationBundle with registered reason codes only', () => {
    const snapshots = [
      createPendingSignatureSnapshot(),
      createActivationReadySnapshot(),
      createActiveSnapshot(),
      createCompletedSnapshot(),
      createTerminatedSnapshot(),
      createBlockedMilestonesSnapshot(),
    ]

    for (const snapshot of snapshots) {
      const bundle = buildContractExplanation(snapshot)
      assert.equal(isExplanationBundle(bundle), true)

      for (const code of collectReasonCodes(bundle)) {
        assert.equal(isReasonCode(code), true, String(code))
      }
    }
  })

  it('round-trips through AI serialization', () => {
    const bundle = buildContractExplanation(createCompletedSnapshot())
    const payload = toAIExplanationPayload(bundle)
    const restored = deserializeExplanationBundle(serializeExplanationBundle(bundle))

    assert.equal(payload.bundle.engine, ENGINE_ID.CONTRACT)
    assert.equal(restored.score, 100)
    assert.equal(restored.health, HEALTH.EXCELLENT)
    assert.equal(restored.metadata.extensions.status, 'completed')
  })

  it('uses CONTRACT_ADAPTER_SCORE_WEIGHTS totaling 100', () => {
    const total = Object.values(CONTRACT_ADAPTER_SCORE_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0,
    )
    assert.equal(total, 100)
  })
})
