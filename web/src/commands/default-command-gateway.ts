import type { Command, CommandResult } from '@pm-twin/commands'
import {
  buildCommandRbacFailureResult,
  evaluateCommandRbac,
  type CommandRbacEntitySnapshot,
} from '@/domain/rbac/command-rbac.ts'
import {
  getCommandPermissionActor,
  type CommandPermissionActor,
} from '@/domain/rbac/context/command-permission-context.ts'
import type { CommandGateway } from '@/commands/CommandGateway.ts'
import type { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import type { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import type { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import type { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import type { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import type { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import {
  InMemoryIdempotencyStore,
  buildIdempotencyKey,
} from '@/commands/idempotency/InMemoryIdempotencyStore.ts'

const OPPORTUNITY_COMMAND_TYPES = new Set(['TransitionOpportunityStatus'])

const APPLICATION_COMMAND_TYPES = new Set([
  'SubmitApplication',
  'AcceptApplication',
  'RejectApplication',
  'TransitionApplicationStatus',
])

const POST_MATCH_COMMAND_TYPES = new Set([
  'DiscoverPostMatch',
  'AcceptPostMatch',
  'DeclinePostMatch',
  'ConfirmPostMatch',
  'ExpirePostMatch',
  'SupersedePostMatch',
  'TransitionPostMatchStatus',
])

const NEGOTIATION_COMMAND_TYPES = new Set([
  'StartNegotiationFromPostMatch',
  'AgreeNegotiation',
  'CancelNegotiation',
  'TransitionNegotiationStatus',
])

const DEAL_COMMAND_TYPES = new Set([
  'CreateDealFromPostMatch',
  'CreateDealFromNegotiation',
  'TransitionDealStatus',
])

const CONTRACT_COMMAND_TYPES = new Set([
  'CreateContractFromDeal',
  'SignContract',
  'ActivateContract',
  'CompleteContract',
  'TerminateContract',
])

export type DefaultCommandGatewayDeps = {
  readonly applicationHandler: ApplicationCommandHandler
  readonly opportunityHandler: OpportunityCommandHandler
  readonly postMatchHandler: PostMatchCommandHandler
  readonly negotiationHandler: NegotiationCommandHandler
  readonly dealHandler: DealCommandHandler
  readonly contractHandler: ContractCommandHandler
  readonly idempotencyStore?: InMemoryIdempotencyStore
  readonly resolveCommandPermissionActor?: () => CommandPermissionActor | null
  readonly resolveOpportunityForCommandRbac?: (
    aggregateId: string,
  ) => CommandRbacEntitySnapshot | null | undefined
  readonly enforceCommandRbac?: boolean
}

export class DefaultCommandGateway implements CommandGateway {
  private readonly applicationHandler: ApplicationCommandHandler
  private readonly opportunityHandler: OpportunityCommandHandler
  private readonly postMatchHandler: PostMatchCommandHandler
  private readonly negotiationHandler: NegotiationCommandHandler
  private readonly dealHandler: DealCommandHandler
  private readonly contractHandler: ContractCommandHandler
  private readonly idempotencyStore: InMemoryIdempotencyStore
  private readonly resolveCommandPermissionActor: () => CommandPermissionActor | null
  private readonly resolveOpportunityForCommandRbac: (
    aggregateId: string,
  ) => CommandRbacEntitySnapshot | null | undefined
  private readonly enforceCommandRbac: boolean

  constructor(deps: DefaultCommandGatewayDeps) {
    this.applicationHandler = deps.applicationHandler
    this.opportunityHandler = deps.opportunityHandler
    this.postMatchHandler = deps.postMatchHandler
    this.negotiationHandler = deps.negotiationHandler
    this.dealHandler = deps.dealHandler
    this.contractHandler = deps.contractHandler
    this.idempotencyStore =
      deps.idempotencyStore ?? new InMemoryIdempotencyStore()
    this.resolveCommandPermissionActor =
      deps.resolveCommandPermissionActor ?? getCommandPermissionActor
    this.resolveOpportunityForCommandRbac =
      deps.resolveOpportunityForCommandRbac ?? (() => undefined)
    this.enforceCommandRbac = deps.enforceCommandRbac !== false
  }

  execute(command: Command): CommandResult {
    if (this.enforceCommandRbac) {
      const rbac = evaluateCommandRbac(
        command,
        this.resolveCommandPermissionActor(),
        command.commandType === 'TransitionOpportunityStatus'
          ? {
              opportunity: this.resolveOpportunityForCommandRbac(
                command.aggregateId,
              ),
            }
          : undefined,
      )
      if (!rbac.allowed) {
        return buildCommandRbacFailureResult(command, rbac)
      }
    }

    const handler = this.resolveHandler(command.commandType)
    if (!handler) {
      return {
        success: false,
        aggregateId: command.aggregateId,
        commandType: command.commandType,
        errors: [
          `Command type "${command.commandType}" is not supported by DefaultCommandGateway`,
        ],
      }
    }

    const idempotencyKey = buildIdempotencyKey(
      command.commandType,
      command.aggregateId,
      command.clientRequestId,
    )

    const cached = this.idempotencyStore.get(idempotencyKey)
    if (cached) {
      return cached
    }

    const result = handler.handle(command)
    this.idempotencyStore.put(idempotencyKey, result)
    return result
  }

  getIdempotencyStore(): InMemoryIdempotencyStore {
    return this.idempotencyStore
  }

  private resolveHandler(
    commandType: string,
  ):
    | ApplicationCommandHandler
    | OpportunityCommandHandler
    | PostMatchCommandHandler
    | NegotiationCommandHandler
    | DealCommandHandler
    | ContractCommandHandler
    | null {
    if (APPLICATION_COMMAND_TYPES.has(commandType)) {
      return this.applicationHandler
    }
    if (OPPORTUNITY_COMMAND_TYPES.has(commandType)) {
      return this.opportunityHandler
    }
    if (POST_MATCH_COMMAND_TYPES.has(commandType)) {
      return this.postMatchHandler
    }
    if (NEGOTIATION_COMMAND_TYPES.has(commandType)) {
      return this.negotiationHandler
    }
    if (DEAL_COMMAND_TYPES.has(commandType)) {
      return this.dealHandler
    }
    if (CONTRACT_COMMAND_TYPES.has(commandType)) {
      return this.contractHandler
    }
    return null
  }
}
