import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

export type PmPageHeaderProps = {
  label?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  bordered?: boolean
}

export function PmPageHeader({
  label,
  title,
  description,
  actions,
  className,
  bordered = true,
}: PmPageHeaderProps) {
  return (
    <header
      data-slot="pm-page-header"
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        bordered && 'border-b border-border/60 pb-6',
        className,
      )}
    >
      <div className="space-y-1">
        {label ? (
          <p className={cn(pmTypography.label, 'text-primary')}>{label}</p>
        ) : null}
        <h1 className={pmTypography.h1}>{title}</h1>
        {description ? (
          <p className={cn(pmTypography.bodySm, 'max-w-2xl text-muted-foreground md:text-base')}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
