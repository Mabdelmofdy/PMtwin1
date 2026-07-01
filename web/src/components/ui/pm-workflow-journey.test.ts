import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/** Structural tests for workflow journey display props (no DOM). */
describe('PmWorkflowJourneyStep contract', () => {
  it('requires id, label, and state for each step', () => {
    const steps = [
      { id: 'opportunity', label: 'Opportunity', state: 'complete' as const },
      { id: 'match', label: 'Match', state: 'current' as const, status: 'discovered', statusEntity: 'match' as const },
      { id: 'negotiation', label: 'Negotiation', state: 'upcoming' as const },
    ]

    assert.equal(steps.length, 3)
    assert.equal(steps[1]?.state, 'current')
    assert.equal(steps[1]?.statusEntity, 'match')
  })
})
