import type { ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { buildScoreAriaLabel } from '@/components/ui/pm-score-a11y'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type PmScoreTooltipProps = {
  children: ReactElement
  lines: readonly string[]
  className?: string
  /** Disable tooltip (e.g. hero surfaces with inline copy). */
  disabled?: boolean
  /** Override computed aria-label for the focusable trigger. */
  accessibilityLabel?: string
}

/** Accessible score explanation — keyboard focusable, screen-reader labeled, hover tooltip. */
export function PmScoreTooltip({
  children,
  lines,
  className,
  disabled = false,
  accessibilityLabel,
}: PmScoreTooltipProps) {
  if (disabled || lines.length === 0) {
    return children
  }

  const label = accessibilityLabel ?? buildScoreAriaLabel(lines)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label={label}
          className={cn(
            'inline-flex max-w-full rounded-md pm-focus-ring',
            className,
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <ScoreExplanationBody lines={lines} />
      </TooltipContent>
    </Tooltip>
  )
}

export function ScoreExplanationBody({ lines }: { lines: readonly string[] }) {
  return (
    <div className="space-y-1 text-xs">
      {lines.map((line, index) => (
        <p
          key={`${line}-${index}`}
          className={index === 0 ? 'font-semibold' : 'text-muted-foreground'}
        >
          {line}
        </p>
      ))}
    </div>
  )
}

export function ScoreExplanationList({
  lines,
  className,
}: {
  lines: readonly string[]
  className?: string
}) {
  return (
    <ul className={cn('space-y-1 text-xs text-muted-foreground', className)}>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
