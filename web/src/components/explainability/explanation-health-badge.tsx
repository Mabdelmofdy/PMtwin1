import type { Health } from '@pm-twin/explainability'
import { HEALTH } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { PmBadge, type PmBadgeTone } from '@/components/ui/pm-badge'

const HEALTH_LABELS: Record<Health, string> = {
  [HEALTH.EXCELLENT]: 'Excellent',
  [HEALTH.GOOD]: 'Good',
  [HEALTH.WARNING]: 'Needs attention',
  [HEALTH.CRITICAL]: 'Critical',
}

const HEALTH_TONES: Record<Health, PmBadgeTone> = {
  [HEALTH.EXCELLENT]: 'success',
  [HEALTH.GOOD]: 'info',
  [HEALTH.WARNING]: 'warning',
  [HEALTH.CRITICAL]: 'danger',
}

export function ExplanationHealthBadge({
  health,
  className,
}: {
  health: Health
  className?: string
}) {
  return (
    <PmBadge tone={HEALTH_TONES[health]} size="sm" className={cn('shrink-0', className)}>
      {HEALTH_LABELS[health]}
    </PmBadge>
  )
}
