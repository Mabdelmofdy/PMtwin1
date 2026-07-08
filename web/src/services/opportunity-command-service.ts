import type {
  ArchiveOpportunityCommand,
  CloseOpportunityCommand,
  CommandResult,
  CreateOpportunityCommand,
  OpportunityCollaborationPayload,
  PublishOpportunityCommand,
  TransitionOpportunityStatusCommand,
  UpdateOpportunityCommand,
  ValidateOpportunityCollaborationModelCommand,
} from '@pm-twin/commands'
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

function createOpportunityId(): string {
  return `opp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    createOpportunity(
      payload: OpportunityCollaborationPayload,
      aggregateId?: string,
    ): CommandResult {
      const id = aggregateId ?? createOpportunityId()
      const command = {
        commandType: 'CreateOpportunity',
        aggregateId: id,
        clientRequestId: createClientRequestId('CreateOpportunity'),
        payload,
      } satisfies CreateOpportunityCommand
      return resolveGateway(deps).execute(command)
    },

    updateOpportunity(
      opportunityId: string,
      payload: Partial<OpportunityCollaborationPayload>,
    ): CommandResult {
      const command = {
        commandType: 'UpdateOpportunity',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('UpdateOpportunity'),
        payload,
      } satisfies UpdateOpportunityCommand
      return resolveGateway(deps).execute(command)
    },

    validateOpportunityCollaborationModel(
      opportunityId: string,
      payload: OpportunityCollaborationPayload,
    ): CommandResult {
      const command = {
        commandType: 'ValidateOpportunityCollaborationModel',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('ValidateOpportunityCollaborationModel'),
        payload,
      } satisfies ValidateOpportunityCollaborationModelCommand
      return resolveGateway(deps).execute(command)
    },

    publishOpportunity(opportunityId: string, reason?: string): CommandResult {
      const command = {
        commandType: 'PublishOpportunity',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('PublishOpportunity'),
        reason,
      } satisfies PublishOpportunityCommand
      return resolveGateway(deps).execute(command)
    },

    closeOpportunity(opportunityId: string, reason?: string): CommandResult {
      const command = {
        commandType: 'CloseOpportunity',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('CloseOpportunity'),
        reason,
      } satisfies CloseOpportunityCommand
      return resolveGateway(deps).execute(command)
    },

    archiveOpportunity(opportunityId: string, reason?: string): CommandResult {
      const command = {
        commandType: 'ArchiveOpportunity',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('ArchiveOpportunity'),
        reason,
      } satisfies ArchiveOpportunityCommand
      return resolveGateway(deps).execute(command)
    },

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
