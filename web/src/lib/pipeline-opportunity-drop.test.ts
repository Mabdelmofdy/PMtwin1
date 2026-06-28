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

  it('allows drag for non-orchestrated statuses via command callback', () => {
    const transitions: Array<{ id: string; status: string }> = []
    const result = pipelineOpportunityDrop('opp-1', 'published', {
      readOpportunity: () => opportunityFixture('opp-1', 'draft'),
      transitionOpportunityStatus: (id, status) => {
        transitions.push({ id, status })
        return { success: true, aggregateId: id, commandType: 'TransitionOpportunityStatus' }
      },
    })

    assert.equal(result.success, true)
    assert.deepEqual(transitions, [{ id: 'opp-1', status: 'published' }])
  })

  it('recognizes legacy aliases for orchestrated statuses', () => {
    assert.equal(isContractLifecycleManagedOpportunityStatus('in_execution'), true)
    assert.equal(isContractLifecycleManagedOpportunityStatus('closed'), true)
    assert.equal(isContractLifecycleManagedOpportunityStatus('negotiating'), false)
  })
})
