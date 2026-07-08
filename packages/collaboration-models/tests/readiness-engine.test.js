import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import {
  evaluateReadiness,
  clearReadinessCaches,
  buildReadinessSummary,
  buildReadinessBreakdown,
  buildReadinessTimeline,
  getNextBestActions,
  getBlockingReasons,
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '../dist/index.js'

const readyNeedOpportunity = {
  title: 'Architect need — sustainable tower',
  intent: 'need',
  scope: {
    sectors: ['Construction', 'Architecture'],
    requiredSkills: ['BIM', 'Sustainable Design', 'LEED Certification'],
  },
  attributes: {
    targetRole: 'Architect',
    startDate: '2026-03-01',
    tenderDeadline: '2026-06-01',
  },
  normalized: {
    requiredServices: ['Architectural Design', 'BIM Coordination'],
  },
  location: 'Riyadh, Saudi Arabia',
  modelType: 'project_based',
  description: 'Seeking a senior architect for a mixed-use tower delivery.',
  exchangeData: {
    budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
  },
  preferredPartnerType: 'company',
  attachments: [{ name: 'design-brief.pdf' }],
  complianceRequirements: ['Saudi Building Code'],
  deliveryMilestones: [{ title: 'Concept design', dueDate: '2026-04-01' }],
}

describe('readiness engine', () => {
  beforeEach(() => {
    clearReadinessCaches()
  })

  it('draft starts at 0%', () => {
    const result = evaluateReadiness({ formState: {} })
    assert.equal(result.score, 0)
    assert.equal(result.readinessLevel, 'draft')
    assert.equal(result.publishReady, false)
    assert.equal(result.missingRequiredFields.length, 10)
    assert.equal(result.missingRecommendedFields.length, 5)
  })

  it('progressive score increase', () => {
    const empty = evaluateReadiness({ formState: {} })
    const partial = evaluateReadiness({
      formState: { title: 'Need', intent: 'need', description: 'Scope details' },
    })
    assert.ok(partial.score > empty.score)
  })

  it('required and recommended scores separate', () => {
    const requiredOnly = evaluateReadiness({
      formState: {
        title: 'Required-only need',
        intent: 'need',
        scope: { sectors: ['Infrastructure'], requiredSkills: ['Project Planning'] },
        attributes: { targetRole: 'Project Manager', startDate: '2026-04-01' },
        normalized: { requiredServices: ['Program Management'] },
        location: 'Dammam',
        modelType: 'project_based',
        description: 'Need project manager for infrastructure rollout.',
      },
    })
    assert.equal(requiredOnly.score, OPPORTUNITY_READINESS_SCORE_WEIGHTS.required)
    assert.equal(requiredOnly.requiredScore, 100)
    assert.equal(requiredOnly.recommendedScore, 0)
  })

  it('full opportunity reaches 100%', () => {
    const result = evaluateReadiness({ formState: readyNeedOpportunity })
    assert.equal(result.score, 100)
    assert.equal(result.readinessLevel, 'excellent')
    assert.equal(result.publishReady, true)
  })

  it('explanations include reason codes and severity', () => {
    const result = evaluateReadiness({ formState: {} })
    assert.ok(result.explanations.length > 0)
    const missing = result.explanations.find((e) => e.code === 'READINESS_MISSING_TITLE')
    assert.ok(missing)
    assert.equal(missing.severity, 'critical')
    assert.ok(result.explanation.includes(missing.message))
  })

  it('next best actions sorted by impact with estimates', () => {
    const result = evaluateReadiness({
      formState: {
        title: 'Partial',
        intent: 'need',
        scope: { sectors: ['Construction'], requiredSkills: ['BIM'] },
        attributes: { targetRole: 'Architect' },
        normalized: { requiredServices: ['Coordination'] },
        location: 'Riyadh',
        modelType: 'project_based',
        description: 'Partial draft',
      },
    })
    assert.ok(result.nextBestActions.length > 0)
    for (let i = 1; i < result.nextBestActions.length; i += 1) {
      assert.ok(
        result.nextBestActions[i - 1].impactPercent >= result.nextBestActions[i].impactPercent,
      )
    }
    const action = result.nextBestActions[0]
    assert.equal(typeof action.estimatedGain, 'number')
    assert.equal(typeof action.estimatedScore, 'number')
    assert.ok(action.estimatedReadinessLevel)
  })

  it('publish gate via publishReady and blockingReasons', () => {
    const blocked = evaluateReadiness({ formState: { title: 'Only title' } })
    assert.equal(blocked.publishReady, false)
    assert.ok(blocked.blockingReasons.length > 0)
    assert.ok(getBlockingReasons(blocked).length > 0)

    const ready = evaluateReadiness({ formState: readyNeedOpportunity })
    assert.equal(ready.publishReady, true)
    assert.equal(ready.blockingReasons.length, 0)
  })

  it('health distinct from readiness level', () => {
    const draft = evaluateReadiness({ formState: {} })
    assert.equal(draft.readinessLevel, 'draft')
    assert.equal(draft.health, 'critical')

    const ready = evaluateReadiness({ formState: readyNeedOpportunity })
    assert.equal(ready.readinessLevel, 'excellent')
    assert.equal(ready.health, 'excellent')
  })

  it('snapshot metadata present', () => {
    const result = evaluateReadiness({ formState: readyNeedOpportunity, subModelKey: 'task_based' })
    assert.ok(result.snapshot.generatedAt)
    assert.equal(result.snapshot.engineVersion, '1.0.0')
    assert.ok(result.snapshot.knowledgeVersion >= 1)
    assert.ok(result.snapshot.formVersion)
  })

  it('categories on field contributions', () => {
    const result = evaluateReadiness({ formState: readyNeedOpportunity })
    for (const field of result.fieldContributions) {
      assert.ok(field.category)
    }
    const summary = buildReadinessSummary(result)
    assert.ok(summary.byCategory.general.total >= 1)
  })

  it('timeline monotonic increase', () => {
    const result = evaluateReadiness({ formState: readyNeedOpportunity })
    const timeline = buildReadinessTimeline(result.fieldContributions)
    assert.ok(timeline.length >= 2)
    for (let i = 1; i < timeline.length; i += 1) {
      assert.ok(timeline[i].score >= timeline[i - 1].score)
    }
  })

  it('memoizes by input', () => {
    const input = { formState: { title: 'x' } }
    const a = evaluateReadiness(input)
    const b = evaluateReadiness(input)
    assert.equal(a, b)
  })

  it('dashboard summary', () => {
    const result = evaluateReadiness({ formState: readyNeedOpportunity })
    const summary = buildReadinessSummary(result)
    assert.equal(summary.score, 100)
    assert.equal(summary.publishReady, true)
    const breakdown = buildReadinessBreakdown(result)
    assert.ok(breakdown.entries.length > 0)
  })

  it('publish threshold alignment', () => {
    const requiredOnly = evaluateReadiness({
      formState: {
        title: 'Required-only need',
        intent: 'need',
        scope: { sectors: ['Infrastructure'], requiredSkills: ['Project Planning'] },
        attributes: { targetRole: 'Project Manager', startDate: '2026-04-01' },
        normalized: { requiredServices: ['Program Management'] },
        location: 'Dammam',
        modelType: 'project_based',
        description: 'Need project manager for infrastructure rollout.',
      },
    })
    assert.ok(requiredOnly.score >= OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin)
    assert.equal(requiredOnly.publishReady, true)
  })

  it('AI helper exports', () => {
    const result = evaluateReadiness({ formState: {} })
    assert.ok(getNextBestActions(result).length > 0)
  })
})
