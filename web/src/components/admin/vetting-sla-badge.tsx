import type { VettingSlaStatus } from '@/types/vetting.ts'
import { PmBadge } from '@/components/ui/pm-index'

const SLA_TONE: Record<VettingSlaStatus, 'success' | 'warning' | 'danger'> = {
  on_track: 'success',
  at_risk: 'warning',
  overdue: 'danger',
}

const SLA_LABEL: Record<VettingSlaStatus, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  overdue: 'Overdue',
}

export function VettingSlaBadge({ status }: { readonly status: VettingSlaStatus }) {
  return <PmBadge tone={SLA_TONE[status]}>{SLA_LABEL[status]}</PmBadge>
}
