import type { ReactNode } from 'react'
import { PmPage, PmPageHeader, PmBadge } from '@/components/ui/pm-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminEntityDetailShellProps = {
  readonly title: string
  readonly description?: string
  readonly label?: string
  readonly statusBadge?: ReactNode
  readonly statusSummary?: ReactNode
  readonly primaryActions?: ReactNode
  readonly overview?: ReactNode
  readonly tabs?: ReactNode
  readonly timeline?: ReactNode
  readonly related?: ReactNode
  readonly audit?: ReactNode
  readonly notes?: ReactNode
  readonly attachments?: ReactNode
  readonly history?: ReactNode
  readonly headerActions?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
}

/**
 * Consistent entity detail layout:
 * Header → Status → Primary Actions → Overview → Tabs → Timeline → Related → Audit → Notes → Attachments → History
 */
export function AdminEntityDetailShell({
  title,
  description,
  label = 'Admin',
  statusBadge,
  statusSummary,
  primaryActions,
  overview,
  tabs,
  timeline,
  related,
  audit,
  notes,
  attachments,
  history,
  headerActions,
  children,
  className,
}: AdminEntityDetailShellProps) {
  return (
    <PmPage
      header={
        <PmPageHeader
          label={label}
          title={title}
          description={description}
          badges={statusBadge}
          actions={headerActions}
        />
      }
      className={className}
    >
      <div className="flex flex-col gap-4">
        {statusSummary ? (
          <PmContentCard title="Status summary" className="border-border/50">
            {statusSummary}
          </PmContentCard>
        ) : null}

        {primaryActions ? (
          <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 backdrop-blur">
            {primaryActions}
          </div>
        ) : null}

        {overview}

        {tabs}

        {children}

        <div className="grid gap-4 lg:grid-cols-2">
          {timeline}
          {related}
        </div>

        {audit}
        {notes}
        {attachments}
        {history}
      </div>
    </PmPage>
  )
}

export type AdminStatusSummaryItem = {
  readonly label: string
  readonly value: ReactNode
}

export function AdminStatusSummaryRow({
  items,
}: {
  readonly items: readonly AdminStatusSummaryItem[]
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>{item.label}</dt>
          <dd className={cn(pmTypography.label, 'mt-0.5')}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AdminEntitySectionCard({
  title,
  description,
  children,
  className,
}: {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <PmContentCard title={title} description={description} className={className}>
      {children}
    </PmContentCard>
  )
}

export { PmBadge as AdminDetailBadge }
