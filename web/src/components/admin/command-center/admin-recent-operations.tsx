import { Link } from 'react-router-dom'
import type { AdminRecentOperation } from '@/domain/admin/read-models/types.ts'
import { formatDate } from '@/lib/format'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminRecentOperationsProps = {
  readonly items: readonly AdminRecentOperation[]
  readonly className?: string
}

export function AdminRecentOperations({ items, className }: AdminRecentOperationsProps) {
  return (
    <PmContentCard
      title="Recent Operations"
      description="Meaningful operational events from the live audit trail."
      className={className}
      actions={
        <Link
          to="/admin/audit"
          className={cn(pmTypography.caption, 'text-primary underline-offset-4 hover:underline')}
        >
          Full audit
        </Link>
      }
    >
      {items.length === 0 ? (
        <PmEmptyState title="No recent operations" size="compact" />
      ) : (
        <ul className="divide-y divide-border/50" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className={cn(
                  'flex flex-col gap-1 py-2.5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="min-w-0 space-y-0.5">
                  <p className={cn(pmTypography.label, 'truncate')}>{item.title}</p>
                  <p className={cn(pmTypography.caption, 'text-muted-foreground truncate')}>
                    {item.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PmBadge tone="muted" size="sm">
                    {item.kind}
                  </PmBadge>
                  <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PmContentCard>
  )
}
