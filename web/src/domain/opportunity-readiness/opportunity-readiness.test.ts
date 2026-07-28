import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import {
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@/domain/opportunity-readiness/opportunity-readiness-rules.ts'

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

const readyOfferOpportunity = {
  title: 'Architect offer — design-build availability',
  intent: 'offer',
  scope: {
    sectors: ['Construction', 'Architecture'],
    offeredSkills: ['BIM', 'LEED Certification', '3D Visualization'],
    certifications: ['LEED AP BD+C'],
  },
  attributes: {
    targetRole: 'Architect',
    availability: { start: '2026-02-01', end: '2026-12-31' },
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

const requiredOnlyNeedOpportunity = {
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
}

describe('evaluateOpportunityReadiness — baseline states', () => {
  it('returns incomplete for an empty opportunity object', () => {
    const result = evaluateOpportunityReadiness({})

    assert.equal(result.status, 'incomplete')
    assert.equal(result.score, 0)
    assert.equal(result.missingRequired.length, 10)
    assert.equal(result.missingRecommended.length, 5)
    assert.equal(result.presentRequired.length, 0)
    assert.equal(result.presentRecommended.length, 0)
  })

  it('marks a fully complete need opportunity as ready_for_matching', () => {
    const result = evaluateOpportunityReadiness(readyNeedOpportunity)

    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 100)
    assert.deepEqual(result.missingRequired, [])
    assert.deepEqual(result.missingRecommended, [])
    assert.equal(result.presentRequired.length, 10)
    assert.equal(result.presentRecommended.length, 5)
  })

  it('marks a fully complete offer opportunity as ready_for_matching', () => {
    const result = evaluateOpportunityReadiness(readyOfferOpportunity)

    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 100)
    assert.deepEqual(result.missingRequired, [])
    assert.deepEqual(result.missingRecommended, [])
  })

  it('marks required-only opportunity as ready_for_matching at required weight (>= publish threshold)', () => {
    const result = evaluateOpportunityReadiness(requiredOnlyNeedOpportunity)

    assert.equal(result.score, OPPORTUNITY_READINESS_SCORE_WEIGHTS.required)
    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.missingRequired.length, 0)
    assert.equal(result.missingRecommended.length, 5)
    assert.ok(result.score >= OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin)
  })
})

describe('evaluateOpportunityReadiness — required field blockers', () => {
  it('missing role blocks ready_for_matching', () => {
    const result = evaluateOpportunityReadiness({
      ...readyNeedOpportunity,
      attributes: {
        startDate: '2026-03-01',
        tenderDeadline: '2026-06-01',
      },
    })

    assert.ok(result.missingRequired.includes('Role Needed or Role Offered'))
    assert.notEqual(result.status, 'ready_for_matching')
  })

  it('missing skills blocks ready_for_matching', () => {
    const result = evaluateOpportunityReadiness({
      ...readyNeedOpportunity,
      scope: {
        sectors: ['Construction'],
      },
    })

    assert.ok(result.missingRequired.includes('Skills Required or Offered'))
    assert.notEqual(result.status, 'ready_for_matching')
  })

  it('missing services blocks ready_for_matching', () => {
    const result = evaluateOpportunityReadiness({
      ...readyNeedOpportunity,
      normalized: {},
    })

    assert.ok(result.missingRequired.includes('Services Required or Offered'))
    assert.notEqual(result.status, 'ready_for_matching')
  })

  it('missing location blocks ready_for_matching', () => {
    const result = evaluateOpportunityReadiness({
      ...readyNeedOpportunity,
      location: '',
    })

    assert.ok(result.missingRequired.includes('Location or Service Area'))
    assert.notEqual(result.status, 'ready_for_matching')
  })

  it('missing timeline blocks ready_for_matching', () => {
    const result = evaluateOpportunityReadiness({
      ...readyNeedOpportunity,
      attributes: {
        targetRole: 'Architect',
      },
    })

    assert.ok(result.missingRequired.includes('Timeline / Availability'))
    assert.notEqual(result.status, 'ready_for_matching')
  })
})

