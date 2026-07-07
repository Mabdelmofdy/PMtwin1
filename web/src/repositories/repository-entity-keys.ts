import type { Overrides } from '@/types/storage.ts'

/** Expected override keys per repository — must be unique and semantically correct. */
export const REPOSITORY_ENTITY_KEYS = {
  application: 'applications',
  opportunity: 'opportunities',
  user: 'users',
  company: 'companies',
  audit: 'newAuditEntries',
  postMatch: 'postMatches',
  deal: 'deals',
  commercialAgreement: 'commercialAgreements',
  negotiation: 'negotiations',
  contract: 'contracts',
  notification: 'notifications',
} as const satisfies Record<string, keyof Overrides>

/** Keys that must never be shared across repositories (excluding append-only audit). */
export const READ_ONLY_SEED_REPOSITORY_KEYS = [
  REPOSITORY_ENTITY_KEYS.user,
  REPOSITORY_ENTITY_KEYS.company,
] as const
