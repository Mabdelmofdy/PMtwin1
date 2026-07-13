import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { VAL_CODES } from '@pm-twin/validation'
import {
  composePublishValidation,
  liveStateForField,
  runDraftValidation,
  validateGroups,
} from '@/domain/opportunity-validation/index.ts'
import { evaluateLiveOpportunityValidation } from '@/domain/opportunity-validation/live-validation.ts'
import { buildPublishValidationExplanationLines } from '@/services/explainability/publish-validation-explain.ts'
import { evaluatePublishReadiness } from '@/domain/publish-readiness/publish-readiness-gate.ts'

describe('opportunity validation web adapter', () => {
  it('allows incomplete draft that is structurally valid', () => {
    const result = runDraftValidation({
      title: 'Draft title',
      exchangeMode: 'cash',
      complianceRequirements: ['CR Required'],
    })
    assert.equal(result.blocked, false)
  })

  it('blocks draft with invalid date order', () => {
    const result = runDraftValidation({
      title: 'Draft title',
      startDate: '2026-09-01',
      endDate: '2026-08-01',
    })
    assert.equal(result.blocked, true)
    assert.ok(result.messages.every((m) => !m.includes('VAL_')))
  })

  it('allows same-day start, deadline, and availability end', () => {
    const result = runDraftValidation(
      {
        title: 'Draft title',
        startDate: '2026-07-10',
        attributes: { tenderDeadline: '2026-07-10' },
        collaborationAttributes: { availabilityEndDate: '2026-07-10' },
      },
      { today: '2026-07-10' },
    )
    assert.equal(result.blocked, false)
    assert.ok(!result.messages.some((m) => /past|before start/i.test(m)))
  })

  it('blocks past tender deadline from attributes', () => {
    const result = runDraftValidation(
      {
        title: 'Draft title',
        startDate: '2026-07-10',
        attributes: { tenderDeadline: '2026-07-01' },
      },
      { today: '2026-07-10' },
    )
    assert.equal(result.blocked, true)
  })

  it('targeted groups only run selected rules', () => {
    const result = validateGroups(
      {
        title: 'T',
        exchangeMode: 'cash',
        budget: 1,
        startDate: '2020-01-01',
      },
      ['budget'],
      'draft',
      { today: '2026-07-10', config: { minimumBudget: 100 } },
    )
    assert.ok(result.issues.every((i) => i.group === 'budget'))
  })

  it('live field state maps severity without exposing codes', () => {
    const live = evaluateLiveOpportunityValidation({
      title: 'T',
      startDate: '2026-09-01',
      endDate: '2026-08-01',
    })
    const end = live.field('endDate')
    assert.equal(end.state, 'error')
    assert.ok(end.messages.every((m) => !m.includes('VAL_')))
    assert.equal(liveStateForField(live.issues, 'title'), 'valid')
  })

  it('composePublishValidation consumes readiness snapshot', () => {
    const gate = evaluatePublishReadiness({
      profile: null,
      profileKind: 'individual',
      opportunity: { title: 'Only title' },
    })
    assert.equal(gate.allowed, false)

    const blocked = composePublishValidation({
      opportunity: { title: 'Only title' },
      publishReadiness: gate,
      vettingApproved: true,
    })
    assert.equal(blocked.status, 'blocked')
    assert.ok(
      blocked.blockingIssues.some(
        (i) =>
          i.code === VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD ||
          i.code === VAL_CODES.PUBLISH_PROFILE_INCOMPLETE,
      ),
    )
    const lines = buildPublishValidationExplanationLines(blocked)
    assert.ok(lines.every((l) => !l.includes('VAL_')))
  })
})
