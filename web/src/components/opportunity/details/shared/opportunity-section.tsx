import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function OpportunityEmptyState({
  title,
  description,
  action,
  className,
}: {
  readonly title: string
  readonly description?: string
  readonly action?: ReactNode
  readonly className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border border-dashed border-border/70 bg-surface-muted/20 px-4 py-8 text-center',
        className,
      )}
    >
      <p className={cn(pmTypography.label, 'text-foreground')}>{title}</p>
      {description ? (
        <p className={cn(pmTypography.bodySm, 'mt-1 text-muted-foreground')}>{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function OpportunityRestrictedState({
  title = 'Restricted',
  description = 'This information is available to authorized participants only.',
  className,
}: {
  readonly title?: string
  readonly description?: string
  readonly className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        'rounded-lg border border-border/60 bg-muted/30 px-4 py-6 text-center',
        className,
      )}
    >
      <p className={cn(pmTypography.label, 'text-foreground')}>{title}</p>
      <p className={cn(pmTypography.bodySm, 'mt-1 text-muted-foreground')}>{description}</p>
    </div>
  )
}

export function OpportunitySection({
  title,
  description,
  children,
  className,
  id,
}: {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly className?: string
  readonly id?: string
}) {
  return (
    <section id={id} className={cn('space-y-3', className)}>
      <div>
        <h3 className={cn(pmTypography.h3, 'text-foreground')}>{title}</h3>
        {description ? (
          <p className={cn(pmTypography.bodySm, 'mt-0.5 text-muted-foreground')}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
