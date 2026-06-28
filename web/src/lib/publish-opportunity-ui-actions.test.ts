import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { CommandResult } from '@pm-twin/commands'
import type { Opportunity } from '@/types/domain.ts'
import {
  PUBLISH_READINESS_BLOCKED_CODE,
  PUBLISH_READINESS_BLOCKED_MESSAGE,
} from '@/domain/publish-readiness/index.ts'
import {
  publishOpportunityUiAction,
  saveOpportunityDraftFields,
} from '@/lib/publish-opportunity-ui-actions.ts'

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
  id: 'opp-ready',
  title: 'Architect need — sustainable tower',
  intent: 'need',
  status: 'draft',
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
} as Opportunity

function transitionSpy() {
  let calls = 0
  const transitionOpportunityStatus = (): CommandResult => {
    calls += 1
    return { success: true, aggregateId: 'opp-ready', commandType: 'TransitionOpportunityStatus' }
  }
  return { transitionOpportunityStatus, getCalls: () => calls }
}

describe('publishOpportunityUiAction — readiness gate', () => {
  it('blocks publish when profile is incomplete', () => {
    const spy = transitionSpy()
    const result = publishOpportunityUiAction(
      'opp-ready',
      {
        profile: {},
        profileKind: 'individual',
        opportunity: readyOpportunity,
      },
      { transitionOpportunityStatus: spy.transitionOpportunityStatus },
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, PUBLISH_READINESS_BLOCKED_CODE)
    assert.equal(result.message, PUBLISH_READINESS_BLOCKED_MESSAGE)
    assert.equal(result.profileReadiness?.status, 'incomplete')
    assert.ok(result.profileReadiness?.missingRequired.length)
    assert.ok(result.details?.some((line) => line === 'Profile missing:'))
    assert.equal(spy.getCalls(), 0)
  })

  it('blocks publish when opportunity is incomplete', () => {
    const spy = transitionSpy()
    const result = publishOpportunityUiAction(
      'opp-ready',
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: { title: 'Draft only', intent: 'need', status: 'draft' },
      },
      { transitionOpportunityStatus: spy.transitionOpportunityStatus },
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, PUBLISH_READINESS_BLOCKED_CODE)
    assert.equal(result.opportunityReadiness?.status, 'incomplete')
    assert.ok(result.opportunityReadiness?.missingRequired.length)
    assert.ok(result.details?.some((line) => line === 'Opportunity missing:'))
    assert.equal(spy.getCalls(), 0)
  })

  it('blocks publish when profile needs_review', () => {
    const result = publishOpportunityUiAction(
      'opp-ready',
      {
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
      },
      { transitionOpportunityStatus: () => ({ success: true, aggregateId: 'opp-ready', commandType: 'TransitionOpportunityStatus' }) },
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.profileReadiness?.status, 'needs_review')
    assert.equal(result.code, PUBLISH_READINESS_BLOCKED_CODE)
  })

  it('allows publish when profile and opportunity are ready_for_matching', () => {
    const spy = transitionSpy()
    const result = publishOpportunityUiAction(
      'opp-ready',
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: readyOpportunity,
      },
      { transitionOpportunityStatus: spy.transitionOpportunityStatus },
    )

    assert.equal(result.success, true)
    assert.equal(spy.getCalls(), 1)
  })

  it('returns missing required and recommended fields in details', () => {
    const result = publishOpportunityUiAction(
      'opp-ready',
      {
        profile: { name: 'Only Name' },
        profileKind: 'individual',
        opportunity: { title: 'Sparse', intent: 'need', status: 'draft' },
      },
      { transitionOpportunityStatus: () => ({ success: true, aggregateId: 'opp-ready', commandType: 'TransitionOpportunityStatus' }) },
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.profileReadiness?.missingRequired.length)
    assert.ok(result.opportunityReadiness?.missingRequired.length)
    assert.ok(result.details?.some((line) => line.startsWith('- ')))
  })
})

describe('saveOpportunityDraftFields — draft save unaffected', () => {
  it('allows draft save when readiness is incomplete and strips status', () => {
    const updates: Array<{ id: string; patch: Partial<Opportunity> }> = []
    saveOpportunityDraftFields(
      'opp-draft',
      {
        title: 'Updated title',
        description: 'Still incomplete',
        status: 'published',
      },
      {
        updateOpportunity: (id, patch) => {
          updates.push({ id, patch })
        },
      },
    )

    assert.equal(updates.length, 1)
    assert.equal(updates[0]?.patch.status, undefined)
    assert.equal(updates[0]?.patch.title, 'Updated title')
  })
})
