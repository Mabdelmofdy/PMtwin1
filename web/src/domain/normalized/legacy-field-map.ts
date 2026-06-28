/**
 * Central legacy field compatibility map — used by all normalized adapters.
 * Maps canonical normalized field names to known legacy storage variants.
 */

export const LEGACY_FIELD_MAP = {
  participants: ['participants', 'parties'] as const,

  commercialTerms: [
    'commercialTerms',
    'terms',
    'valueTerms',
    'agreedTerms',
    'initialTerms',
    'application_value',
  ] as const,

  matchId: ['matchId', 'postMatchId', 'match_ref'] as const,

  /** Entity-type aliases for audit/notification references. */
  matchEntityType: ['match', 'post_match', 'postMatch'] as const,

  tenantId: ['tenantId'] as const,
  organizationId: ['organizationId'] as const,

  timestamps: {
    createdAt: ['createdAt', 'created_at'] as const,
    updatedAt: ['updatedAt', 'updated_at'] as const,
    /** Audit logs may use timestamp instead of createdAt. */
    auditCreatedAt: ['timestamp', 'createdAt', 'created_at'] as const,
  },

  status: {
    negotiation: ['open', 'active'] as const,
    negotiationCounter: ['countered', 'counter_offered'] as const,
    deal: ['review', 'delivery', 'execution'] as const,
    dealActive: ['active', 'execution', 'delivery'] as const,
    contractPending: ['pending', 'pending_signature', 'draft'] as const,
  },

  /** Preferred canonical status when normalizing alias groups. */
  statusCanonical: {
    negotiation: {
      open: 'active',
      active: 'active',
    },
    negotiationCounter: {
      countered: 'counter_offered',
      counter_offered: 'counter_offered',
    },
  } as const,

  /** Legacy opportunity intent → canonical (ADR-002). */
  opportunityIntent: {
    request: 'need',
    need: 'need',
    offer: 'offer',
    hybrid: 'hybrid',
  } as const,
} as const

export type LegacyFieldMap = typeof LEGACY_FIELD_MAP
