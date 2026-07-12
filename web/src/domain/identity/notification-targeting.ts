import type { AppNotification } from '@/types/domain.ts'

/**
 * Workspace-aware notification visibility.
 * Company/workspace events may target workspace, party, user, or platform role.
 */
export function isNotificationVisibleToViewer(
  notification: AppNotification,
  viewer: {
    readonly userId?: string
    readonly activeWorkspaceId?: string
    readonly activePartyId?: string
    readonly platformRoles?: readonly string[]
  },
): boolean {
  if (
    notification.recipientWorkspaceId &&
    viewer.activeWorkspaceId &&
    notification.recipientWorkspaceId !== viewer.activeWorkspaceId
  ) {
    return false
  }
  if (
    notification.recipientPartyId &&
    viewer.activePartyId &&
    notification.recipientPartyId !== viewer.activePartyId
  ) {
    return false
  }
  if (
    notification.recipientPlatformRole &&
    !(viewer.platformRoles ?? []).includes(notification.recipientPlatformRole)
  ) {
    return false
  }
  if (notification.recipientUserId) {
    return notification.recipientUserId === viewer.userId
  }
  // Legacy: userId recipient
  if (notification.userId && viewer.userId) {
    return notification.userId === viewer.userId
  }
  return true
}

export function filterNotificationsForViewer(
  notifications: readonly AppNotification[],
  viewer: {
    readonly userId?: string
    readonly activeWorkspaceId?: string
    readonly activePartyId?: string
    readonly platformRoles?: readonly string[]
  },
): AppNotification[] {
  return notifications.filter((notification) =>
    isNotificationVisibleToViewer(notification, viewer),
  )
}
