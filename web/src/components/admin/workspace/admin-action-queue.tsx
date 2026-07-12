import { Link } from 'react-router-dom'
import type { AdminInboxItem } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminActionQueueProps = {
  readonly items: readonly AdminInboxItem[]
  readonly title?: string
  readonly emptyTitle?: string
  readonly emptyDescription?: string
  readonly className?: string
}

function severityTone(severity: AdminInboxItem['severity']): 'danger' | 'warning' | 'muted' | 'info' {
  switch (severity) {
    case 'critical':
      return 'danger'
    case 'high':
    case 'medium':
      return 'warning'
    case 'low':
      return 'muted'
    default:
      return 'info'
  }
}

export function AdminActionQueue({
  items,
  title = 'Action queue',
  emptyTitle = 'Queue is clear',
  emptyDescription = 'There are no pending admin actions in this workspace.',
  className,
}: AdminActionQueueProps) {
  return (
    <PmContentCard title={title} className={className}>
      {items.length === 0 ? (
        <PmEmptyState title={emptyTitle} description={emptyDescription} size="compact" />
      ) : (
        <ul className="divide-y divide-border/50" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.destinationHref}
                className={cn(
                  'flex flex-col gap-1.5 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="min-w-0 space-y-1">
                  <p className={cn(pmTypography.label, 'truncate')}>{item.title}</p>
                  <p className={cn(pmTypography.caption, 'text-muted-foreground line-clamp-2')}>
                    {item.summary}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <PmBadge tone={severityTone(item.severity)} size="sm">
                    {item.severity}
                  </PmBadge>
                  <PmBadge tone="muted" size="sm">
                    {item.priority}
                  </PmBadge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PmContentCard>
  )
}
