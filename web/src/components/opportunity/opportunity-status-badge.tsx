import { PmBadge, type PmBadgeTone } from '@/components/ui/pm-badge'
import {
  formatCanonicalStatusLabel,
  resolveCanonicalStatus,
} from '@/lib/status-display'

const OPPORTUNITY_TONE: Record<string, PmBadgeTone> = {
  draft: 'muted',
  published: 'success',
  matched: 'info',
  negotiating: 'info',
  contracted: 'primary',
  executing: 'success',
  completed: 'success',
  cancelled: 'danger',
}

export function OpportunityStatusBadge({
  status,
}: {
  status: string
}) {
  const canonical = resolveCanonicalStatus('opportunity', status)
  const tone = OPPORTUNITY_TONE[canonical] ?? 'neutral'

  return (
    <PmBadge tone={tone} size="sm">
      {formatCanonicalStatusLabel('opportunity', status)}
    </PmBadge>
  )
}
