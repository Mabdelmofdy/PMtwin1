import type { Command } from '../types.ts'

export interface CreateCommercialAgreementFromNegotiationCommand extends Command {
  readonly commandType: 'CreateCommercialAgreementFromNegotiation'
  readonly negotiationId: string
}

/** Create Commercial Agreement from agreed Negotiation linked to confirmed PostMatch (aggregateId = postMatchId). */
export interface CreateCommercialAgreementFromPostMatchCommand extends Command {
  readonly commandType: 'CreateCommercialAgreementFromPostMatch'
  readonly negotiationId: string
}

/** Create Commercial Agreement from agreed Application-linked Negotiation (aggregateId = applicationId). */
export interface CreateCommercialAgreementFromApplicationCommand extends Command {
  readonly commandType: 'CreateCommercialAgreementFromApplication'
  readonly negotiationId: string
}

export interface TransitionCommercialAgreementStatusCommand extends Command {
  readonly commandType: 'TransitionCommercialAgreementStatus'
  readonly targetStatus: string
}
