import { Link } from 'react-router-dom'
import type { AdminRelatedObject } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminRelatedObjectsProps = {
  readonly groups: readonly AdminRelatedObject[]
  readonly title?: string
  readonly className?: string
}

export function AdminRelatedObjects({
  groups,
  title = 'Related objects',
  className,
}: AdminRelatedObjectsProps) {
  return (
    <PmContentCard title={title} className={className}>
      {groups.length === 0 ? (
        <PmEmptyState
          title="No related objects"
          description="There are no linked records for this entity."
          size="compact"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {groups.map((group) => (
            <li key={`${group.entityType}-${group.href}`}>
              <Link
                to={group.href}
                className={cn(
                  'block rounded-xl border border-border/60 bg-gradient-to-b from-card to-surface p-4 transition-colors',
                  'hover:border-primary/40 hover:bg-muted/30',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className={pmTypography.label}>{group.label}</p>
                  <p className={pmTypography.stat}>{group.count}</p>
                </div>
                {group.statusSummary ? (
                  <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                    {group.statusSummary}
                  </p>
                ) : group.count === 0 && group.emptyLabel ? (
                  <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                    {group.emptyLabel}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PmContentCard>
  )
}
