import type {
  DiscoverPostMatchCommand,
  DiscoverOneWayPostMatchCommand,
  DiscoverTwoWayPostMatchCommand,
  DiscoverConsortiumPostMatchCommand,
  DiscoverCircularPostMatchCommand,
} from './match-commands.ts'
import type { PostMatchType } from './post-match-types.ts'

export function discoverPostMatchTopology(
  command: DiscoverPostMatchCommand,
): PostMatchType {
  return command.matchType
}

export function isDiscoverOneWayPostMatch(
  command: DiscoverPostMatchCommand,
): command is DiscoverOneWayPostMatchCommand {
  return command.matchType === 'one_way'
}

export function isDiscoverTwoWayPostMatch(
  command: DiscoverPostMatchCommand,
): command is DiscoverTwoWayPostMatchCommand {
  return command.matchType === 'two_way'
}

export function isDiscoverConsortiumPostMatch(
  command: DiscoverPostMatchCommand,
): command is DiscoverConsortiumPostMatchCommand {
  return command.matchType === 'consortium'
}

export function isDiscoverCircularPostMatch(
  command: DiscoverPostMatchCommand,
): command is DiscoverCircularPostMatchCommand {
  return command.matchType === 'circular'
}
