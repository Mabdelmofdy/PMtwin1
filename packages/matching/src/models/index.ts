export {
  resolveThreshold,
  resolveMaxCandidates,
  resolveNormalized,
  passHardGate,
  withRunnerConfig,
  parseRoleDefinitions,
  buildRoleServices,
  buildSyntheticNeedForRole,
} from './shared.ts'
export type { RoleDefinition } from './shared.ts'

export { estimateValueSar, valueEquivalenceText, barterSidePost } from './value-estimate.ts'
export { findOffersForNeedPure, findNeedsForOfferPure } from './one-way.ts'
export { findBarterMatchesPure, averageScoreBreakdown } from './two-way.ts'
export { findConsortiumMatchesPure } from './consortium.ts'
export {
  normalizeCycleRing,
  buildCircularLinkScores,
  findCircularExchangesPure,
} from './circular.ts'
export type { CircularEdgeDetail, CircularEdgeMap } from './circular.ts'
