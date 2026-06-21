import type { AppNotification } from '@/types/domain.ts'
import { notificationRepository } from '@/repositories/index.ts'

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
  ): AppNotification {
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
