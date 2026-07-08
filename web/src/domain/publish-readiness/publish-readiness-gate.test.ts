import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  evaluatePublishReadiness,
  formatPublishReadinessDetailLines,
  PUBLISH_READINESS_BLOCKED_CODE,
  PUBLISH_READINESS_BLOCKED_MESSAGE,
} from '@/domain/publish-readiness/publish-readiness-gate.ts'

const readyProfile = {
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

const readyOpportunity = {
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

describe('evaluatePublishReadiness', () => {
  it('blocks when profile is incomplete', () => {
    const gate = evaluatePublishReadiness({
      profile: {},
      profileKind: 'individual',
      opportunity: readyOpportunity,
    })

    assert.equal(gate.allowed, false)
    assert.equal(gate.code, PUBLISH_READINESS_BLOCKED_CODE)
    assert.equal(gate.reason, PUBLISH_READINESS_BLOCKED_MESSAGE)
    assert.equal(gate.profileReadiness.status, 'incomplete')
    assert.ok(gate.missingProfileRequired.length > 0)
  })

  it('blocks when opportunity is incomplete', () => {
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: { title: 'Draft only', intent: 'need' },
    })

    assert.equal(gate.allowed, false)
    assert.equal(gate.opportunityReadiness.status, 'incomplete')
    assert.ok(gate.missingOpportunityRequired.length > 0)
  })

  it('blocks when profile needs_review', () => {
    const gate = evaluatePublishReadiness({
      profile: {
        name: 'Partial User',
        title: 'PM',
        skills: ['Planning'],
        services: ['Project Management'],
        location: 'Riyadh',
        preferredWorkMode: 'Hybrid',
      },
      profileKind: 'individual',
      opportunity: readyOpportunity,
    })

    assert.equal(gate.allowed, false)
    assert.equal(gate.profileReadiness.status, 'needs_review')
  })

  it('blocks when opportunity is incomplete (below publish threshold)', () => {
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: {
        title: 'Sparse need',
        intent: 'need',
        description: 'Only a few fields filled',
      },
    })

    assert.equal(gate.allowed, false)
    assert.ok(
      gate.opportunityReadiness.status === 'incomplete' ||
        gate.opportunityReadiness.status === 'needs_review',
    )
    assert.ok(gate.opportunityReadiness.score < 80)
  })

  it('allows when opportunity has all required fields even if recommended are missing', () => {
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: {
        title: 'Required-only need',
        intent: 'need',
        scope: {
          sectors: ['Infrastructure'],
          requiredSkills: ['Project Planning'],
        },
        attributes: {
          targetRole: 'Project Manager',
          startDate: '2026-04-01',
        },
        normalized: {
          requiredServices: ['Program Management'],
        },
        location: 'Dammam',
        modelType: 'project_based',
        description: 'Need project manager for infrastructure rollout.',
      },
    })

    assert.equal(gate.allowed, true)
    assert.equal(gate.opportunityReadiness.status, 'ready_for_matching')
    assert.ok(gate.opportunityReadiness.score >= 80)
  })

  it('allows when both profile and opportunity are ready_for_matching', () => {
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: readyOpportunity,
    })

    assert.equal(gate.allowed, true)
    assert.equal(gate.reason, undefined)
    assert.equal(gate.profileReadiness.status, 'ready_for_matching')
    assert.equal(gate.opportunityReadiness.status, 'ready_for_matching')
  })

  it('includes profile missing fields in error payload', () => {
    const gate = evaluatePublishReadiness({
      profile: { name: 'Only Name' },
      profileKind: 'individual',
      opportunity: readyOpportunity,
    })

    const lines = formatPublishReadinessDetailLines(gate)
    assert.ok(lines[0]?.includes('Complete your profile'))
    assert.ok(lines.some((line) => line === 'Profile required:'))
    assert.ok(lines.some((line) => line === 'Profile missing:'))
    assert.ok(lines.some((line) => line.startsWith('- ')))
    assert.ok(gate.missingProfileRequired.length > 0)
  })

  it('includes opportunity missing fields in error payload', () => {
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: { title: 'Sparse draft', intent: 'offer' },
    })

    const lines = formatPublishReadinessDetailLines(gate)
    assert.ok(lines.some((line) => line === 'Opportunity required:'))
    assert.ok(lines.some((line) => line === 'Opportunity recommended:'))
    assert.ok(lines.some((line) => line === 'Opportunity missing:'))
    assert.ok(gate.missingOpportunityRequired.length > 0)
    assert.ok(gate.missingOpportunityRecommended.length > 0)
  })
})

describe('evaluatePublishReadiness — save draft unaffected', () => {
  it('evaluates readiness without mutating draft opportunity data', () => {
    const draft = {
      title: 'Draft opportunity',
      intent: 'need',
      status: 'draft',
      description: 'Work in progress',
    }

    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: draft,
    })

    assert.equal(gate.allowed, false)
    assert.equal(draft.status, 'draft')
    assert.equal(draft.title, 'Draft opportunity')
  })
})
