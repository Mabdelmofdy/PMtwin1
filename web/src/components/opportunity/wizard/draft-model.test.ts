import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import {
  buildCollaborationCommandPayload,
  initialDraft,
  opportunityToDraft,
} from './draft-model.ts'

describe('opportunityToDraft', () => {
  it('prefills the edit wizard from persisted opportunity fields', () => {
    const opportunity: Opportunity = {
      id: 'opp-edit',
      title: 'Deliver a PMO setup',
      description: 'Establish governance and reporting.',
      status: 'draft',
      intent: 'offer',
      location: 'Riyadh',
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'deliverable_based',
      exchangeMode: 'cash',
      acceptedExchangeModes: ['cash'],
      scope: { sectors: ['Construction'] },
      structuredSkills: [
        { name: 'PMO governance', role: 'provided', level: 'expert' },
      ],
      workPackages: [
        { id: 'wp-1', title: 'PMO blueprint', description: 'Target operating model' },
      ],
      capacity: { available: 2 },
      normalized: { offeredServices: ['PMO setup', 'Project controls'] },
      attributes: {
        targetRole: 'Project director',
        startDate: '2026-08-01',
        tenderDeadline: '2026-07-25',
        attachments: ['portfolio.pdf'],
        deliveryMilestones: ['Blueprint approved'],
      },
    }

    const draft = opportunityToDraft(opportunity)

    assert.equal(draft.title, opportunity.title)
    assert.equal(draft.description, opportunity.description)
    assert.equal(draft.intent, 'offer')
    assert.equal(draft.location, 'Riyadh')
    assert.equal(draft.mainCollaborationModel, 'cash_subcontracting')
    assert.equal(draft.services, 'PMO setup, Project controls')
    assert.equal(draft.startDate, '2026-08-01')
    assert.equal(draft.attachmentsText, 'portfolio.pdf')
    assert.equal(draft.deliveryMilestonesText, 'Blueprint approved')
    assert.equal(draft.structuredSkills[0]?.name, 'PMO governance')
    assert.equal(draft.workPackages[0]?.title, 'PMO blueprint')
    assert.equal(draft.capacity.availableCapacity, 2)
  })

  it('maps the legacy request intent to need', () => {
    const draft = opportunityToDraft({
      id: 'opp-request',
      title: 'Need a scheduler',
      status: 'draft',
      intent: 'request',
    })

    assert.equal(draft.intent, 'need')
  })
})

describe('buildCollaborationCommandPayload', () => {
  it('maps the enabled cash component amount to the command budget', () => {
    const payload = buildCollaborationCommandPayload({
      ...initialDraft,
      commercialStructure: {
        components: [
          {
            id: 'cash-1',
            type: 'cash',
            title: 'Cash',
            enabled: true,
            appliesTo: 'entire_opportunity',
            currency: 'SAR',
            budgetType: 'fixed',
            fixedAmount: 125_000,
          },
        ],
        constraints: [],
        allocationMethod: 'fixed',
      },
    })

    assert.equal(payload.exchangeMode, 'cash')
    assert.equal(payload.budget, 125_000)
  })

  it('mirrors structured skills and rich-timeline duration into collaboration attributes', () => {
    const payload = buildCollaborationCommandPayload({
      ...initialDraft,
      title: 'BIM coordination package',
      description: 'Coordinate shop drawings for tower core',
      intent: 'need',
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      paymentModes: ['cash'],
      startDate: '2026-08-01',
      structuredSkills: [
        {
          name: 'BIM',
          level: 'expert',
          certificationRequired: false,
          mandatory: true,
        },
        {
          name: 'Coordination',
          level: 'advanced',
          certificationRequired: false,
          mandatory: true,
        },
      ],
      richTimeline: { estimatedDuration: '12 weeks' },
      collaborationAttributes: {
        requiredSkills: [],
      },
      commercialStructure: {
        components: [
          {
            id: 'cash-1',
            type: 'cash',
            title: 'Cash',
            enabled: true,
            appliesTo: 'entire_opportunity',
            currency: 'SAR',
            budgetType: 'fixed',
            fixedAmount: 50_000,
          },
        ],
        constraints: [],
        allocationMethod: 'fixed',
      },
    })

    assert.deepEqual(payload.collaborationAttributes?.requiredSkills, [
      'BIM',
      'Coordination',
    ])
    assert.equal(payload.collaborationAttributes?.duration, '12 weeks')
    assert.equal(
      payload.collaborationAttributes?.detailedScope,
      'Coordinate shop drawings for tower core',
    )
    assert.equal(payload.collaborationAttributes?.startDate, '2026-08-01')
  })
})
