import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Briefcase,
  FileText,
  Handshake,
  Heart,
  MessageCircle,
} from 'lucide-react'
import type { AppNotification } from '@/types/domain.ts'
import { formatRelativeTime } from '@/lib/format'

export type NotificationGroupKey = 'today' | 'yesterday' | 'earlier'

export type NotificationGroup = {
  key: NotificationGroupKey
  label: string
  items: AppNotification[]
}

const iconByType: Record<string, LucideIcon> = {
  match: Heart,
  post_match: Heart,
  opportunity: Briefcase,
  deal: Handshake,
  contract: FileText,
  message: MessageCircle,
  application: Briefcase,
}

export function resolveNotificationIcon(
  notification: AppNotification,
): LucideIcon {
  const type = (notification.type ?? notification.entityType ?? '')
    .toString()
    .toLowerCase()
  for (const [key, icon] of Object.entries(iconByType)) {
    if (type.includes(key)) return icon
  }
  return Bell
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function groupNotifications(
  notifications: readonly AppNotification[],
): NotificationGroup[] {
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const buckets: Record<NotificationGroupKey, AppNotification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  }

  for (const notification of notifications) {
    const created = new Date(notification.createdAt)
    if (created >= todayStart) {
      buckets.today.push(notification)
    } else if (created >= yesterdayStart) {
      buckets.yesterday.push(notification)
    } else {
      buckets.earlier.push(notification)
    }
  }

  return (
    [
      { key: 'today' as const, label: 'Today', items: buckets.today },
      { key: 'yesterday' as const, label: 'Yesterday', items: buckets.yesterday },
      { key: 'earlier' as const, label: 'Earlier', items: buckets.earlier },
    ] as const
  ).filter((group) => group.items.length > 0)
}

export { formatRelativeTime as formatNotificationTime }
