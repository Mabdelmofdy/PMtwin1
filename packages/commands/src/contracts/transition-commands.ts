import type { Command } from '../types.ts'

export interface TransitionOpportunityStatusCommand extends Command {
  readonly commandType: 'TransitionOpportunityStatus'
  readonly targetStatus: string
  readonly reason?: string
}

export interface TransitionApplicationStatusCommand extends Command {
  readonly commandType: 'TransitionApplicationStatus'
  readonly targetStatus: string
}

export interface TransitionPostMatchStatusCommand extends Command {
  readonly commandType: 'TransitionPostMatchStatus'
  readonly targetStatus: string
}

export interface TransitionNegotiationStatusCommand extends Command {
  readonly commandType: 'TransitionNegotiationStatus'
  readonly targetStatus: string
}

export interface TransitionDealStatusCommand extends Command {
  readonly commandType: 'TransitionDealStatus'
  readonly targetStatus: string
}

export interface TransitionContractStatusCommand extends Command {
  readonly commandType: 'TransitionContractStatus'
  readonly targetStatus: string
}