describe('evaluateOpportunityReadiness — hybrid intent', () => {
  it('requires both sides for hybrid opportunities', () => {
    const incompleteHybrid = evaluateOpportunityReadiness({
      title: 'Hybrid exchange',
      intent: 'hybrid',
      scope: {
        sectors: ['Construction'],
        requiredSkills: ['Program Management'],
      },
      attributes: {
        roleNeeded: 'Program Manager',
        startDate: '2026-05-01',
      },
      normalized: {
        requiredServices: ['PMO'],
      },
      location: 'Jeddah',
      modelType: 'barter',
      description: 'Hybrid barter opportunity.',
    })

    assert.ok(incompleteHybrid.missingRequired.includes('Role Needed or Role Offered'))
    assert.ok(incompleteHybrid.missingRequired.includes('Skills Required or Offered'))
    assert.ok(incompleteHybrid.missingRequired.includes('Services Required or Offered'))
    assert.notEqual(incompleteHybrid.status, 'ready_for_matching')

    const aliasOnly = evaluateOpportunityReadiness({
      title: 'Alias role only',
      intent: 'need',
      scope: {
        sectors: ['Construction'],
        requiredSkills: ['Program Management'],
      },
      attributes: {
        roleNeeded: 'Program Manager',
        startDate: '2026-05-01',
      },
      normalized: {
        role: 'Program Manager',
        requiredServices: ['PMO'],
      },
      location: 'Jeddah',
      modelType: 'project_based',
      description: 'Must require attributes.targetRole.',
    })
    assert.ok(aliasOnly.missingRequired.includes('Role Needed or Role Offered'))

    const readyHybrid = evaluateOpportunityReadiness({
      title: 'Hybrid exchange — complete',
      intent: 'hybrid',
      scope: {
        sectors: ['Construction'],
        requiredSkills: ['Program Management'],
        offeredSkills: ['Structural Review'],
      },
      attributes: {
        targetRole: 'Program Manager',
        startDate: '2026-05-01',
        tenderDeadline: '2026-10-01',
      },
      normalized: {
        requiredServices: ['PMO'],
        offeredServices: ['Engineering QA'],
      },
      location: 'Jeddah',
      modelType: 'barter',
      description: 'Hybrid barter opportunity with both sides defined.',
      exchangeData: { budgetRange: { min: 1, max: 2 } },
      preferredPartnerType: 'consultant',
      attachments: [{ name: 'scope.pdf' }],
      complianceRequirements: ['PDPL'],
      deliveryMilestones: [{ title: 'Mobilization' }],
    })

    assert.equal(readyHybrid.status, 'ready_for_matching')
    assert.equal(readyHybrid.score, 100)
  })
})

describe('evaluateOpportunityReadiness — legacy aliases', () => {
  it('supports legacy POC/web seed field names', () => {
    const result = evaluateOpportunityReadiness({
      name: 'Legacy architect need',
      type: 'request',
      sector: 'Construction',
      specializations: ['BIM', 'Sustainable Design'],
      requiredServices: ['Architectural Design'],
      serviceArea: 'Eastern Province',
      duration: '6 months',
      collaborationType: 'project_based',
      details: 'Legacy-shaped opportunity record from seed data.',
      attributes: {
        targetRole: 'Architect',
      },
    })

    assert.equal(result.missingRequired.length, 0)
    assert.equal(result.presentRequired.length, 10)
    assert.ok(result.score >= OPPORTUNITY_READINESS_SCORE_WEIGHTS.required)
    assert.equal(result.status, 'ready_for_matching')
  })
})

describe('evaluateOpportunityReadiness — incomplete opportunity', () => {
  it('marks sparse drafts as incomplete when score is below 60', () => {
    const result = evaluateOpportunityReadiness({
      title: 'Untitled draft',
      intent: 'need',
    })

    assert.equal(result.status, 'incomplete')
    assert.ok(result.score < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.incompleteMax)
    assert.ok(result.missingRequired.length > 0)
    assert.ok(result.presentRequired.length > 0)
  })
})
