import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck } from 'lucide-react'
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
  PmTableFilter,
  PmTableToolbar,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type ReadFilter = 'all' | 'unread' | 'read'

export function NotificationsListSection() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const userId = user?.id ?? 'seed-user-001'
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')

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
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead(userId)
  }

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
        description="Alerts for matches, applications, deals, and messages will appear here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PmBadge tone={unreadCount > 0 ? 'warning' : 'success'} size="sm">
          {unreadCount} unread
        </PmBadge>
        {unreadCount > 0 ? (
          <PmButton size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4" aria-hidden />
            Mark all read
          </PmButton>
        ) : null}
      </div>

      <PmDataTable
        density="compact"
        columns={columns}
        data={filtered}
        getRowId={(n) => n.id}
        caption="Notifications"
        toolbar={
          <PmTableToolbar
            filters={
              <PmTableFilter activeCount={readFilter !== 'all' ? 1 : 0} label="Filter">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Read state</label>
                  <Select value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread only</SelectItem>
                      <SelectItem value="read">Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PmTableFilter>
            }
          />
        }
        empty={
          <PmTableEmpty
            variant="no-results"
            title="No notifications match this filter"
            description="Try changing the read state filter."
          />
        }
      />

      <div className="space-y-4 lg:hidden">
        {groups.map((group) => (
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
                        <p className={cn('text-sm font-medium', !n.read && 'text-foreground')}>
                          {n.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
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
        ))}
      </div>
    </div>
  )
}
