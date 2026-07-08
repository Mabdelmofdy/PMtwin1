import { useMemo, useState } from 'react'
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
  PmTableFilter,
  PmTablePagination,
  PmTableToolbar,
  resolveListEmptyState,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type ReadFilter = 'all' | 'unread' | 'read'

const READ_FILTER_LABELS: Record<ReadFilter, string> = {
  all: 'All',
  unread: 'Unread only',
  read: 'Read only',
}

export type NotificationsListFilters = ReturnType<typeof useNotificationsListFilters>

export type NotificationsListSectionProps = {
  showToolbar?: boolean
  showPagination?: boolean
  /** When provided, filter/pagination state is controlled externally (browse page). */
  filters?: NotificationsListFilters
}

export function useNotificationsListFilters(userId: string) {
  const version = useDataStoreVersion()
  const [readFilter, setReadFilterState] = useState<ReadFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(12)

  const notifications = useMemo(
    () => notificationsApi.list(userId),
    [userId, version],
  )

  const setReadFilter = (value: ReadFilter) => {
    setReadFilterState(value)
    setPage(1)
  }
  const setPageSize = (size: number) => {
    setPageSizeState(size)
    setPage(1)
  }

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === 'unread') return !n.read
      if (readFilter === 'read') return n.read
      return true
    })
  }, [notifications, readFilter])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const listEmpty = resolveListEmptyState({
    hasSourceData: notifications.length > 0,
    hasActiveFilters: readFilter !== 'all',
    firstRun: {
      title: 'No notifications',
      description: 'Alerts for matches, commercial agreements, negotiations, and messages will appear here.',
    },
    filtered: {
      title: 'No notifications match this filter',
      description: 'Try changing the read state filter.',
    },
  })

  const clearAllFilters = () => {
    setReadFilterState('all')
    setPage(1)
  }

  return {
    readFilter,
    setReadFilter,
    notifications,
    filtered,
    paged,
    totalItems,
    safePage,
    page,
    setPage,
    pageSize,
    setPageSize,
    listEmpty,
    clearAllFilters,
  }
}

export type NotificationsBrowseToolbarProps = Pick<
  NotificationsListFilters,
  'readFilter' | 'setReadFilter'
>

/** Read-state filter for notifications browse — composed inside `PmBrowseToolbar`. */
export function NotificationsBrowseToolbar({
  readFilter,
  setReadFilter,
}: NotificationsBrowseToolbarProps) {
  return (
    <PmTableToolbar
      filters={
        <PmTableFilter activeCount={readFilter !== 'all' ? 1 : 0} label="Filter">
          <div className="space-y-1.5">
            <label className={cn(pmTypography.bodySm, 'font-medium')}>Read state</label>
            <Select value={readFilter} onValueChange={(value) => setReadFilter(value as ReadFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(READ_FILTER_LABELS) as ReadFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {READ_FILTER_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PmTableFilter>
      }
    />
  )
}

export function NotificationsListSection({
  showToolbar = true,
  showPagination = true,
  filters: externalFilters,
}: NotificationsListSectionProps) {
  if (externalFilters) {
    return (
      <NotificationsListContent
        showToolbar={showToolbar}
        showPagination={showPagination}
        filters={externalFilters}
      />
    )
  }

  return <NotificationsListSectionWithFilters showToolbar={showToolbar} showPagination={showPagination} />
}

function NotificationsListSectionWithFilters({
  showToolbar,
  showPagination,
}: Omit<NotificationsListSectionProps, 'filters'>) {
  const { user } = useAuth()
  const userId = user?.id ?? 'seed-user-001'
  const filters = useNotificationsListFilters(userId)
  return (
    <NotificationsListContent
      showToolbar={showToolbar}
      showPagination={showPagination}
      filters={filters}
    />
  )
}

function NotificationsListEmpty({
  listEmpty,
  clearAllFilters,
}: {
  listEmpty: NotificationsListFilters['listEmpty']
  clearAllFilters: () => void
}) {
  if (listEmpty.branch === 'first-run') {
    return (
      <PmEmptyState
        title={listEmpty.config.title ?? 'No notifications'}
        description={listEmpty.config.description}
      />
    )
  }

  if (listEmpty.branch === 'filtered') {
    return (
      <PmTableEmpty
        variant="no-results"
        title={listEmpty.config.title}
        description={listEmpty.config.description}
        primaryAction={
          <PmButton size="sm" variant="outline" onClick={clearAllFilters}>
            Clear filter
          </PmButton>
        }
      />
    )
  }

  return (
    <PmTableEmpty
      variant="no-results"
      title="No notifications match this filter"
      description="Try changing the read state filter."
    />
  )
}

function NotificationsListContent({
  showToolbar = true,
  showPagination = true,
  filters,
}: {
  showToolbar?: boolean
  showPagination?: boolean
  filters: NotificationsListFilters
}) {
  const {
    readFilter,
    setReadFilter,
    paged,
    totalItems,
    safePage,
    pageSize,
    setPage,
    setPageSize,
    listEmpty,
    clearAllFilters,
  } = filters

  const groups = useMemo(() => groupNotifications(paged), [paged])

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

  return (
    <div data-slot="notifications-list" className="min-w-0 space-y-4">
      {showToolbar ? (
        <NotificationsBrowseToolbar readFilter={readFilter} setReadFilter={setReadFilter} />
      ) : null}
      {paged.length === 0 ? (
        <NotificationsListEmpty listEmpty={listEmpty} clearAllFilters={clearAllFilters} />
      ) : (
        <>
          <div className="hidden lg:block">
            <PmDataTable
              density="compact"
              columns={columns}
              data={paged}
              getRowId={(n) => n.id}
              caption="Notifications"
            />
          </div>

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
                              n.read
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                pmTypography.bodySm,
                                'font-medium',
                                !n.read && 'text-foreground',
                              )}
                            >
                              {n.title}
                            </p>
                            <p
                              className={cn(
                                'line-clamp-2',
                                pmTypography.caption,
                                'text-muted-foreground',
                              )}
                            >
                              {n.message}
                            </p>
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
        </>
      )}
      {showPagination && totalItems > 0 ? (
        <PmTablePagination
          page={safePage}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  )
}
