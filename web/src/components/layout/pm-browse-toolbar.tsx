import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'

export type PmBrowseToolbarProps = ComponentProps<typeof PmToolbarSurface>

/**
 * Browse-page toolbar — always composed inside `PmPage` `toolbar` slot.
 * Wraps `PmToolbarSurface` with the canonical browse data-slot.
 */
export function PmBrowseToolbar({ className, ...props }: PmBrowseToolbarProps) {
  return (
    <PmToolbarSurface
      data-slot="pm-browse-toolbar"
      className={cn('space-y-3', className)}
      {...props}
    />
  )
}
