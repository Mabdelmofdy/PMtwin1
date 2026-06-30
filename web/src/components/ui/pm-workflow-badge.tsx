import { PmBadge, type PmBadgeTone } from '@/components/ui/pm-badge'
import {
  formatCanonicalStatusLabel,
  resolveCanonicalStatus,
  type StatusEntity,
} from '@/lib/status-display'
import { formatStatus } from '@/lib/format'

const STATUS_TONE: Record<string, PmBadgeTone> = {
  published: 'success',
  active: 'success',
  executing: 'success',
  completed: 'success',
  accepted: 'success',
  agreed: 'success',
  confirmed: 'success',
  pending: 'warning',
  pending_signature: 'warning',
  draft: 'muted',
  review: 'muted',
  signing: 'info',
  negotiating: 'info',
  matched: 'info',
  contracted: 'primary',
  cancelled: 'danger',
  terminated: 'danger',
  rejected: 'danger',
  discovered: 'info',
  submitted: 'info',
  reviewing: 'warning',
  shortlisted: 'info',
  withdrawn: 'muted',
  countered: 'warning',
  expired: 'muted',
  declined: 'danger',
  superseded: 'muted',
}

/** Maps lifecycle workflow status to PmBadge tone — display only. */
export function resolveWorkflowStatusTone(
  status: string,
  entity?: StatusEntity,
): PmBadgeTone {
  const key = entity
    ? resolveCanonicalStatus(entity, status)
    : status.toLowerCase().replace(/\s+/g, '_')
  return STATUS_TONE[key] ?? 'neutral'
}

export type PmWorkflowBadgeProps = {
  status: string
  entity?: StatusEntity
  size?: 'sm' | 'md' | 'lg'
  uppercase?: boolean
  className?: string
}

/** Lifecycle-aware status badge for collaboration workflow entities. */
export function PmWorkflowBadge({
  status,
  entity,
  size = 'sm',
  uppercase,
  className,
}: PmWorkflowBadgeProps) {
  const label = entity
    ? formatCanonicalStatusLabel(entity, status)
    : formatStatus(status)

  return (
    <PmBadge
      tone={resolveWorkflowStatusTone(status, entity)}
      size={size}
      uppercase={uppercase}
      className={className}
    >
      {label}
    </PmBadge>
  )
}
