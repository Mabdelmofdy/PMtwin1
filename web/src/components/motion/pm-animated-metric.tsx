import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { pmMetricCountDuration } from '@/components/motion/pm-motion-presets'
import { usePmReducedMotion } from '@/components/motion/use-pm-reduced-motion'

export type PmAnimatedMetricProps = {
  value: number
  label: string
  className?: string
  suffix?: string
  decimals?: number
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Hero KPI with optional count-up reveal — presentation only. */
export function PmAnimatedMetric({
  value,
  label,
  className,
  suffix = '',
  decimals = 0,
}: PmAnimatedMetricProps) {
  const reducedMotion = usePmReducedMotion()
  const [display, setDisplay] = useState(reducedMotion ? value : 0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value)
      return
    }

    const durationMs = pmMetricCountDuration(false) * 1000
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      const next = from + (value - from) * easeOutCubic(progress)
      setDisplay(next)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [value, reducedMotion])

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display))

  return (
    <div data-slot="pm-animated-metric" className={cn('space-y-0.5', className)}>
      <p className={pmTypography.stat} aria-live="polite">
        {formatted}
        {suffix}
      </p>
      <p className={pmTypography.statLabel}>{label}</p>
    </div>
  )
}
