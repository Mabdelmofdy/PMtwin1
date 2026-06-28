import type {
  AcceptPostMatchCommand,
  Command,
  CommandResult,
  ConfirmPostMatchCommand,
  DeclinePostMatchCommand,
  DiscoverPostMatchCommand,
  DiscoverOneWayPostMatchCommand,
  ExpirePostMatchCommand,
  SupersedePostMatchCommand,
} from '@pm-twin/commands'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'

export type DiscoverPostMatchInput = Omit<
  DiscoverPostMatchCommand,
  'commandType' | 'clientRequestId'
>

/** one_way discover input — used by matching-service bridge. */
export type DiscoverOneWayPostMatchInput = Omit<
  DiscoverOneWayPostMatchCommand,
  'commandType' | 'clientRequestId'
>

export type PostMatchCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
}

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

let gatewayOverride: DefaultCommandGateway | null = null

/** Test hook — inject an isolated gateway without touching UI wiring. */
export function setPostMatchCommandGatewayForTests(
  gateway: DefaultCommandGateway | null,
): void {
  gatewayOverride = gateway
}

function resolveGateway(deps?: PostMatchCommandServiceDeps): DefaultCommandGateway {
  return deps?.gateway ?? gatewayOverride ?? getApplicationCommandGateway()
}

function executeCommand(
  command: Command,
  deps?: PostMatchCommandServiceDeps,
): CommandResult {
  return resolveGateway(deps).execute(command)
}

export function createPostMatchCommandService(
  deps?: PostMatchCommandServiceDeps,
) {
  return {
    discoverPostMatch(
      commandInput: DiscoverPostMatchInput,
    ): CommandResult {
      const command = {
        commandType: 'DiscoverPostMatch',
        clientRequestId: createClientRequestId('DiscoverPostMatch'),
        ...commandInput,
      } as DiscoverPostMatchCommand
      return executeCommand(command, deps)
    },

    acceptPostMatch(
      postMatchId: string,
      userId: string,
    ): CommandResult {
      const command = {
        commandType: 'AcceptPostMatch',
        aggregateId: postMatchId,
        clientRequestId: createClientRequestId('AcceptPostMatch'),
        userId,
      } satisfies AcceptPostMatchCommand
      return executeCommand(command, deps)
    },

    declinePostMatch(
      postMatchId: string,
      userId: string,
    ): CommandResult {
      const command = {
        commandType: 'DeclinePostMatch',
        aggregateId: postMatchId,
        clientRequestId: createClientRequestId('DeclinePostMatch'),
        userId,
      } satisfies DeclinePostMatchCommand
      return executeCommand(command, deps)
    },

    confirmPostMatch(postMatchId: string): CommandResult {
      const command = {
        commandType: 'ConfirmPostMatch',
        aggregateId: postMatchId,
        clientRequestId: createClientRequestId('ConfirmPostMatch'),
      } satisfies ConfirmPostMatchCommand
      return executeCommand(command, deps)
    },

    expirePostMatch(
      postMatchId: string,
      reason?: string,
    ): CommandResult {
      const command = {
        commandType: 'ExpirePostMatch',
        aggregateId: postMatchId,
        clientRequestId: createClientRequestId('ExpirePostMatch'),
        reason,
      } satisfies ExpirePostMatchCommand
      return executeCommand(command, deps)
    },

    supersedePostMatch(
      postMatchId: string,
      replacementPostMatchId: string,
      reason?: string,
    ): CommandResult {
      const command = {
        commandType: 'SupersedePostMatch',
        aggregateId: postMatchId,
        clientRequestId: createClientRequestId('SupersedePostMatch'),
        replacementPostMatchId,
        reason,
      } satisfies SupersedePostMatchCommand
      return executeCommand(command, deps)
    },
  }
}

export const postMatchCommandService = createPostMatchCommandService()
