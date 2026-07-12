import { Link } from 'react-router-dom'
import type { AdminInboxItem, AdminSeverity } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminInboxViewTab = {
  readonly id: string
  readonly label: string
}

export type AdminInboxListProps = {
  readonly items: readonly AdminInboxItem[]
  readonly viewTabs?: readonly AdminInboxViewTab[]
  readonly activeViewId?: string
  readonly onViewChange?: (id: string) => void
  readonly title?: string
  readonly className?: string
}

function severityTone(severity: AdminSeverity): 'danger' | 'warning' | 'muted' | 'info' {
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

export function AdminInboxList({
  items,
  viewTabs,
  activeViewId,
  onViewChange,
  title = 'Inbox',
  className,
}: AdminInboxListProps) {
  return (
    <PmContentCard
      title={title}
      className={className}
      actions={
        viewTabs && viewTabs.length > 0 ? (
          <div role="tablist" aria-label="Inbox views" className="flex flex-wrap gap-2">
            {viewTabs.map((tab) => {
              const active = tab.id === activeViewId
              return (
                <PmButton
                  key={tab.id}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onViewChange?.(tab.id)}
                >
                  {tab.label}
                </PmButton>
              )
            })}
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <PmEmptyState
          title="Inbox is empty"
          description="No items match the current view."
          size="compact"
        />
      ) : (
        <ul className="divide-y divide-border/50" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.destinationHref}
                className={cn(
                  'flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between',
                  'transition-colors hover:bg-muted/40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="min-w-0 space-y-1">
                  <p className={cn(pmTypography.label, 'truncate')}>{item.title}</p>
                  <p className={cn(pmTypography.caption, 'text-muted-foreground line-clamp-2')}>
                    {item.summary}
                  </p>
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {item.entityType} · {item.itemType}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <PmBadge tone={severityTone(item.severity)} size="sm">
                    {item.severity}
                  </PmBadge>
                  <PmBadge tone="muted" size="sm">
                    {item.sla}
                  </PmBadge>
                  {item.completed ? (
                    <PmBadge tone="success" size="sm">
                      done
                    </PmBadge>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PmContentCard>
  )
}
