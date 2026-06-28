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
})
