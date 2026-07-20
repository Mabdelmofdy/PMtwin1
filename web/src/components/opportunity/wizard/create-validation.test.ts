import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  initialDraft,
} from './draft-model.ts'
import { validateCreateOpportunityDraft } from './create-validation.ts'

describe('validateCreateOpportunityDraft', () => {
  it('requires core wizard fields and collaboration attributes', () => {
    const result = validateCreateOpportunityDraft({
      ...initialDraft,
      title: 'Partial',
      description: 'Only basics',
      intent: 'need',
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      paymentModes: ['cash'],
    })

    assert.equal(result.valid, false)
    assert.ok(result.errors.some((e) => e.includes('Category or profession')))
    assert.ok(result.errors.some((e) => e.includes('skill')))
    assert.ok(
      result.errors.some((e) => e.includes('requiredSkills'))
        || result.errors.some((e) => e.includes('duration')),
    )
  })

  it('accepts a complete create draft', () => {
    const result = validateCreateOpportunityDraft({
      ...initialDraft,
      title: 'BIM coordination package',
      description: 'Coordinate shop drawings for tower core',
      intent: 'need',
      sector: 'Construction',
      targetRole: 'BIM Coordinator',
      location: 'Riyadh',
      startDate: '2026-08-01',
      services: 'BIM Coordination',
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      paymentModes: ['cash'],
      structuredSkills: [
        {
          name: 'BIM',
          level: 'expert',
          certificationRequired: false,
          mandatory: true,
        },
      ],
      richTimeline: { estimatedDuration: '12 weeks' },
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

    assert.equal(result.valid, true, result.errors.join('; '))
  })
})
