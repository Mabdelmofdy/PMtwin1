/**
 * Shadow normalized domain layer — compatibility abstraction on top of legacy storage.
 * Does NOT replace @/types/domain.ts or existing repositories.
 */

export { LEGACY_FIELD_MAP } from '@/domain/normalized/legacy-field-map.ts'
export type { LegacyFieldMap } from '@/domain/normalized/legacy-field-map.ts'

export type {
  NormalizedApplication,
  NormalizedApplicationStatus,
  NormalizedAuditLog,
  NormalizedCommercialTerms,
  NormalizedCompany,
  NormalizedContract,
  NormalizedContractStatus,
  NormalizedDeal,
  NormalizedDealMilestone,
  NormalizedDealStatus,
  NormalizedMatch,
  NormalizedMatchPayload,
  NormalizedMatchStatus,
  NormalizedNegotiation,
  NormalizedNegotiationRound,
  NormalizedNegotiationStatus,
  NormalizedNotification,
  NormalizedOpportunity,
  NormalizedOpportunityStatus,
  NormalizedParticipant,
  NormalizedProfile,
  NormalizedUser,
  NormalizedUserStatus,
} from '@/domain/normalized/types.ts'

export {
  normalizeApplication,
  normalizeApplications,
  normalizeAuditLog,
  normalizeAuditLogs,
  normalizeCompany,
  normalizeCompanies,
  normalizeContract,
  normalizeContracts,
  normalizeCommercialAgreement,
  normalizeCommercialAgreements,
  normalizeDeal,
  normalizeDeals,
  normalizeMatch,
  normalizeNegotiation,
  normalizeNegotiations,
  normalizeNotification,
  normalizeNotifications,
  normalizeOpportunity,
  normalizeOpportunities,
  normalizePostMatch,
  normalizePostMatches,
  normalizeUser,
  normalizeUsers,
} from '@/domain/normalized/adapters.ts'

export {
  resolveActorReference,
  resolveCompanyReference,
  resolveDealChain,
  resolveUserReference,
} from '@/domain/normalized/relationship-safety.ts'

export type {
  ActorReference,
  DealChain,
} from '@/domain/normalized/relationship-safety.ts'

export {
  asLegacyRaw,
  canonicalizeEntityType,
  canonicalizeNegotiationStatus,
  pickFirst,
  pickMatchId,
  pickParticipants,
  resolveCommercialTerms,
} from '@/domain/normalized/field-utils.ts'

export {
  computePostMatchStrongKey,
  computePostMatchStrongKeyFromMatch,
  collectPostMatchOpportunityIds,
} from '@/domain/normalized/post-match-strong-key.ts'
export type { PostMatchStrongKeyInput } from '@/domain/normalized/post-match-strong-key.ts'

export {
  discoverPostMatchStrongKey,
  validateDiscoverPostMatchCommand,
} from '@/domain/normalized/post-match-discover-validation.ts'

export {
  isDiscoverCircularPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
} from '@/domain/normalized/post-match-topology-guards.ts'
export type { OpportunityIntent, OpportunityIntentStored } from '@/types/enums.ts'

export type { LegacyRaw } from '@/domain/normalized/field-utils.ts'

export * from '@/domain/normalized/validation/index.ts'
export * from '@/domain/normalized/schemas/index.ts'
