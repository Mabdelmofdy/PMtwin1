import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildContractWorkflowSteps,
  buildDealWorkflowSteps,
  buildMatchWorkflowSteps,
  buildNegotiationWorkflowSteps,
  buildOpportunityWorkflowSteps,
  resolveCollaborationActiveStepFromMatches,
} from '@/components/ui/pm-workflow-journey-steps'

describe('resolveCollaborationActiveStepFromMatches', () => {
  it('returns Commercial Agreement when any match shows view deal', () => {
    const step = resolveCollaborationActiveStepFromMatches([
      { actions: { showViewDeal: true } },
    ])
    assert.equal(step, 'Commercial Agreement')
  })

  it('returns PostMatch when matches exist without negotiation/deal actions', () => {
    const step = resolveCollaborationActiveStepFromMatches([{ actions: {} }])
    assert.equal(step, 'PostMatch')
  })

  it('returns Opportunity when no matches', () => {
    assert.equal(resolveCollaborationActiveStepFromMatches([]), 'Opportunity')
  })
})

describe('buildOpportunityWorkflowSteps', () => {
  it('marks opportunity as current when at start of funnel', () => {
    const steps = buildOpportunityWorkflowSteps(
      { id: 'opp-1', status: 'draft' },
      'Opportunity',
    )
    assert.equal(steps[0]?.state, 'current')
    assert.equal(steps[1]?.state, 'upcoming')
  })
})

describe('buildMatchWorkflowSteps', () => {
  it('marks match current when no negotiation or deal', () => {
    const steps = buildMatchWorkflowSteps({ id: 'm-1', status: 'discovered' })
    assert.equal(steps[0]?.state, 'current')
    assert.equal(steps[0]?.status, 'discovered')
  })

  it('marks negotiation current when linked without deal', () => {
    const steps = buildMatchWorkflowSteps({
      id: 'm-1',
      status: 'accepted',
      negotiation: { id: 'n-1', status: 'active' },
    })
    assert.equal(steps[0]?.state, 'complete')
    assert.equal(steps[1]?.state, 'current')
  })
})

describe('buildNegotiationWorkflowSteps', () => {
  it('marks negotiation current without linked deal', () => {
    const steps = buildNegotiationWorkflowSteps({
      id: 'n-1',
      status: 'active',
      postMatchId: 'm-1',
    })
    assert.equal(steps[1]?.state, 'current')
  })
})

describe('buildDealWorkflowSteps', () => {
  it('marks deal current without contract', () => {
    const steps = buildDealWorkflowSteps({
      id: 'd-1',
      status: 'review',
    })
    assert.equal(steps[2]?.state, 'current')
    assert.equal(steps[3]?.state, 'upcoming')
  })
})

describe('buildContractWorkflowSteps', () => {
  it('marks contract as current step', () => {
    const steps = buildContractWorkflowSteps({
      contractId: 'c-1',
      status: 'active',
      dealId: 'd-1',
    })
    assert.equal(steps[3]?.state, 'current')
    assert.equal(steps[3]?.status, 'active')
  })
})
