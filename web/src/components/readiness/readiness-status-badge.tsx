import { PmBadge } from '@/components/ui/pm-badge'
import {
  formatReadinessStatusLabel,
  getReadinessStatusTone,
  type ReadinessStatus,
} from '@/components/readiness/readiness-display.ts'

const TONE_MAP = {
  incomplete: 'warning',
  needs_review: 'info',
  ready: 'success',
} as const

export function ReadinessStatusBadge({
  status,
  className,
}: {
  status: ReadinessStatus
  className?: string
}) {
  const tone = getReadinessStatusTone(status)
  const label = formatReadinessStatusLabel(status)

  return (
    <PmBadge
      tone={TONE_MAP[tone]}
      size="sm"
      className={className}
      aria-label={`Readiness status: ${label}`}
    >
      {label}
    </PmBadge>
  )
}
