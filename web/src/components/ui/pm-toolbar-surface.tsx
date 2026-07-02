import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PmToolbarSurfaceProps = ComponentProps<'div'> & {
  children?: ReactNode
}

/** Standard toolbar container — muted surface with consistent padding and radius. */
export function PmToolbarSurface({ className, children, ...props }: PmToolbarSurfaceProps) {
  return (
    <div
      data-slot="pm-toolbar-surface"
      className={cn('pm-toolbar-surface rounded-xl px-4 py-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}
