import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import {
  buildMatchingFingerprint,
  hasMatchingInputChanged,
} from '@/services/matching/matching-fingerprint.ts'

const fingerprintContext = { canonical: {}, config: {} }

function baseOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-fp',
    title: 'Need BIM architect',
    description: 'Need a BIM-capable Architect',
    intent: 'need',
    status: 'published',
    creatorId: 'user-need',
    mainCollaborationModel: 'cash_subcontracting',
    modelType: 'project_based',
    subModelType: 'task_based',
    exchangeMode: 'cash',
    acceptedExchangeModes: ['cash'],
    location: 'remote',
    scope: {
      sectors: ['Construction'],
      requiredSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: {
      budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
    },
    ...overrides,
  } as Opportunity
}

describe('matching fingerprint', () => {
  it('treats unordered skill arrays as semantically equal', () => {
    const ordered = baseOpportunity({
      normalized: undefined,
      scope: { sectors: ['Construction'], requiredSkills: ['BIM', 'Revit'] },
    })
    const reordered = baseOpportunity({
      normalized: undefined,
      scope: { sectors: ['Construction'], requiredSkills: ['Revit', 'BIM'] },
    })
    assert.equal(
      hasMatchingInputChanged(ordered, reordered, fingerprintContext),
      false,
    )
  })

  it('does not treat title-only edits as matching input changes', () => {
    const before = baseOpportunity()
    const after = baseOpportunity({ title: 'Completely different marketing title' })
    assert.equal(buildMatchingFingerprint(before, fingerprintContext), buildMatchingFingerprint(after, fingerprintContext))
    assert.equal(hasMatchingInputChanged(before, after, fingerprintContext), false)
  })

  it('detects role changes that the engine consumes', () => {
    const before = baseOpportunity()
    const after = baseOpportunity({
      attributes: {
        ...before.attributes,
        targetRole: 'Civil Engineer',
      },
      normalized: {
        ...before.normalized,
        role: 'Civil Engineer',
      },
    })
    assert.equal(hasMatchingInputChanged(before, after, fingerprintContext), true)
  })
})
