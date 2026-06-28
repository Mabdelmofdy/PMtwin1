import { cn } from '@/lib/utils'
import {
  formatReadinessStatusLabel,
  getReadinessStatusTone,
  type ReadinessStatus,
} from '@/components/readiness/readiness-display.ts'

const toneStyles: Record<ReturnType<typeof getReadinessStatusTone>, string> = {
  incomplete: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  needs_review: 'bg-sky-500/10 text-sky-800 dark:text-sky-300',
  ready: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
}

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
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
      aria-label={`Readiness status: ${label}`}
    >
      {label}
    </span>
  )
}
