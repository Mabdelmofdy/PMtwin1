import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  evaluateCommandRbac,
  buildCommandRbacFailureResult,
} from '@/domain/rbac/command-rbac.ts'

describe('evaluateCommandRbac', () => {
  const confirmCommand = {
    commandType: 'ConfirmPostMatch',
    aggregateId: 'pm-1',
    clientRequestId: 'req-1',
  } as const

  it('admin command rejected for non-admin', () => {
    const result = evaluateCommandRbac(confirmCommand, {
      userId: 'user-1',
      userRole: 'company_owner',
    })

    assert.equal(result.allowed, false)
    assert.match(result.reason ?? '', /Admin permission required/i)
  })

  it('admin command rejected without actor', () => {
    const result = evaluateCommandRbac(confirmCommand, null)

    assert.equal(result.allowed, false)
    assert.match(result.reason ?? '', /Authentication required/i)
  })

  it('allowed admin command succeeds evaluation', () => {
    const result = evaluateCommandRbac(confirmCommand, {
      userId: 'admin-1',
      userRole: 'admin',
    })

    assert.equal(result.allowed, true)
  })

  it('moderator can execute platform admin commands via capability', () => {
    const result = evaluateCommandRbac(confirmCommand, {
      userId: 'mod-1',
      userRole: 'moderator',
    })
    assert.equal(result.allowed, true)
  })

  it('auditor cannot execute platform admin commands', () => {
    const result = evaluateCommandRbac(confirmCommand, {
      userId: 'aud-1',
      userRole: 'auditor',
    })
    assert.equal(result.allowed, false)
  })

  it('participant command is not blocked at gateway', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'AcceptPostMatch',
        aggregateId: 'pm-1',
        clientRequestId: 'req-accept',
        userId: 'user-need',
      },
      null,
    )

    assert.equal(result.allowed, true)
  })

  it('buildCommandRbacFailureResult returns structured failure', () => {
    const evaluation = evaluateCommandRbac(confirmCommand, {
      userId: 'user-1',
      userRole: 'professional',
    })
    const failure = buildCommandRbacFailureResult(confirmCommand, evaluation)

    assert.equal(failure.success, false)
    assert.equal(failure.commandType, 'ConfirmPostMatch')
    assert.equal(failure.aggregateId, 'pm-1')
    assert.ok(failure.errors?.length)
  })

  it('owner can publish own opportunity', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: 'opp-1',
        clientRequestId: 'req-owner',
        targetStatus: 'published',
      },
      { userId: 'user-1', userRole: 'professional' },
      { opportunity: { creatorId: 'user-1', status: 'draft' } },
    )

    assert.equal(result.allowed, true)
    assert.ok(result.matchedPolicies.includes('command-rbac:owner-publish'))
  })

  it('non-owner cannot publish', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: 'opp-1',
        clientRequestId: 'req-non-owner',
        targetStatus: 'published',
      },
      { userId: 'user-other', userRole: 'company_owner' },
      { opportunity: { creatorId: 'user-1', status: 'draft' } },
    )

    assert.equal(result.allowed, false)
    assert.match(result.reason ?? '', /Only the opportunity owner or an admin can publish/i)
  })

  it('admin can publish', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: 'opp-1',
        clientRequestId: 'req-admin',
        targetStatus: 'published',
      },
      { userId: 'admin-1', userRole: 'admin' },
      { opportunity: { creatorId: 'user-1', status: 'draft' } },
    )

    assert.equal(result.allowed, true)
    assert.ok(result.matchedPolicies.includes('command-rbac:admin-publish'))
  })

  it('non-publish transitions follow existing rules', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: 'opp-1',
        clientRequestId: 'req-matched',
        targetStatus: 'matched',
      },
      null,
      { opportunity: { creatorId: 'user-other', status: 'published' } },
    )

    assert.equal(result.allowed, true)
    assert.ok(result.matchedPolicies.includes('command-rbac:transition-non-publish'))
  })

  it('publish requires authentication', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: 'opp-1',
        clientRequestId: 'req-auth',
        targetStatus: 'published',
      },
      null,
      { opportunity: { creatorId: 'user-1', status: 'draft' } },
    )

    assert.equal(result.allowed, false)
    assert.match(result.reason ?? '', /Authentication required/i)
  })

  it('individual professional can create opportunity drafts', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'CreateOpportunity',
        aggregateId: 'opp-new',
        clientRequestId: 'req-create-individual',
        title: 'Need BIM review',
        intent: 'need',
      } as never,
      { userId: 'seed-user-001', userRole: 'user' },
    )

    assert.equal(result.allowed, true)
    assert.ok(result.matchedPolicies.includes('command-rbac:role-matrix'))
  })

  it('legacy professional role alias can create opportunity drafts', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'CreateOpportunity',
        aggregateId: 'opp-new',
        clientRequestId: 'req-create-professional',
        title: 'Offer capacity',
        intent: 'offer',
      } as never,
      { userId: 'seed-user-001', userRole: 'professional' },
    )

    assert.equal(result.allowed, true)
  })

  it('individual owner can publish own opportunity via PublishOpportunity', () => {
    const result = evaluateCommandRbac(
      {
        commandType: 'PublishOpportunity',
        aggregateId: 'opp-1',
        clientRequestId: 'req-publish-individual',
      } as never,
      { userId: 'seed-user-001', userRole: 'user' },
      { opportunity: { creatorId: 'seed-user-001', status: 'draft' } },
    )

    assert.equal(result.allowed, true)
    assert.ok(result.matchedPolicies.includes('command-rbac:owner-publish'))
  })
})
