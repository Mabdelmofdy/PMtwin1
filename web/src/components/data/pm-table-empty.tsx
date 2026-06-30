import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'
import {
  resolveTableEmptyState,
  type PmTableEmptyConfig,
} from '@/components/data/pm-table-empty-helpers'

export type PmTableEmptyProps = PmTableEmptyConfig & {
  className?: string
  size?: 'default' | 'compact'
}

/** Table-specific empty state with icon, title, description, and actions. */
export function PmTableEmpty({
  className,
  size = 'default',
  ...config
}: PmTableEmptyProps) {
  const resolved = resolveTableEmptyState(config)

  return (
    <PmSurface
      data-slot="pm-table-empty"
      variant="muted"
      className={cn(
        'flex flex-col items-center justify-center border-dashed text-center',
        size === 'default' ? 'px-6 py-12' : 'px-4 py-8',
        className,
      )}
    >
      {resolved.icon ? (
        <div className="mb-4 text-muted-foreground">{resolved.icon}</div>
      ) : null}
      <h3 className={size === 'default' ? pmTypography.h3 : pmTypography.label}>
        {resolved.title}
      </h3>
      {resolved.description ? (
        <p
          className={cn(
            pmTypography.bodySm,
            'mt-2 max-w-md text-muted-foreground',
          )}
        >
          {resolved.description}
        </p>
      ) : null}
      {resolved.primaryAction || resolved.secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {resolved.primaryAction}
          {resolved.secondaryAction}
        </div>
      ) : null}
    </PmSurface>
  )
}

export type PmTableEmptySlotProps = {
  children?: ReactNode
  className?: string
}

/** Custom empty state slot. */
export function PmTableEmptySlot({ children, className }: PmTableEmptySlotProps) {
  return (
    <div data-slot="pm-table-empty-slot" className={className}>
      {children}
    </div>
  )
}

/** Convenience wrapper for secondary action button styling. */
export function PmTableEmptySecondaryAction({
  children,
  className,
  ...props
}: ComponentProps<typeof PmButton>) {
  return (
    <PmButton variant="outline" size="sm" className={className} {...props}>
      {children}
    </PmButton>
  )
}
