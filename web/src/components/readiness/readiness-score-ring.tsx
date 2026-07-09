import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { resolveReadinessScoreDisplay } from '@/components/ui/pm-readiness-score-display'
import type { ReadinessStatus } from '@/components/readiness/readiness-display.ts'

const TONE_TEXT_CLASS = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
} as const

export function ReadinessScoreRing({
  score,
  status: _status,
  className,
}: {
  score: number
  status: ReadinessStatus
  className?: string
}) {
  const display = resolveReadinessScoreDisplay(score)
  const toneClass = TONE_TEXT_CLASS[display.tone as keyof typeof TONE_TEXT_CLASS] ?? 'text-foreground'
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (display.percent / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex size-24 items-center justify-center', className)}
      role="img"
      aria-label={`Readiness score ${display.percent} percent`}
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
          className={toneClass}
        />
      </svg>
      <span className={cn('absolute', pmTypography.stat, 'text-xl', toneClass)}>
        {display.percent}%
      </span>
    </div>
  )
}
