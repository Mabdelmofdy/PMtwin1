import type { Command } from '../types.ts'
import type {
  ContractMilestoneSnapshot,
  ContractParty,
} from './contract-types.ts'

/** Create Contract from a draft Deal (aggregateId = dealId until contract id is assigned). */
export interface CreateContractFromDealCommand extends Command {
  readonly commandType: 'CreateContractFromDeal'
  readonly dealId: string
  readonly postMatchId?: string
  readonly negotiationId?: string
  readonly needOpportunityId?: string
  readonly offerOpportunityId?: string
  readonly parties?: readonly ContractParty[]
  readonly scope?: string
  readonly milestonesSnapshot?: readonly ContractMilestoneSnapshot[]
}

export interface SignContractCommand extends Command {
  readonly commandType: 'SignContract'
  readonly userId: string
}

export interface ActivateContractCommand extends Command {
  readonly commandType: 'ActivateContract'
  readonly triggeredByCommandId?: string
}

export interface CompleteContractCommand extends Command {
  readonly commandType: 'CompleteContract'
  readonly reason?: string
}

export interface TerminateContractCommand extends Command {
  readonly commandType: 'TerminateContract'
  readonly reason?: string
}
