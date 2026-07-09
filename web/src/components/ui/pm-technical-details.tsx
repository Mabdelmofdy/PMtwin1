import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type PmTechnicalDetailsProps = {
  readonly children: ReactNode
  readonly className?: string
  readonly label?: string
}

/** Collapsed inspector for internal identifiers — not shown by default in enterprise views. */
export function PmTechnicalDetails({
  children,
  className,
  label = 'Technical details',
}: PmTechnicalDetailsProps) {
  return (
    <details
      data-slot="pm-technical-details"
      className={cn('rounded-xl border border-border/60 bg-surface-muted/30', className)}
    >
      <summary
        className={cn(
          pmTypography.caption,
          'cursor-pointer list-none px-4 py-2.5 font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden',
        )}
      >
        {label}
      </summary>
      <div className="space-y-3 border-t border-border/40 px-4 py-3">{children}</div>
    </details>
  )
}
