// src/contracts/post-match-guards.ts
function discoverPostMatchTopology(command) {
  return command.matchType;
}
function isDiscoverOneWayPostMatch(command) {
  return command.matchType === "one_way";
}
function isDiscoverTwoWayPostMatch(command) {
  return command.matchType === "two_way";
}
function isDiscoverConsortiumPostMatch(command) {
  return command.matchType === "consortium";
}
function isDiscoverCircularPostMatch(command) {
  return command.matchType === "circular";
}
export {
  discoverPostMatchTopology,
  isDiscoverCircularPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch
};
