import type { Command } from '../types.ts'
import type {
  DiscoverCircularPayload,
  DiscoverConsortiumPayload,
  DiscoverOneWayPayload,
  DiscoverTwoWayPayload,
  PostMatchParticipant,
} from './post-match-types.ts'

/** Shared fields for all DiscoverPostMatch topology variants. */
export interface DiscoverPostMatchCommandBase extends Command {
  readonly commandType: 'DiscoverPostMatch'
  readonly matchScore: number
  readonly participants: readonly PostMatchParticipant[]
  readonly runId?: string
}

/** Engine/system command: single Need ↔ Offer pair. */
export interface DiscoverOneWayPostMatchCommand
  extends DiscoverPostMatchCommandBase,
    DiscoverOneWayPayload {
  readonly matchType: 'one_way'
}

/** Engine/system command: mutual barter (sideA ↔ sideB). */
export interface DiscoverTwoWayPostMatchCommand
  extends DiscoverPostMatchCommandBase,
    DiscoverTwoWayPayload {
  readonly matchType: 'two_way'
}

/** Engine/system command: consortium lead need + role assignments. */
export interface DiscoverConsortiumPostMatchCommand
  extends DiscoverPostMatchCommandBase,
    DiscoverConsortiumPayload {
  readonly matchType: 'consortium'
}

/** Engine/system command: closed circular exchange chain. */
export interface DiscoverCircularPostMatchCommand
  extends DiscoverPostMatchCommandBase,
    DiscoverCircularPayload {
  readonly matchType: 'circular'
}

/** ADR-MATCH-001 topology-discriminated discover command union. */
export type DiscoverPostMatchCommand =
  | DiscoverOneWayPostMatchCommand
  | DiscoverTwoWayPostMatchCommand
  | DiscoverConsortiumPostMatchCommand
  | DiscoverCircularPostMatchCommand

/** Alias — ADR-MATCH-001 naming. */
export type DiscoverOneWayPostMatch = DiscoverOneWayPostMatchCommand
export type DiscoverTwoWayPostMatch = DiscoverTwoWayPostMatchCommand
export type DiscoverConsortiumPostMatch = DiscoverConsortiumPostMatchCommand
export type DiscoverCircularPostMatch = DiscoverCircularPostMatchCommand

/** Participant accepts a discovered/accepted PostMatch. */
export interface AcceptPostMatchCommand extends Command {
  readonly commandType: 'AcceptPostMatch'
  readonly userId: string
}

/** Participant declines a PostMatch. */
export interface DeclinePostMatchCommand extends Command {
  readonly commandType: 'DeclinePostMatch'
  readonly userId: string
}

/** System command when all participants have accepted (quorum met). */
export interface ConfirmPostMatchCommand extends Command {
  readonly commandType: 'ConfirmPostMatch'
  readonly triggeredByCommandId?: string
}

/** System/admin command when a PostMatch TTL elapses. */
export interface ExpirePostMatchCommand extends Command {
  readonly commandType: 'ExpirePostMatch'
  readonly reason?: string
}

/** System command when a PostMatch is replaced by a newer match for the same topology. */
export interface SupersedePostMatchCommand extends Command {
  readonly commandType: 'SupersedePostMatch'
  readonly replacementPostMatchId: string
  readonly reason?: string
}
