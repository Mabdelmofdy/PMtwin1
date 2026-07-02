/**
 * Best-effort lifecycle notifications for command handlers.
 *
 * Emission is additive and non-fatal: when no sink is provided (e.g. unit tests)
 * nothing happens, and any error while writing a notification is swallowed so it
 * can never fail the underlying command.
 */

import type { AppNotification } from '@/types/domain.ts'

export type NotificationSink = {
  create(data: Omit<AppNotification, 'id' | 'createdAt'>): unknown
}

export type NotifiableParticipant = { readonly userId?: string }

export type EmitParticipantNotificationsInput = {
  readonly participants: readonly NotifiableParticipant[]
  readonly excludeUserId?: string
  readonly type: string
  readonly title: string
  readonly message: string
  readonly link?: string
  readonly entityType: string
  readonly entityId: string
}

export function emitParticipantNotifications(
  sink: NotificationSink | null | undefined,
  input: EmitParticipantNotificationsInput,
): void {
  if (!sink || typeof sink.create !== 'function') return
  try {
    const seen = new Set<string>()
    for (const participant of input.participants) {
      const userId = participant.userId
      if (!userId || userId === input.excludeUserId || seen.has(userId)) {
        continue
      }
      seen.add(userId)
      sink.create({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        read: false,
        entityType: input.entityType,
        entityId: input.entityId,
      })
    }
  } catch {
    // best-effort: notifications must never fail a command
  }
}
