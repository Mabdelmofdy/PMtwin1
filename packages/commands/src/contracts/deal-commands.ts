import type { Command } from '../types.ts'

export interface CreateDealFromNegotiationCommand extends Command {
  readonly commandType: 'CreateDealFromNegotiation'
  readonly negotiationId: string
}

/** Create Deal from agreed Negotiation linked to confirmed PostMatch (aggregateId = postMatchId). */
export interface CreateDealFromPostMatchCommand extends Command {
  readonly commandType: 'CreateDealFromPostMatch'
  readonly negotiationId: string
}

/** Create Deal from agreed Application-linked Negotiation (aggregateId = applicationId). */
export interface CreateDealFromApplicationCommand extends Command {
  readonly commandType: 'CreateDealFromApplication'
  readonly negotiationId: string
}
