import type {
  AgreeNegotiationCommand,
  CancelNegotiationCommand,
  Command,
  CommandResult,
  StartNegotiationFromPostMatchCommand,
  TransitionNegotiationStatusCommand,
} from '@pm-twin/commands'
import type { Negotiation } from '@/types/domain.ts'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'
import { negotiationRepository } from '@/repositories/index.ts'

export type NegotiationCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
  readonly negotiationRepository?: NegotiationRepository
}

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

let gatewayOverride: DefaultCommandGateway | null = null

/** Test hook — inject an isolated gateway without touching UI wiring. */
export function setNegotiationCommandGatewayForTests(
  gateway: DefaultCommandGateway | null,
): void {
  gatewayOverride = gateway
}

function resolveGateway(
  deps?: NegotiationCommandServiceDeps,
): DefaultCommandGateway {
  return deps?.gateway ?? gatewayOverride ?? getApplicationCommandGateway()
}

function executeCommand(
  command: Command,
  deps?: NegotiationCommandServiceDeps,
): CommandResult {
  return resolveGateway(deps).execute(command)
}

function resolveNegotiationRepository(
  deps?: NegotiationCommandServiceDeps,
): NegotiationRepository {
  return deps?.negotiationRepository ?? negotiationRepository
}

export function createNegotiationCommandService(
  deps?: NegotiationCommandServiceDeps,
) {
  return {
    startNegotiationFromPostMatch(
      postMatchId: string,
      serviceDeps?: NegotiationCommandServiceDeps,
    ): { result: CommandResult; negotiation: Negotiation | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'StartNegotiationFromPostMatch',
        aggregateId: postMatchId,
        clientRequestId: createClientRequestId('StartNegotiationFromPostMatch'),
      } satisfies StartNegotiationFromPostMatchCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, negotiation: null }
      }

      const repository = resolveNegotiationRepository(effectiveDeps)
      const negotiation = repository.getById(result.aggregateId) ?? null
      return { result, negotiation }
    },

    agreeNegotiation(
      negotiationId: string,
      serviceDeps?: NegotiationCommandServiceDeps,
    ): { result: CommandResult; negotiation: Negotiation | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'AgreeNegotiation',
        aggregateId: negotiationId,
        clientRequestId: createClientRequestId('AgreeNegotiation'),
      } satisfies AgreeNegotiationCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, negotiation: null }
      }

      const repository = resolveNegotiationRepository(effectiveDeps)
      const negotiation = repository.getById(negotiationId) ?? null
      return { result, negotiation }
    },

    cancelNegotiation(
      negotiationId: string,
      serviceDeps?: NegotiationCommandServiceDeps,
    ): { result: CommandResult; negotiation: Negotiation | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CancelNegotiation',
        aggregateId: negotiationId,
        clientRequestId: createClientRequestId('CancelNegotiation'),
      } satisfies CancelNegotiationCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, negotiation: null }
      }

      const repository = resolveNegotiationRepository(effectiveDeps)
      const negotiation = repository.getById(negotiationId) ?? null
      return { result, negotiation }
    },

    transitionNegotiationStatus(
      negotiationId: string,
      targetStatus: string,
      serviceDeps?: NegotiationCommandServiceDeps,
    ): { result: CommandResult; negotiation: Negotiation | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'TransitionNegotiationStatus',
        aggregateId: negotiationId,
        targetStatus,
        clientRequestId: createClientRequestId('TransitionNegotiationStatus'),
      } satisfies TransitionNegotiationStatusCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, negotiation: null }
      }

      const repository = resolveNegotiationRepository(effectiveDeps)
      const negotiation = repository.getById(negotiationId) ?? null
      return { result, negotiation }
    },
  }
}

export const negotiationCommandService = createNegotiationCommandService()
