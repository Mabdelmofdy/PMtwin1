import { toCanonical } from '@pm-twin/lifecycle'
import { formatStatus } from '@/lib/format.ts'

export type StatusEntity =
  | 'opportunity'
  | 'deal'
  | 'contract'
  | 'negotiation'
  | 'match'
  | 'application'

const CANONICAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  matched: 'Matched',
  negotiating: 'Negotiating',
  contracted: 'Contracted',
  executing: 'Executing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  active: 'Active',
  pending_signature: 'Pending signature',
  terminated: 'Terminated',
  review: 'Review',
  signing: 'Signing',
  agreed: 'Agreed',
  discovered: 'Discovered',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  submitted: 'Submitted',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function resolveCanonicalStatus(
  entity: StatusEntity,
  status: string | undefined | null,
): string {
  if (!status) return ''
  return toCanonical(entity, status) ?? status
}

export function formatCanonicalStatusLabel(
  entity: StatusEntity,
  status: string | undefined | null,
): string {
  const canonical = resolveCanonicalStatus(entity, status)
  if (!canonical) return '—'
  return CANONICAL_STATUS_LABELS[canonical] ?? formatStatus(canonical)
}

export function opportunityPipelineBucket(
  status: string | undefined,
): 'draft' | 'published' | 'in_progress' | 'closed' {
  const canonical = resolveCanonicalStatus('opportunity', status)
  if (canonical === 'draft') return 'draft'
  if (canonical === 'published') return 'published'
  if (
    canonical === 'matched' ||
    canonical === 'negotiating' ||
    canonical === 'contracted' ||
    canonical === 'executing'
  ) {
    return 'in_progress'
  }
  if (canonical === 'completed' || canonical === 'cancelled') {
    return 'closed'
  }
  return 'published'
}
