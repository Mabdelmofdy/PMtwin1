import type { WorkflowEntityType } from '@/domain/workflow/types.ts'

/**
 * Read-only legacy → canonical status mapping.
 * Never modifies stored values; used only by the workflow decision layer.
 */

const APPLICATION_LEGACY: Record<string, string> = {
  pending: 'submitted',
  submitted: 'submitted',
  reviewing: 'reviewing',
  shortlisted: 'shortlisted',
  in_negotiation: 'negotiation',
  negotiation: 'negotiation',
  accepted: 'accepted',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
  contracted: 'accepted',
}

const OPPORTUNITY_LEGACY: Record<string, string> = {
  draft: 'draft',
  published: 'published',
  matched: 'matched',
  negotiation: 'negotiation',
  in_negotiation: 'negotiation',
  contracted: 'contracted',
  execution: 'execution',
  in_execution: 'execution',
  completed: 'completed',
  cancelled: 'cancelled',
  closed: 'completed',
}

const NEGOTIATION_LEGACY: Record<string, string> = {
  open: 'active',
  active: 'active',
  countered: 'countered',
  counter_offered: 'countered',
  agreed: 'agreed',
  expired: 'expired',
  cancelled: 'cancelled',
  failed: 'cancelled',
}

const DEAL_LEGACY: Record<string, string> = {
  draft: 'draft',
  review: 'draft',
  negotiating: 'draft',
  signing: 'active',
  active: 'active',
  execution: 'execution',
  delivery: 'execution',
  completed: 'completed',
  closed: 'completed',
  cancelled: 'cancelled',
}

const CONTRACT_LEGACY: Record<string, string> = {
  draft: 'draft',
  pending: 'pending_signature',
  pending_signature: 'pending_signature',
  active: 'active',
  completed: 'completed',
  terminated: 'terminated',
}

const LEGACY_MAP: Record<WorkflowEntityType, Record<string, string>> = {
  application: APPLICATION_LEGACY,
  opportunity: OPPORTUNITY_LEGACY,
  negotiation: NEGOTIATION_LEGACY,
  deal: DEAL_LEGACY,
  contract: CONTRACT_LEGACY,
}

/** Map a stored/legacy status to its canonical workflow state (read-only). */
export function toCanonicalStatus(
  entityType: WorkflowEntityType,
  status: string | undefined | null,
): string {
  if (status == null || status === '') return ''
  const key = String(status).toLowerCase()
  const map = LEGACY_MAP[entityType]
  return map[key] ?? key
}

/** All known legacy aliases for an entity type (for diagnostics). */
export function getLegacyAliases(
  entityType: WorkflowEntityType,
): Readonly<Record<string, string>> {
  return LEGACY_MAP[entityType]
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
