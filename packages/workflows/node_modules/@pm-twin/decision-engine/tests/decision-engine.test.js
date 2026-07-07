import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  startDecision,
  recordApproval,
  delegateApproval,
  tickSla,
  isDecisionApproved,
  toAuditEvents,
} from '../dist/index.js'

const matrix = {
  matrixId: 'commercial-agreement-contract',
  label: 'Commercial agreement to contract approvals',
  entityType: 'commercial_agreement',
  stages: [
    {
      key: 'ops',
      label: 'Operations review',
      approvers: ['ops-a', 'ops-b'],
      mode: 'parallel',
      rule: { minApprovals: 2 },
      slaMinutes: 10,
      escalation: { escalateTo: ['ops-director'], afterMinutes: 10 },
    },
    {
      key: 'legal',
      label: 'Legal review',
      approvers: ['legal-counsel'],
      mode: 'sequential',
      delegation: { allowDelegation: true, maxDepth: 1 },
    },
  ],
}

describe('decision engine', () => {
  it('supports parallel then sequential approvals', () => {
    let decision = startDecision(matrix, {
      decisionId: 'dec-1',
      entityId: 'ca-1',
      startedBy: { actorId: 'user-1' },
      at: '2026-07-07T09:00:00.000Z',
    })
    decision = recordApproval(matrix, decision, {
      decisionId: 'dec-1',
      actorId: 'ops-a',
      approve: true,
      at: '2026-07-07T09:02:00.000Z',
    })
    assert.equal(isDecisionApproved(decision), false)
    decision = recordApproval(matrix, decision, {
      decisionId: 'dec-1',
      actorId: 'ops-b',
      approve: true,
      at: '2026-07-07T09:03:00.000Z',
    })
    assert.equal(decision.currentStageIndex, 1)
    decision = recordApproval(matrix, decision, {
      decisionId: 'dec-1',
      actorId: 'legal-counsel',
      approve: true,
      at: '2026-07-07T09:05:00.000Z',
    })
    assert.equal(isDecisionApproved(decision), true)
  })

  it('supports delegation and SLA escalation', () => {
    let decision = startDecision(matrix, {
      decisionId: 'dec-2',
      entityId: 'ca-2',
      startedBy: { actorId: 'user-1' },
      at: '2026-07-07T09:00:00.000Z',
    })
    decision = tickSla(matrix, decision, {
      decisionId: 'dec-2',
      at: '2026-07-07T09:20:00.000Z',
    })
    assert.equal(decision.status, 'escalated')
    decision = recordApproval(matrix, decision, {
      decisionId: 'dec-2',
      actorId: 'ops-a',
      approve: true,
      at: '2026-07-07T09:21:00.000Z',
    })
    decision = recordApproval(matrix, decision, {
      decisionId: 'dec-2',
      actorId: 'ops-b',
      approve: true,
      at: '2026-07-07T09:22:00.000Z',
    })
    decision = delegateApproval(matrix, decision, {
      decisionId: 'dec-2',
      fromApproverId: 'legal-counsel',
      toApproverId: 'legal-delegate',
      actorId: 'legal-counsel',
      at: '2026-07-07T09:23:00.000Z',
    })
    decision = recordApproval(matrix, decision, {
      decisionId: 'dec-2',
      actorId: 'legal-delegate',
      approve: true,
      at: '2026-07-07T09:24:00.000Z',
    })
    assert.equal(isDecisionApproved(decision), true)
    assert.ok(toAuditEvents(decision).length > 0)
  })
})
