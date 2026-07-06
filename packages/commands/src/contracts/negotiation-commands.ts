import type { Command } from '../types.ts'

export interface StartNegotiationCommand extends Command {
  readonly commandType: 'StartNegotiation'
  readonly matchId?: string
  readonly applicationId?: string
  readonly opportunityId?: string
}

/** Start negotiation from a confirmed Need/Offer PostMatch (aggregateId = postMatchId). */
export interface StartNegotiationFromPostMatchCommand extends Command {
  readonly commandType: 'StartNegotiationFromPostMatch'
}

/** Start negotiation from an accepted hiring Application (aggregateId = applicationId). */
export interface StartNegotiationFromApplicationCommand extends Command {
  readonly commandType: 'StartNegotiationFromApplication'
}

export interface AgreeNegotiationCommand extends Command {
  readonly commandType: 'AgreeNegotiation'
}

export interface CancelNegotiationCommand extends Command {
  readonly commandType: 'CancelNegotiation'
}
