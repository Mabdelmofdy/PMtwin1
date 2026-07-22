import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import {
  CONTRACT_LIFECYCLE_DRAG_MESSAGE,
  isContractLifecycleManagedOpportunityStatus,
  pipelineOpportunityDrop,
} from '@/lib/pipeline-opportunity-drop.ts'

function opportunityFixture(
  id: string,
  status: string,
): Opportunity {
  return {
    id,
    title: `Opportunity ${id}`,
    status,
    creatorId: 'user-1',
    intent: 'request',
  }
}

describe('pipelineOpportunityDrop contract-lifecycle guard', () => {
  it('blocks drag when opportunity is executing', () => {
    let transitionCalled = false
    const result = pipelineOpportunityDrop('opp-1', 'in_progress', {
      readOpportunity: () => opportunityFixture('opp-1', 'executing'),
      transitionOpportunityStatus: () => {
        transitionCalled = true
        return { success: true, aggregateId: 'opp-1', commandType: 'TransitionOpportunityStatus' }
      },
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.equal(result.message, CONTRACT_LIFECYCLE_DRAG_MESSAGE)
    }
    assert.equal(transitionCalled, false)
  })

  it('blocks drag when opportunity is completed', () => {
    let transitionCalled = false
    const result = pipelineOpportunityDrop('opp-1', 'published', {
      readOpportunity: () => opportunityFixture('opp-1', 'completed'),
      transitionOpportunityStatus: () => {
        transitionCalled = true
        return { success: true, aggregateId: 'opp-1', commandType: 'TransitionOpportunityStatus' }
      },
    })

    assert.equal(result.success, false)
    assert.equal(transitionCalled, false)
  })

  it('blocks drag when opportunity is cancelled', () => {
    let transitionCalled = false
    const result = pipelineOpportunityDrop('opp-1', 'draft', {
      readOpportunity: () => opportunityFixture('opp-1', 'cancelled'),
      transitionOpportunityStatus: () => {
        transitionCalled = true
        return { success: true, aggregateId: 'opp-1', commandType: 'TransitionOpportunityStatus' }
      },
    })

    assert.equal(result.success, false)
    assert.equal(transitionCalled, false)
  })

  it('cannot drag executing opportunity back to negotiating', () => {
    let transitionCalled = false
    const result = pipelineOpportunityDrop('opp-exec', 'in_progress', {
      readOpportunity: () => opportunityFixture('opp-exec', 'executing'),
      transitionOpportunityStatus: () => {
        transitionCalled = true
        return { success: true, aggregateId: 'opp-exec', commandType: 'TransitionOpportunityStatus' }
      },
    })

    assert.equal(result.success, false)
    assert.equal(transitionCalled, false)
  })

  it('allows drag to negotiating without publish orchestration', () => {
    const transitions: Array<{ id: string; status: string }> = []
    const result = pipelineOpportunityDrop('opp-1', 'in_progress', {
      readOpportunity: () => opportunityFixture('opp-1', 'published'),
      transitionOpportunityStatus: (id, status) => {
        transitions.push({ id, status })
        return { success: true, aggregateId: id, commandType: 'TransitionOpportunityStatus' }
      },
    })

    assert.equal(result.success, true)
    assert.equal(result.matching, undefined)
    assert.deepEqual(transitions, [{ id: 'opp-1', status: 'in_negotiation' }])
  })

  it('recognizes legacy aliases for orchestrated statuses', () => {
    assert.equal(isContractLifecycleManagedOpportunityStatus('in_execution'), true)
    assert.equal(isContractLifecycleManagedOpportunityStatus('closed'), true)
    assert.equal(isContractLifecycleManagedOpportunityStatus('negotiating'), false)
  })
})

describe('pipelineOpportunityDrop publish orchestration', () => {
  const readyProfile = {
    name: 'Khalid Al-Harbi',
    title: 'Senior Architect',
    skills: ['BIM'],
    services: ['Architectural Design'],
    location: 'Riyadh, Saudi Arabia',
    preferredWorkMode: 'On-Site',
    caseStudies: [{ title: 'Tower' }],
    yearsExperience: 9,
    certifications: ['LEED AP BD+C'],
    previousProjects: [{ title: 'NEOM Pavilion' }],
  }

  const readyDraftOpportunity = {
    id: 'opp-ready',
    title: 'Architect need',
    description: 'Seeking a senior architect.',
    creatorId: 'user-1',
    intent: 'need',
    status: 'draft',
    modelType: 'project_based',
    location: 'Riyadh, Saudi Arabia',
    scope: {
      sectors: ['Construction'],
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
    exchangeData: {
      budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
    },
    preferredPartnerType: 'company',
    attachments: [{ name: 'design-brief.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Concept design', dueDate: '2026-04-01' }],
  } as Opportunity

  it('pipeline publish triggers matching orchestration', () => {
    let matchingCalled = false
    const result = pipelineOpportunityDrop('opp-ready', 'published', {
      readOpportunity: () => readyDraftOpportunity,
      resolvePublishReadinessContext: () => ({
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: readyDraftOpportunity,
      }),
      transitionToPublished: () => {
        matchingCalled = true
        return {
          command: {
            success: true,
            aggregateId: 'opp-ready',
            commandType: 'TransitionOpportunityStatus',
          },
          matching: {
            discoveredMatchesCount: 2,
            skippedDuplicatesCount: 1,
            matchingErrors: [],
            postMatchIds: ['pm-1', 'pm-2'],
          },
          circular: {
            discoveredMatchesCount: 0,
            skippedDuplicatesCount: 0,
            matchingErrors: [],
            postMatchIds: [],
          },
        }
      },
    })

    assert.equal(result.success, true)
    assert.equal(matchingCalled, true)
    if (result.success) {
      assert.equal(result.matching?.discoveredMatchesCount, 2)
      assert.equal(result.matching?.skippedDuplicatesCount, 1)
    }
  })

  it('blocked readiness prevents pipeline publish', () => {
    let transitionCalled = false
    const result = pipelineOpportunityDrop('opp-ready', 'published', {
      readOpportunity: () => ({
        ...readyDraftOpportunity,
        description: '',
      }),
      resolvePublishReadinessContext: () => ({
        profile: { name: 'Draft User' },
        profileKind: 'individual',
        opportunity: { ...readyDraftOpportunity, description: '' },
      }),
      transitionToPublished: () => {
        transitionCalled = true
        return {
          command: {
            success: true,
            aggregateId: 'opp-ready',
            commandType: 'TransitionOpportunityStatus',
          },
          matching: {
            discoveredMatchesCount: 0,
            skippedDuplicatesCount: 0,
            matchingErrors: [],
            postMatchIds: [],
          },
          circular: {
            discoveredMatchesCount: 0,
            skippedDuplicatesCount: 0,
            matchingErrors: [],
            postMatchIds: [],
          },
        }
      },
    })

    assert.equal(result.success, false)
    assert.equal(transitionCalled, false)
  })

  it('pipeline publish returns matching result counts', () => {
    const result = pipelineOpportunityDrop('opp-ready', 'published', {
      readOpportunity: () => readyDraftOpportunity,
      resolvePublishReadinessContext: () => ({
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: readyDraftOpportunity,
      }),
      transitionToPublished: () => ({
        command: {
          success: true,
          aggregateId: 'opp-ready',
          commandType: 'TransitionOpportunityStatus',
        },
        matching: {
          discoveredMatchesCount: 4,
          skippedDuplicatesCount: 2,
          matchingErrors: ['duplicate skipped'],
          postMatchIds: ['pm-1'],
        },
        circular: {
          discoveredMatchesCount: 0,
          skippedDuplicatesCount: 0,
          matchingErrors: [],
          postMatchIds: [],
        },
      }),
    })

    assert.equal(result.success, true)
    if (result.success) {
      assert.deepEqual(result.matching, {
        discoveredMatchesCount: 4,
        skippedDuplicatesCount: 2,
        matchingErrors: ['duplicate skipped'],
      })
    }
  })
})
