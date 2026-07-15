import type { AppNotification } from '@/types/domain.ts'
import {
  notificationRepository,
  userSettingsRepository,
} from '@/repositories/index.ts'
import type { InAppNotificationCategories } from '@/domain/user-settings/types.ts'

export function resolveNotificationCategory(
  type: string | undefined,
): keyof InAppNotificationCategories {
  const value = type ?? ''
  if (value.includes('match')) return 'matching'
  if (value.includes('application')) return 'applications'
  if (value.includes('negotiation')) return 'negotiations'
  if (
    value.includes('deal') ||
    value.includes('contract') ||
    value.includes('commercial_agreement')
  ) {
    return 'commercial'
  }
  return 'account'
}

export function shouldDeliverInAppNotification(
  userId: string,
  type: string | undefined,
): boolean {
  const settings = userSettingsRepository.get(userId)
  return settings.notifications.inApp[resolveNotificationCategory(type)]
}

export const notificationService = {
  getNotificationsForUser(userId: string): AppNotification[] {
    return notificationRepository.getByUserId(userId)
  },

  getUnreadCount(userId: string): number {
    return notificationRepository
      .getByUserId(userId)
      .filter((n) => !n.read).length
  },

  createNotification(
    data: Omit<AppNotification, 'id' | 'createdAt'>,
  ): AppNotification | undefined {
    const recipientId = data.recipientUserId ?? data.userId
    if (!shouldDeliverInAppNotification(recipientId, data.type)) {
      return undefined
    }
    return notificationRepository.create(data)
  },

  updateNotification(
    id: string,
    patch: Partial<AppNotification>,
  ): void {
    notificationRepository.update(id, patch)
  },

  deleteNotification(id: string): void {
    notificationRepository.delete(id)
  },

  markAsRead(notificationId: string): void {
    notificationRepository.markRead(notificationId)
  },

  markAllAsRead(userId: string): void {
    notificationRepository.markAllRead(userId)
  },
}
