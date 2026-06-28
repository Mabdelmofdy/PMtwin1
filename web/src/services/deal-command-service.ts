import type {
  Command,
  CommandResult,
  CreateDealFromNegotiationCommand,
  CreateDealFromPostMatchCommand,
  TransitionDealStatusCommand,
} from '@pm-twin/commands'
import type { Deal } from '@/types/domain.ts'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import type { DealRepository } from '@/repositories/deal-repository.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'
import { dealRepository } from '@/repositories/index.ts'

export type DealCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
  readonly dealRepository?: DealRepository
}

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

let gatewayOverride: DefaultCommandGateway | null = null

/** Test hook — inject an isolated gateway without touching UI wiring. */
export function setDealCommandGatewayForTests(
  gateway: DefaultCommandGateway | null,
): void {
  gatewayOverride = gateway
}

function resolveGateway(deps?: DealCommandServiceDeps): DefaultCommandGateway {
  return deps?.gateway ?? gatewayOverride ?? getApplicationCommandGateway()
}

function resolveDealRepository(deps?: DealCommandServiceDeps): DealRepository {
  return deps?.dealRepository ?? dealRepository
}

function executeCommand(
  command: Command,
  deps?: DealCommandServiceDeps,
): CommandResult {
  return resolveGateway(deps).execute(command)
}

export function createDealCommandService(deps?: DealCommandServiceDeps) {
  return {
    createDealFromPostMatch(
      postMatchId: string,
      negotiationId: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateDealFromPostMatch',
        aggregateId: postMatchId,
        negotiationId,
        clientRequestId: createClientRequestId('CreateDealFromPostMatch'),
      } satisfies CreateDealFromPostMatchCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, deal: null }
      }

      const repository = resolveDealRepository(effectiveDeps)
      const deal = repository.getById(result.aggregateId) ?? null
      return { result, deal }
    },

    createDealFromNegotiation(
      negotiationId: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateDealFromNegotiation',
        aggregateId: negotiationId,
        negotiationId,
        clientRequestId: createClientRequestId('CreateDealFromNegotiation'),
      } satisfies CreateDealFromNegotiationCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, deal: null }
      }

      const repository = resolveDealRepository(effectiveDeps)
      const deal = repository.getById(result.aggregateId) ?? null
      return { result, deal }
    },

    transitionDealStatus(
      dealId: string,
      targetStatus: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'TransitionDealStatus',
        aggregateId: dealId,
        targetStatus,
        clientRequestId: createClientRequestId('TransitionDealStatus'),
      } satisfies TransitionDealStatusCommand

      const result = executeCommand(command, effectiveDeps)

      if (!result.success) {
        return { result, deal: null }
      }

      const repository = resolveDealRepository(effectiveDeps)
      const deal = repository.getById(dealId) ?? null
      return { result, deal }
    },
  }
}

export const dealCommandService = createDealCommandService()
