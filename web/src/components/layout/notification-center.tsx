import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import type { AppNotification } from '@/types/domain.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { PmButton } from '@/components/ui/pm-button'
import { PmNavBadge } from '@/components/ui/pm-badge'
import { PmEmptyState } from '@/components/ui/pm-empty-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { pmTypography } from '@/tokens'
import {
  formatNotificationTime,
  groupNotifications,
  resolveNotificationIcon,
} from '@/components/layout/notification-display'
import { cn } from '@/lib/utils'

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AppNotification
  onMarkRead: (id: string) => void
}) {
  const Icon = resolveNotificationIcon(notification)

  const content = (
    <div className="flex gap-3 p-3">
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <p className={cn(pmTypography.label, 'flex-1 leading-snug')}>{notification.title}</p>
          {!notification.read ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
          ) : null}
        </div>
        <p className={cn(pmTypography.caption, 'line-clamp-2')}>
          {notification.message}
        </p>
        <p className={pmTypography.caption}>
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read ? (
        <PmButton
          variant="ghost"
          size="icon-xs"
          className="shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Mark as read"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onMarkRead(notification.id)
          }}
        >
          <CheckCheck className="size-3.5" />
        </PmButton>
      ) : null}
    </div>
  )

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        className="group block cursor-pointer rounded-lg transition-colors hover:bg-muted/50"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="group rounded-lg transition-colors hover:bg-muted/50">
      {content}
    </div>
  )
}

export function NotificationCenter() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const [open, setOpen] = useState(false)
  const notifications = useMemo(
    () => notificationsApi.list(user?.id ?? 'seed-user-001'),
    [user?.id, version],
  )

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const groups = useMemo(
    () => groupNotifications(notifications),
    [notifications],
  )

  const markRead = (id: string) => {
    notificationsApi.markRead(id)
  }

  const markAllRead = () => {
    if (user?.id) notificationsApi.markAllRead(user.id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <PmButton
          variant="ghost"
          size="icon-sm"
          className="relative cursor-pointer"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Bell className="size-4" aria-hidden />
          <AnimatePresence>
            {unreadCount > 0 ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  'absolute -top-0.5 -end-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 font-semibold text-primary-foreground',
                  pmTypography.badge,
                )}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </PmButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className={cn(pmTypography.bodySm, 'font-semibold')}>Notifications</h2>
            {unreadCount > 0 ? (
              <PmNavBadge>{unreadCount} new</PmNavBadge>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <PmButton
              variant="ghost"
              size="xs"
              className={cn('cursor-pointer', pmTypography.caption)}
              onClick={markAllRead}
            >
              Mark all read
            </PmButton>
          ) : null}
        </div>
        <Separator />
        <ScrollArea className="h-[min(24rem,60vh)]">
          {notifications.length === 0 ? (
            <PmEmptyState
              size="compact"
              title="You're all caught up"
              description="New matches, commercial agreements, and messages will appear here."
              icon={<Bell className="size-5" aria-hidden />}
              className="m-2 border-0 bg-transparent shadow-none"
            />
          ) : (
            <div className="space-y-3 p-2">
              {groups.map((group) => (
                <section key={group.key}>
                  <p className={cn(pmTypography.overline, 'px-2 py-1 text-muted-foreground')}>
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={markRead}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <PmButton
            variant="ghost"
            size="sm"
            className="w-full cursor-pointer"
            asChild
          >
            <Link to="/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </PmButton>
        </div>
      </PopoverContent>
    </Popover>
  )
}
