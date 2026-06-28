import type {
  DiscoverPostMatchCommand,
  DiscoverOneWayPostMatchCommand,
  DiscoverTwoWayPostMatchCommand,
  DiscoverConsortiumPostMatchCommand,
  DiscoverCircularPostMatchCommand,
} from '@pm-twin/commands'

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
