import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { pmInteraction, pmMotion, pmShadow, pmSurfaceTone } from '@/tokens'



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

        'rounded-2xl border border-border/70 bg-gradient-to-b from-surface to-surface/96',

        pmSurfaceTone[variant],

        shadow !== 'none' && pmShadow[shadow],

        interactive &&

          cn(

            pmMotion.base,

            pmInteraction.card,

            'hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated hover:pm-shadow-panel',

          ),

        className,

      )}

      {...props}

    >

      {children}

    </div>

  )

}

