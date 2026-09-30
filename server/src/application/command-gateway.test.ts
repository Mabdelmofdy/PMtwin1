import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  UNIMPLEMENTED_COMMAND_AUDIT_ACTION,
  invalidEnvelopeResult,
  isCommandEnvelope,
  unimplementedCommandAuditDetails,
  unimplementedCommandResult,
} from './command-envelope.js'

describe('command gateway envelope', () => {
  it('accepts ADR-002 command envelopes', () => {
    assert.equal(
      isCommandEnvelope({
        commandType: 'PublishOpportunity',
        aggregateId: 'opp-1',
        clientRequestId: 'req-1',
      }),
      true,
    )
  })

  it('rejects incomplete envelopes', () => {
    assert.equal(isCommandEnvelope({ commandType: 'PublishOpportunity' }), false)
    assert.equal(isCommandEnvelope(null), false)
    assert.deepEqual(invalidEnvelopeResult().errors, ['INVALID_COMMAND_ENVELOPE'])
  })

  it('does not pretend unimplemented handlers succeeded', () => {
    const result = unimplementedCommandResult({
      commandType: 'PublishOpportunity',
      aggregateId: 'opp-1',
      clientRequestId: 'req-1',
    })
    assert.equal(result.success, false)
    assert.equal(result.errors?.[0], 'COMMAND_NOT_IMPLEMENTED:PublishOpportunity')
  })

  it('records unimplemented attempts as failures, not successful commands', () => {
    const command = {
      commandType: 'PublishOpportunity',
      aggregateId: 'opp-1',
      clientRequestId: 'req-1',
    }
    const details = unimplementedCommandAuditDetails(command)
    assert.equal(UNIMPLEMENTED_COMMAND_AUDIT_ACTION, 'command.unimplemented')
    assert.equal(details.outcome, 'unimplemented')
    assert.equal(details.success, false)
    assert.equal(details.commandType, 'PublishOpportunity')
    assert.equal(details.errors[0], 'COMMAND_NOT_IMPLEMENTED:PublishOpportunity')
  })
})
