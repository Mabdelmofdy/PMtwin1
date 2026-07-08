import type { AppNotification } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { BaseRepository } from './base-repository.ts'
import { mergeSeedWithOverrides } from './seed-override-merge.ts'

export class NotificationRepository extends BaseRepository<AppNotification> {
  constructor(
    storage: IStorageAdapter,
    loadSeed: () => AppNotification[],
  ) {
    super(storage, 'notifications', loadSeed)
  }

  override getAll(): AppNotification[] {
    const overrides = this.readOverrides()
    return mergeSeedWithOverrides({
      seed: this.loadSeed(),
      patches: overrides.notifications as Record<string, Partial<AppNotification>> | undefined,
      newItems: (overrides.newNotifications ?? []) as AppNotification[],
      deletedIds: overrides.deletedNotifications ?? [],
    })
  }

  getByUserId(userId: string): AppNotification[] {
    return this.getAll().filter((n) => n.userId === userId)
  }

  create(
    data: Omit<AppNotification, 'id' | 'createdAt'>,
  ): AppNotification {
    const overrides = this.readOverrides()
    const notification: AppNotification = {
      ...data,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    const existing =
      (overrides.newNotifications ?? []) as AppNotification[]
    overrides.newNotifications = [
      ...existing,
      notification,
    ] as typeof overrides.newNotifications
    this.writeOverrides(overrides)
    return notification
  }

  update(id: string, patch: Partial<AppNotification>): void {
    const overrides = this.readOverrides()
    overrides.notifications = {
      ...overrides.notifications,
      [id]: { ...overrides.notifications?.[id], ...patch },
    }
    this.writeOverrides(overrides)
  }

  delete(id: string): void {
    const overrides = this.readOverrides()
    overrides.deletedNotifications = [
      ...(overrides.deletedNotifications ?? []),
      id,
    ]
    this.writeOverrides(overrides)
  }

  markRead(id: string): void {
    this.update(id, { read: true } as Partial<AppNotification>)
  }

  markAllRead(userId: string): void {
    const notifications = this.getByUserId(userId)
    const overrides = this.readOverrides()
    const patches = { ...overrides.notifications }
    for (const n of notifications) {
      if (!n.read) {
        patches[n.id] = { ...patches[n.id], read: true }
      }
    }
    overrides.notifications = patches
    this.writeOverrides(overrides)
  }
}
