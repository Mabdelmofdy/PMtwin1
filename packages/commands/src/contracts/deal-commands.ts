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
