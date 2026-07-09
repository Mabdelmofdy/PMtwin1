import type { ComponentProps, ReactNode } from 'react'
import { PmEmptyState } from '@/components/ui/pm-empty-state'
import { PmButton } from '@/components/ui/pm-button'
import {
  resolveTableEmptyState,
  type PmTableEmptyConfig,
} from '@/components/data/pm-table-empty-helpers'

export type PmTableEmptyProps = PmTableEmptyConfig & {
  className?: string
  size?: 'default' | 'compact'
}

/** Table-specific empty state — delegates to PmEmptyState with table copy defaults. */
export function PmTableEmpty({
  className,
  size = 'default',
  ...config
}: PmTableEmptyProps) {
  const resolved = resolveTableEmptyState(config)

  return (
    <PmEmptyState
      dataSlot="pm-table-empty"
      title={resolved.title}
      description={resolved.description}
      icon={resolved.icon}
      action={resolved.primaryAction}
      secondaryAction={resolved.secondaryAction}
      size={size}
      className={className}
    />
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
