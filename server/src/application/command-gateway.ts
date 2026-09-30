import type { Command, CommandResult } from '@pm-twin/commands'
import { randomUUID } from 'node:crypto'
import { prisma } from '../infrastructure/prisma.js'
import type { AuthActor } from '../infrastructure/jwt.js'
import {
  UNIMPLEMENTED_COMMAND_AUDIT_ACTION,
  unimplementedCommandAuditDetails,
  unimplementedCommandResult,
} from './command-envelope.js'

export {
  invalidEnvelopeResult,
  isCommandEnvelope,
  unimplementedCommandAuditDetails,
  unimplementedCommandResult,
} from './command-envelope.js'

function idempotencyKey(actorId: string, clientRequestId: string): string {
  return `${actorId}:${clientRequestId}`
}

export async function executeCommand(
  command: Command,
  actor: AuthActor,
): Promise<CommandResult> {
  const key = idempotencyKey(actor.sub, command.clientRequestId)
  const existing = await prisma.idempotencyRecord.findUnique({ where: { key } })
  if (existing) {
    return existing.result as unknown as CommandResult
  }

  // No product aggregate is written. The stored result stays success:false
  // so a replay cannot be treated as a completed business command.
  const result = unimplementedCommandResult(command)
  const auditDetails = unimplementedCommandAuditDetails(command)

  await prisma.$transaction([
    prisma.idempotencyRecord.create({
      data: {
        key,
        commandType: command.commandType,
        actorId: actor.sub,
        result: result as object,
      },
    }),
    prisma.auditLog.create({
      data: {
        id: randomUUID(),
        userId: actor.sub,
        action: UNIMPLEMENTED_COMMAND_AUDIT_ACTION,
        entityType: 'command',
        entityId: command.aggregateId,
        timestamp: new Date(),
        details: auditDetails,
      },
    }),
  ])

  return result
}
