import type { PlatformUser } from '@/types/domain.ts'
import type { VettingSlaStatus } from '@/types/vetting.ts'
import { PmBadge } from '@/components/ui/pm-index'
import {
  formatVettingSlaDisplay,
  type VettingSlaDisplay,
} from '@/lib/vetting-sla-service.ts'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

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

export function VettingSlaBadge({
  status,
  user,
  display,
}: {
  readonly status: VettingSlaStatus
  readonly user?: PlatformUser
  readonly display?: VettingSlaDisplay
}) {
  const slaDisplay = display ?? (user ? formatVettingSlaDisplay(user, status) : undefined)
  const ariaLabel = slaDisplay
    ? `SLA: ${SLA_LABEL[status]}. ${slaDisplay.relativeLabel}. ${slaDisplay.targetLabel}`
    : `SLA: ${SLA_LABEL[status]}`

  return (
    <div className="space-y-0.5" aria-label={ariaLabel}>
      <PmBadge tone={SLA_TONE[status]}>{SLA_LABEL[status]}</PmBadge>
      {slaDisplay ? (
        <>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {slaDisplay.relativeLabel}
          </p>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {slaDisplay.targetLabel}
          </p>
        </>
      ) : null}
    </div>
  )
}
