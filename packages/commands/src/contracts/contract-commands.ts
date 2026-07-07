import type { Command } from '../types.ts'
import type {
  ContractMilestoneSnapshot,
  ContractParty,
} from './contract-types.ts'

/** Create Contract from a draft Commercial Agreement (aggregateId = commercialAgreementId until contract id is assigned). */
export interface CreateContractFromCommercialAgreementCommand extends Command {
  readonly commandType: 'CreateContractFromCommercialAgreement'
  readonly commercialAgreementId: string
  readonly postMatchId?: string
  readonly negotiationId?: string
  readonly needOpportunityId?: string
  readonly offerOpportunityId?: string
  readonly parties?: readonly ContractParty[]
  readonly scope?: string
  readonly milestonesSnapshot?: readonly ContractMilestoneSnapshot[]
}

/** @deprecated use `CreateContractFromCommercialAgreementCommand` */
export type CreateContractFromDealCommand =
  Omit<CreateContractFromCommercialAgreementCommand, 'commandType' | 'commercialAgreementId'> & {
  readonly commandType: 'CreateContractFromDeal'
  readonly commercialAgreementId: string
  readonly dealId: string
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
