import {
  getLegacyAliases as getRegistryLegacyAliases,
  toCanonical as registryToCanonical,
} from '@pm-twin/lifecycle'
import type { WorkflowEntityType } from '@/domain/workflow/types.ts'

/**
 * ADR-001 legacy ↔ canonical status mapping (read-only).
 * Delegates canonical resolution to @pm-twin/lifecycle.
 */

const APPLICATION_LEGACY: Record<string, string> = {  submitted: 'submitted',
  reviewing: 'reviewing',
  shortlisted: 'shortlisted',
  negotiating: 'negotiating',
  accepted: 'accepted',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
  pending: 'submitted',
  in_negotiation: 'negotiating',
  negotiation: 'negotiating',
  contracted: 'accepted',
}

const OPPORTUNITY_LEGACY: Record<string, string> = {
  draft: 'draft',
  published: 'published',
  matched: 'matched',
  negotiating: 'negotiating',
  contracted: 'contracted',
  executing: 'executing',
  completed: 'completed',
  cancelled: 'cancelled',
  in_negotiation: 'negotiating',
  in_execution: 'executing',
  negotiation: 'negotiating',
  execution: 'executing',
  closed: 'completed',
}

const MATCH_LEGACY: Record<string, string> = {
  discovered: 'discovered',
  accepted: 'accepted',
  confirmed: 'confirmed',
  declined: 'declined',
  expired: 'expired',
  superseded: 'superseded',
  pending: 'discovered',
}

const NEGOTIATION_LEGACY: Record<string, string> = {
  active: 'active',
  countered: 'countered',
  agreed: 'agreed',
  expired: 'expired',
  cancelled: 'cancelled',
  open: 'active',
  counter_offered: 'countered',
  failed: 'cancelled',
}

const DEAL_LEGACY: Record<string, string> = {
  draft: 'draft',
  review: 'review',
  signing: 'signing',
  executing: 'executing',
  completed: 'completed',
  cancelled: 'cancelled',
  negotiating: 'draft',
  active: 'executing',
  execution: 'executing',
  delivery: 'executing',
  closed: 'completed',
}

const CONTRACT_LEGACY: Record<string, string> = {
  draft: 'draft',
  pending_signature: 'pending_signature',
  active: 'active',
  completed: 'completed',
  terminated: 'terminated',
  pending: 'pending_signature',
}

const LEGACY_MAP: Record<WorkflowEntityType, Record<string, string>> = {
  application: APPLICATION_LEGACY,
  opportunity: OPPORTUNITY_LEGACY,
  match: MATCH_LEGACY,
  negotiation: NEGOTIATION_LEGACY,
  deal: DEAL_LEGACY,
  contract: CONTRACT_LEGACY,
}

/** Preferred POC stored form for each canonical state (inverse of primary alias). */
const STORED_PREFERENCE: Record<WorkflowEntityType, Record<string, string>> = {
  application: {
    submitted: 'pending',
    negotiating: 'in_negotiation',
  },
  opportunity: {
    negotiating: 'in_negotiation',
    executing: 'in_execution',
  },
  match: {
    discovered: 'pending',
  },
  negotiation: {
    active: 'open',
    countered: 'counter_offered',
  },
  deal: {
    executing: 'execution',
  },
  contract: {
    pending_signature: 'pending',
  },
}

/** Map a stored/legacy status to its ADR-001 canonical workflow state (read-only). */
export function toCanonicalStatus(
  entityType: WorkflowEntityType,
  status: string | undefined | null,
): string {
  return registryToCanonical(entityType, status)
}

/** Map a canonical workflow state to its preferred stored/legacy form (read-only). */
export function toStoredStatus(
  entityType: WorkflowEntityType,
  canonical: string | undefined | null,
): string {
  if (canonical == null || canonical === '') return ''
  const key = String(canonical).toLowerCase()
  const preference = STORED_PREFERENCE[entityType]?.[key]
  return preference ?? key
}

/** ADR-001 legacy aliases only (excludes identity mappings). */
export function getLegacyAliases(
  entityType: WorkflowEntityType,
): Readonly<Record<string, string>> {
  return getRegistryLegacyAliases(entityType)
}

/** Reverse lookup: canonical → legacy aliases that map to it */
export function getLegacyVariantsForCanonical(
  entityType: WorkflowEntityType,
  canonical: string,
): string[] {
  const map = LEGACY_MAP[entityType]
  const target = canonical.toLowerCase()
  const variants = Object.entries(map)
    .filter(([, canon]) => canon === target)
    .map(([legacy]) => legacy)
  if (!variants.includes(target)) variants.push(target)
  return [...new Set(variants)]
}
