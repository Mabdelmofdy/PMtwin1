import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { pmInteraction, pmLayout, pmMotion } from '@/tokens'
import { PmSurface, type PmSurfaceVariant } from '@/components/ui/pm-surface'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type PmCardVariant = PmSurfaceVariant | 'interactive'

export type PmCardProps = ComponentProps<'div'> & {
  variant?: PmCardVariant
  padding?: 'default' | 'dense' | 'none'
  /** Use shadcn Card composition (header/content slots) when true */
  composed?: boolean
}

const paddingClasses = {
  default: 'pm-card-padding',
  dense: 'p-3',
  none: 'p-0',
} as const

export function PmCard({
  variant = 'card',
  padding = 'default',
  composed = false,
  className,
  children,
  ...props
}: PmCardProps) {
  if (composed) {
    return (
      <Card
        data-slot="pm-card"
        className={cn(
          'rounded-2xl border-border/70 ring-0 pm-shadow-card',
          variant === 'interactive' &&
            cn(
              pmMotion.base,
              pmInteraction.card,
              'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elevated hover:pm-shadow-panel',
            ),
          className,
        )}
        {...props}
      >
        {children}
      </Card>
    )
  }

  const surfaceVariant: PmSurfaceVariant =
    variant === 'interactive' ? 'card' : variant

  return (
    <PmSurface
      data-slot="pm-card"
      variant={surfaceVariant}
      shadow="card"
      interactive={variant === 'interactive'}
      className={cn(paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </PmSurface>
  )
}

export {
  CardHeader as PmCardHeader,
  CardTitle as PmCardTitle,
  CardDescription as PmCardDescription,
  CardAction as PmCardAction,
  CardContent as PmCardContent,
  CardFooter as PmCardFooter,
}

export function PmCardSection({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="pm-card-section"
      className={cn(pmLayout.formGap, 'flex flex-col', className)}
      {...props}
    />
  )
}
