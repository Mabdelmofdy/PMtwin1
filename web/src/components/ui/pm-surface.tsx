import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmMotion, pmShadow, pmSurfaceTone } from '@/components/shared/pm-design-tokens'

export type PmSurfaceVariant = keyof typeof pmSurfaceTone

export type PmSurfaceProps = ComponentProps<'div'> & {
  variant?: PmSurfaceVariant
  shadow?: keyof typeof pmShadow | 'none'
  interactive?: boolean
  children?: ReactNode
}

export function PmSurface({
  variant = 'default',
  shadow = 'none',
  interactive = false,
  className,
  children,
  ...props
}: PmSurfaceProps) {
  return (
    <div
      data-slot="pm-surface"
      data-variant={variant}
      className={cn(
        'rounded-xl border border-border/60',
        pmSurfaceTone[variant],
        shadow !== 'none' && pmShadow[shadow],
        interactive &&
          cn(
            pmMotion.base,
            'transition-[box-shadow,border-color,background-color]',
            'hover:border-border-strong hover:pm-shadow-panel',
          ),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
