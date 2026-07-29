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

  it('composePublishValidation blocks need when deadline is before Start date', () => {
    const opportunity = {
      ...readyOpportunityForPublish,
      startDate: '2026-08-10',
      attributes: {
        ...readyOpportunityForPublish.attributes,
        startDate: '2026-08-10',
        tenderDeadline: '2026-08-01',
      },
    }
    const gate = evaluatePublishReadiness({
      profile: readyProfileForPublish,
      profileKind: 'individual',
      opportunity,
    })
    assert.equal(gate.allowed, true)

    const blocked = composePublishValidation({
      opportunity,
      publishReadiness: gate,
      vettingApproved: true,
    })
    assert.equal(blocked.status, 'blocked')
    const deadlineIssue = blocked.blockingIssues.find(
      (i) => i.code === VAL_CODES.DATE_DEADLINE_BEFORE_START,
    )
    assert.ok(deadlineIssue)
    assert.equal(deadlineIssue.message, 'Deadline cannot be before Start date.')
    assert.ok(!deadlineIssue.message.includes('VAL_'))
  })

  it('composePublishValidation blocks offer when availability end is before Availability from', () => {
    const opportunity = {
      title: 'Architect offer — design-build availability',
      intent: 'offer' as const,
      startDate: '2026-08-10',
      scope: {
        sectors: ['Construction', 'Architecture'],
        offeredSkills: ['BIM', 'LEED Certification', '3D Visualization'],
        certifications: ['LEED AP BD+C'],
      },
      attributes: {
        targetRole: 'Architect',
        startDate: '2026-08-10',
        tenderDeadline: '2026-09-01',
        availability: { start: '2026-08-10', end: '2026-08-05' },
      },
      collaborationAttributes: {
        availabilityEndDate: '2026-08-05',
      },
      normalized: {
        offeredServices: ['Design Review', 'BIM Modeling'],
      },
      location: 'Riyadh, Saudi Arabia',
      exchangeMode: 'cash',
      description: 'Experienced architect available for design-build engagements.',
      exchangeData: { cashAmount: 275_000 },
      partnerType: 'general_contractor',
      documents: [{ name: 'portfolio.pdf' }],
      milestones: [{ title: 'Kickoff workshop' }],
    }
    const gate = evaluatePublishReadiness({
      profile: readyProfileForPublish,
      profileKind: 'individual',
      opportunity,
    })
    assert.equal(gate.allowed, true)

    const blocked = composePublishValidation({
      opportunity,
      publishReadiness: gate,
      vettingApproved: true,
    })
    assert.equal(blocked.status, 'blocked')
    const availIssue = blocked.blockingIssues.find(
      (i) => i.code === VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START,
    )
    assert.ok(availIssue)
    assert.equal(
      availIssue.message,
      'Availability end date cannot be before Availability from.',
    )
  })

  it('composePublishValidation allows valid need date order', () => {
    const opportunity = {
      ...readyOpportunityForPublish,
      startDate: '2026-08-01',
      attributes: {
        ...readyOpportunityForPublish.attributes,
        startDate: '2026-08-01',
        tenderDeadline: '2026-09-01',
      },
      collaborationAttributes: {
        availabilityEndDate: '2026-08-15',
      },
    }
    const gate = evaluatePublishReadiness({
      profile: readyProfileForPublish,
      profileKind: 'individual',
      opportunity,
    })
    assert.equal(gate.allowed, true)

    const result = composePublishValidation({
      opportunity,
      publishReadiness: gate,
      vettingApproved: true,
    })
    assert.ok(
      !result.blockingIssues.some(
        (i) =>
          i.code === VAL_CODES.DATE_DEADLINE_BEFORE_START ||
          i.code === VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START,
      ),
    )
  })
})

const readyProfileForPublish = {
  name: 'Khalid Al-Harbi',
  title: 'Senior Architect',
  skills: ['BIM', 'Sustainable Design'],
  services: ['Architectural Design'],
  location: 'Riyadh, Saudi Arabia',
  preferredWorkMode: 'On-Site',
  caseStudies: [{ title: 'Riyadh Mixed-Use Tower' }],
  yearsExperience: 9,
  certifications: ['LEED AP BD+C'],
  previousProjects: [{ title: 'NEOM Pavilion' }],
}

const readyOpportunityForPublish = {
  title: 'Architect need — sustainable tower',
  intent: 'need' as const,
  scope: {
    sectors: ['Construction', 'Architecture'],
    requiredSkills: ['BIM', 'Sustainable Design', 'LEED Certification'],
  },
  attributes: {
    targetRole: 'Architect',
    startDate: '2026-08-01',
    tenderDeadline: '2026-09-01',
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
