import type {
  ArchiveOpportunityCommand,
  CloseOpportunityCommand,
  CommandResult,
  CreateOpportunityCommand,
  DeleteOpportunityCommand,
  OpportunityCollaborationPayload,
  PublishOpportunityCommand,
  TransitionOpportunityStatusCommand,
  UpdateOpportunityCommand,
  ValidateOpportunityCollaborationModelCommand,
} from '@pm-twin/commands'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'
import {
  matchingService,
  type PublishMatchingResult,
} from '@/services/matching-service.ts'

export type OpportunityCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
  readonly runPublishMatching?: (opportunityId: string) => PublishMatchingResult
  readonly runCircularMatching?: (opportunityId: string) => PublishMatchingResult
}

export type PublishTransitionResult = {
  readonly command: CommandResult
  readonly matching: PublishMatchingResult
  readonly circular: PublishMatchingResult
}

const EMPTY_MATCHING_RESULT: PublishMatchingResult = {
  discoveredMatchesCount: 0,
  skippedDuplicatesCount: 0,
  matchingErrors: [],
  postMatchIds: [],
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

function isPublishedTarget(targetStatus: string): boolean {
  return targetStatus.trim().toLowerCase() === 'published'
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

function runPostPublishMatching(
  opportunityId: string,
  deps?: OpportunityCommandServiceDeps,
): {
  readonly matching: PublishMatchingResult
  readonly circular: PublishMatchingResult
} {
  const runPublishMatching =
    deps?.runPublishMatching
    ?? matchingService.runPublishMatchingForOpportunity.bind(matchingService)
  const runCircularMatching =
    deps?.runCircularMatching
    ?? matchingService.runCircularMatchingForOpportunity.bind(matchingService)

  const matching = runPublishMatching(opportunityId)

  // Circular matching is best-effort and must never fail the publish action.
  let circular: PublishMatchingResult
  try {
    circular = runCircularMatching(opportunityId)
  } catch (error) {
    circular = {
      ...EMPTY_MATCHING_RESULT,
      matchingErrors: [
        error instanceof Error ? error.message : 'Circular matching failed',
      ],
    }
  }

  return { matching, circular }
}

function toPublishTransitionResult(
  command: CommandResult,
  opportunityId: string,
  deps?: OpportunityCommandServiceDeps,
): PublishTransitionResult {
  if (!command.success) {
    return {
      command,
      matching: EMPTY_MATCHING_RESULT,
      circular: EMPTY_MATCHING_RESULT,
    }
  }
  const { matching, circular } = runPostPublishMatching(opportunityId, deps)
  return { command, matching, circular }
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

    /**
     * Publish command + automatic matching. Prefer this (or
     * `transitionToPublished`) over raw status flips so PostMatches are created.
     */
    publishOpportunity(
      opportunityId: string,
      reason?: string,
    ): PublishTransitionResult {
      const commandPayload = {
        commandType: 'PublishOpportunity',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('PublishOpportunity'),
        reason,
      } satisfies PublishOpportunityCommand
      const command = resolveGateway(deps).execute(commandPayload)
      return toPublishTransitionResult(command, opportunityId, deps)
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

    deleteOpportunity(opportunityId: string, reason?: string): CommandResult {
      const command = {
        commandType: 'DeleteOpportunity',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('DeleteOpportunity'),
        reason,
      } satisfies DeleteOpportunityCommand
      return resolveGateway(deps).execute(command)
    },

    duplicateOpportunity(
      source: OpportunityCollaborationPayload & {
        readonly title: string
        readonly asTemplate?: boolean
        readonly sourceOpportunityId?: string
      },
    ): CommandResult {
      const suffix = source.asTemplate ? ' (Template)' : ' (Copy)'
      const title = source.title.endsWith(suffix)
        ? source.title
        : `${source.title}${suffix}`
      const attrs = {
        ...(source.collaborationAttributes ?? {}),
        templateMetadata: {
          isTemplate: Boolean(source.asTemplate),
          templateScope: source.asTemplate ? 'personal' : undefined,
          sourceOpportunityId: source.sourceOpportunityId,
        },
      }
      return this.createOpportunity({
        ...source,
        title,
        collaborationAttributes: attrs,
      })
    },

    /**
     * Canonical publish path: transition to published, then run publish + circular
     * matching once. Used by UI publish orchestration.
     */
    transitionToPublished(
      opportunityId: string,
      reason?: string,
    ): PublishTransitionResult {
      const commandPayload = {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('TransitionOpportunityStatus'),
        targetStatus: 'published',
        reason,
      } satisfies TransitionOpportunityStatusCommand
      const command = resolveGateway(deps).execute(commandPayload)
      return toPublishTransitionResult(command, opportunityId, deps)
    },

    transitionOpportunityStatus(
      opportunityId: string,
      targetStatus: string,
      reason?: string,
    ): CommandResult {
      const commandPayload = {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: opportunityId,
        clientRequestId: createClientRequestId('TransitionOpportunityStatus'),
        targetStatus,
        reason,
      } satisfies TransitionOpportunityStatusCommand
      const command = resolveGateway(deps).execute(commandPayload)
      if (command.success && isPublishedTarget(targetStatus)) {
        runPostPublishMatching(opportunityId, deps)
      }
      return command
    },
  }
}

export const opportunityCommandService = createOpportunityCommandService()

export { EMPTY_MATCHING_RESULT as EMPTY_PUBLISH_MATCHING_RESULT }
