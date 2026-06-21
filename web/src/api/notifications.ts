import type { AppNotification } from '@/types/domain.ts'
import { notificationService } from '@/services/notification-service.ts'

export const notificationsApi = {
  list: (userId: string) => notificationService.getNotificationsForUser(userId),
  unreadCount: (userId: string) => notificationService.getUnreadCount(userId),
  create: (data: Omit<AppNotification, 'id' | 'createdAt'>) =>
    notificationService.createNotification(data),
  update: (id: string, patch: Partial<AppNotification>) =>
    notificationService.updateNotification(id, patch),
  delete: (id: string) => notificationService.deleteNotification(id),
  markRead: (id: string) => notificationService.markAsRead(id),
  markAllRead: (userId: string) => notificationService.markAllAsRead(userId),
}
