import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import type { AppNotification } from '@/types/domain.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function formatRelativeTime(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AppNotification
  onMarkRead: (id: string) => void
}) {
  const content = (
    <div className="flex gap-3 p-3">
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${
          notification.read ? 'bg-transparent' : 'bg-primary'
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug">{notification.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read ? (
        <Button
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
        </Button>
      ) : null}
    </div>
  )

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        className="group block cursor-pointer rounded-lg transition-colors hover:bg-muted/60"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="group rounded-lg transition-colors hover:bg-muted/60">
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

  const markRead = (id: string) => {
    notificationsApi.markRead(id)
  }

  const markAllRead = () => {
    if (user?.id) notificationsApi.markAllRead(user.id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
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
                className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {unreadCount} new
              </Badge>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="xs"
              className="cursor-pointer text-xs"
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <Separator />
        <ScrollArea className="h-[min(24rem,60vh)]">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full cursor-pointer"
            asChild
          >
            <Link to="/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
