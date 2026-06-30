import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmEmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  size?: 'default' | 'compact'
}

export function PmEmptyState({
  title,
  description,
  icon,
  action,
  className,
  size = 'default',
}: PmEmptyStateProps) {
  return (
    <PmSurface
      data-slot="pm-empty-state"
      variant="muted"
      className={cn(
        'flex flex-col items-center justify-center border-dashed text-center',
        size === 'default' ? 'px-6 py-16' : 'px-4 py-10',
        className,
      )}
    >
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <h2 className={size === 'default' ? pmTypography.h3 : pmTypography.label}>
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            pmTypography.bodySm,
            'mt-2 max-w-md text-muted-foreground',
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </PmSurface>
  )
}
