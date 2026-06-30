import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'

export type WorkspaceHeaderProps = {
  title: string
  subtitle?: string
  label?: string
  status?: ReactNode
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  className?: string
  bordered?: boolean
}

/**
 * Reusable workspace page header for entity pages (migration target).
 * Shell uses AppHeader; pages adopt this in later phases.
 */
export function WorkspaceHeader({
  title,
  subtitle,
  label,
  status,
  primaryAction,
  secondaryActions,
  className,
  bordered = true,
}: WorkspaceHeaderProps) {
  return (
    <header
      data-slot="workspace-header"
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between',
        bordered && 'border-b border-border/60 pb-6',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {label ? (
          <p className={cn(pmTypography.label, 'text-primary')}>{label}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={pmTypography.h1}>{title}</h1>
          {status}
        </div>
        {subtitle ? (
          <p className={cn(pmTypography.bodySm, 'max-w-2xl text-muted-foreground')}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {primaryAction || secondaryActions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      ) : null}
    </header>
  )
}
