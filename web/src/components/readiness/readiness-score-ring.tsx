import { cn } from '@/lib/utils'
import { getReadinessStatusTone } from '@/components/readiness/readiness-display.ts'
import type { ReadinessStatus } from '@/components/readiness/readiness-display.ts'

const toneRingStyles: Record<ReturnType<typeof getReadinessStatusTone>, string> = {
  incomplete: 'text-amber-600 dark:text-amber-400',
  needs_review: 'text-sky-600 dark:text-sky-400',
  ready: 'text-emerald-600 dark:text-emerald-400',
}

export function ReadinessScoreRing({
  score,
  status,
  className,
}: {
  score: number
  status: ReadinessStatus
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, score))
  const tone = getReadinessStatusTone(status)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex size-24 items-center justify-center', className)}
      role="img"
      aria-label={`Readiness score ${Math.round(clamped)} percent`}
    >
      <svg className="size-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/40"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={toneRingStyles[tone]}
        />
      </svg>
      <span className={cn('absolute text-xl font-semibold tracking-tight', toneRingStyles[tone])}>
        {Math.round(clamped)}%
      </span>
    </div>
  )
}
