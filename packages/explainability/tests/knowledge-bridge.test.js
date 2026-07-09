import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  KNOWLEDGE_REASON_CODES,
  READINESS_REASON_CODES,
  buildOpportunityExplanation,
  createKnowledgeBridge,
  enrichExplanationBundle,
  isReasonCode,
} from '../dist/index.js'

const ENTITY_ID = 'opportunity-task-based-001'
const TASK_BASED = 'task_based'

function createTaskBasedSnapshot() {
  return {
    entityId: ENTITY_ID,
    subModelKey: TASK_BASED,
    score: 42,
    requiredScore: 55,
    recommendedScore: 30,
    publishReady: false,
    readinessLevel: 'low',
    health: 'at_risk',
    missingRequiredFields: ['detailedScope', 'requiredSkills'],
    missingRecommendedFields: ['paymentTerms'],
    completedRequiredFields: ['taskTitle'],
    completedRecommendedFields: [],
    fieldContributions: [],
    explanations: [],
    nextBestActions: [],
    blockingReasons: [],
    snapshot: {
      generatedAt: '2026-07-09T12:00:00.000Z',
      knowledgeVersion: 1,
      formVersion: '1.0.0',
      engineVersion: '1.0.0',
    },
    evaluatedAt: '2026-07-09T12:00:00.000Z',
    locale: 'en-SA',
  }
}

describe('KnowledgeBridge', () => {
  const bridge = createKnowledgeBridge()

  it('resolveEducationalContent returns content for task_based', () => {
    const answer = bridge.resolveEducationalContent({
      reasonCode: KNOWLEDGE_REASON_CODES.EDUCATIONAL_HINT,
      context: { subModelKey: TASK_BASED },
    })

    assert.ok(answer)
    assert.equal(answer.reasonCode, KNOWLEDGE_REASON_CODES.EDUCATIONAL_HINT)
    assert.match(answer.body, /deliverable/i)
  })

  it('resolveKnowledgeAnswer maps readiness field codes to field guidance', () => {
    const answer = bridge.resolveKnowledgeAnswer({
      reasonCode: READINESS_REASON_CODES.MISSING_SCOPE,
      context: { subModelKey: TASK_BASED },
    })

    assert.ok(answer)
    assert.equal(isReasonCode(answer.reasonCode), true, answer.reasonCode)
  })

  it('resolveComplianceHints returns registry-backed hints', () => {
    const hints = bridge.resolveComplianceHints({
      reasonCode: KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT,
      context: { subModelKey: TASK_BASED },
    })

    assert.ok(hints.length > 0)
    for (const hint of hints) {
      assert.equal(isReasonCode(hint.reasonCode), true, hint.reasonCode)
    }
  })
})

describe('enrichExplanationBundle', () => {
  it('adds knowledge extensions without replacing adapter output', () => {
    const baseBundle = buildOpportunityExplanation(createTaskBasedSnapshot())
    const originalSummary = baseBundle.summary
    const originalReasonCount = baseBundle.reasons.length

    const enriched = enrichExplanationBundle(baseBundle, {
      subModelKey: TASK_BASED,
      locale: 'en-SA',
    })

    assert.equal(enriched.summary, originalSummary)
    assert.equal(enriched.score, baseBundle.score)
    assert.ok(enriched.reasons.length >= originalReasonCount)
    assert.ok(enriched.metadata.extensions?.knowledge)
    assert.equal(enriched.metadata.extensions.knowledge.subModelKey, TASK_BASED)
    assert.ok(enriched.metadata.extensions.knowledge.whatIsIt)
    assert.ok(Array.isArray(enriched.metadata.extensions.knowledge.risks))

    for (const reason of enriched.reasons) {
      assert.equal(isReasonCode(reason.code), true, reason.code)
    }
  })

  it('preserves valid reason codes from the adapter', () => {
    const baseBundle = buildOpportunityExplanation(createTaskBasedSnapshot())
    const enriched = enrichExplanationBundle(baseBundle, { subModelKey: TASK_BASED })

    const adapterCodes = new Set(baseBundle.reasons.map((reason) => reason.code))
    for (const code of adapterCodes) {
      assert.equal(
        enriched.reasons.some((reason) => reason.code === code),
        true,
        `missing adapter reason code ${code}`,
      )
    }
  })
})
