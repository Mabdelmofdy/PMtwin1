import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import { opportunityToDraft } from './draft-model.ts'

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
