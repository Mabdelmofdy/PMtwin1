import type { CommandResult, TransitionOpportunityStatusCommand } from '@pm-twin/commands'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'

export type OpportunityCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
}

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

let gatewayOverride: DefaultCommandGateway | null = null

export function setOpportunityCommandGatewayForTests(
  gateway: DefaultCommandGateway | null,
): void {
  gatewayOverride = gateway
}

function resolveGateway(
  deps?: OpportunityCommandServiceDeps,
): DefaultCommandGateway {
  return deps?.gateway ?? gatewayOverride ?? getApplicationCommandGateway()
}

export function createOpportunityCommandService(
  deps?: OpportunityCommandServiceDeps,
) {
  return {
    transitionOpportunityStatus(
      opportunityId: string,
      targetStatus: string,
      reason?: string,
    ): CommandResult {
      const command = {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('TransitionOpportunityStatus'),
        targetStatus,
        reason,
      } satisfies TransitionOpportunityStatusCommand
      return resolveGateway(deps).execute(command)
    },
  }
}

export const opportunityCommandService = createOpportunityCommandService()
