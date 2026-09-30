import type { Command, CommandResult } from '@pm-twin/commands'

export function isCommandEnvelope(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.commandType === 'string'
    && candidate.commandType.length > 0
    && typeof candidate.aggregateId === 'string'
    && candidate.aggregateId.length > 0
    && typeof candidate.clientRequestId === 'string'
    && candidate.clientRequestId.length > 0
  )
}

export const UNIMPLEMENTED_COMMAND_AUDIT_ACTION = 'command.unimplemented'

export function unimplementedCommandResult(command: Command): CommandResult {
  return {
    success: false,
    aggregateId: command.aggregateId,
    commandType: command.commandType,
    errors: [`COMMAND_NOT_IMPLEMENTED:${command.commandType}`],
  }
}

/** Audit payload for a command the gateway refused to execute. */
export function unimplementedCommandAuditDetails(command: Command): {
  readonly outcome: 'unimplemented'
  readonly commandType: string
  readonly success: false
  readonly errors: readonly string[]
  readonly clientRequestId: string
} {
  const result = unimplementedCommandResult(command)
  return {
    outcome: 'unimplemented',
    commandType: command.commandType,
    success: false,
    errors: result.errors ?? [],
    clientRequestId: command.clientRequestId,
  }
}

export function invalidEnvelopeResult(): CommandResult {
  return {
    success: false,
    aggregateId: '',
    commandType: '',
    errors: ['INVALID_COMMAND_ENVELOPE'],
  }
}
