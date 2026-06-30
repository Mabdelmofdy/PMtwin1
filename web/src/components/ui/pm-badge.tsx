import type { ComponentProps, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { Badge } from '@/components/ui/badge'

const pmBadgeVariants = cva(
  cn(pmTypography.badge, 'inline-flex items-center rounded-md border border-transparent px-2 py-0.5'),
  {
    variants: {
      tone: {
        default: 'bg-primary/14 text-primary',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        muted: 'bg-muted/85 text-muted-foreground',
        success: 'bg-success/14 text-success',
        warning: 'bg-warning/14 text-warning',
        danger: 'bg-danger/14 text-danger',
        info: 'bg-info/14 text-info',
        neutral: 'bg-neutral/14 text-neutral',
        outline: 'border-border/80 bg-transparent text-foreground',
      },
      size: {
        sm: 'px-1.5 py-px text-[10px] leading-4',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-2.5 py-1 text-xs',
      },
      uppercase: {
        true: 'uppercase tracking-wide font-semibold',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'default',
      size: 'md',
      uppercase: false,
    },
  },
)

export type PmBadgeTone = NonNullable<VariantProps<typeof pmBadgeVariants>['tone']>

export type PmBadgeProps = ComponentProps<'span'> &
  VariantProps<typeof pmBadgeVariants> & {
    children?: ReactNode
  }

/** Semantic badge for status, categories, and match types. */
export function PmBadge({
  tone,
  size,
  uppercase,
  className,
  children,
  ...props
}: PmBadgeProps) {
  return (
    <span
      data-slot="pm-badge"
      data-tone={tone}
      className={cn(pmBadgeVariants({ tone, size, uppercase }), className)}
      {...props}
    >
      {children}
    </span>
  )
}

/** Wraps shadcn Badge for nav chips and counts — prefer PmBadge for semantic tones. */
export function PmNavBadge({
  className,
  ...props
}: ComponentProps<typeof Badge>) {
  return (
    <Badge
      data-slot="pm-nav-badge"
      variant="secondary"
      className={cn('h-5 px-1.5', pmTypography.badge, className)}
      {...props}
    />
  )
}

export { pmBadgeVariants }
