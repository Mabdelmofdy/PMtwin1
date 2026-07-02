import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { AppNotification } from '@/types/domain.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { useAuth } from '@/providers/auth-provider'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import {
  formatNotificationTime,
  groupNotifications,
  resolveNotificationIcon,
} from '@/components/layout/notification-display'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import {
  PmDataTable,
  PmTableEmpty,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

export type ReadFilter = 'all' | 'unread' | 'read'

export type NotificationsListSectionProps = {
  readFilter: ReadFilter
}

export function NotificationsListSection({ readFilter }: NotificationsListSectionProps) {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const userId = user?.id ?? 'seed-user-001'

  const notifications = useMemo(
    () => notificationsApi.list(userId),
    [userId, version],
  )

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === 'unread') return !n.read
      if (readFilter === 'read') return n.read
      return true
    })
  }, [notifications, readFilter])

  const groups = useMemo(() => groupNotifications(filtered), [filtered])

  const columns: PmDataTableColumn<AppNotification>[] = [
    {
      id: 'title',
      label: 'Notification',
      cell: (n) => (
        <Link
          to={n.link ?? '/notifications'}
          className={cn('font-medium hover:text-primary', !n.read && 'text-foreground')}
        >
          {n.title}
        </Link>
      ),
    },
    {
      id: 'message',
      label: 'Message',
      cell: (n) => (
        <span className="line-clamp-1 text-muted-foreground">{n.message}</span>
      ),
    },
    {
      id: 'time',
      label: 'When',
      cell: (n) => formatNotificationTime(n.createdAt),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (n) => (
        <PmBadge tone={n.read ? 'muted' : 'primary'} size="sm">
          {n.read ? 'Read' : 'Unread'}
        </PmBadge>
      ),
    },
  ]

  if (notifications.length === 0) {
    return (
      <PmEmptyState
        title="No notifications"
        description="Alerts for matches, deals, negotiations, and messages will appear here."
      />
    )
  }

  return (
    <>
      <div className="hidden lg:block">
        <PmDataTable
          density="compact"
          columns={columns}
          data={filtered}
          getRowId={(n) => n.id}
          caption="Notifications"
          empty={
            <PmTableEmpty
              variant="no-results"
              title="No notifications match this filter"
              description="Try changing the read state filter."
            />
          }
        />
      </div>

      <div className="space-y-4 lg:hidden">
        {groups.length === 0 ? (
          <PmTableEmpty
            variant="no-results"
            title="No notifications match this filter"
            description="Try changing the read state filter."
          />
        ) : (
          groups.map((group) => (
            <PmContentCard key={group.key} title={group.label}>
              <ul className="divide-y divide-border/60">
                {group.items.map((n) => {
                  const Icon = resolveNotificationIcon(n)
                  return (
                    <li key={n.id}>
                      <Link
                        to={n.link ?? '/notifications'}
                        className="flex gap-3 py-3 transition-colors hover:bg-surface-muted/40"
                      >
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg',
                            n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn(pmTypography.bodySm, 'font-medium', !n.read && 'text-foreground')}>
                            {n.title}
                          </p>
                          <p className={cn('line-clamp-2', pmTypography.caption, 'text-muted-foreground')}>{n.message}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatNotificationTime(n.createdAt)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </PmContentCard>
          ))
        )}
      </div>
    </>
  )
}
