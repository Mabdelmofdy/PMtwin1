import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  emitParticipantNotifications,
  resolveNotificationRecipientIds,
  type NotificationSink,
} from '@/commands/handlers/lifecycle-notifications.ts'
import type { AppNotification } from '@/types/domain.ts'

class CollectingSink implements NotificationSink {
  readonly created: Omit<AppNotification, 'id' | 'createdAt'>[] = []
  create(data: Omit<AppNotification, 'id' | 'createdAt'>): unknown {
    this.created.push(data)
    return data
  }
}

describe('lifecycle notifications', () => {
  it('fans out to userId and representativeUserIds', () => {
    const sink = new CollectingSink()
    emitParticipantNotifications(sink, {
      participants: [
        {
          userId: 'company-party-proxy',
          representativeUserIds: ['employee-a', 'employee-b'],
        },
        { userId: 'employee-a' },
      ],
      type: 'new_match_found',
      title: 'New match found',
      message: 'A new match was discovered for you.',
      link: '/matches/pm-1',
      entityType: 'post_match',
      entityId: 'pm-1',
    })

    const recipients = sink.created.map((n) => n.userId).sort()
    assert.deepEqual(recipients, ['company-party-proxy', 'employee-a', 'employee-b'])
    assert.ok(sink.created.every((n) => n.recipientUserId === n.userId))
  })

  it('respects excludeUserId across fan-out', () => {
    const sink = new CollectingSink()
    emitParticipantNotifications(sink, {
      participants: [
        {
          userId: 'actor',
          representativeUserIds: ['actor', 'partner'],
        },
      ],
      excludeUserId: 'actor',
      type: 'match_accepted',
      title: 'Match accepted',
      message: 'A participant accepted the match.',
      entityType: 'post_match',
      entityId: 'pm-2',
    })

    assert.deepEqual(
      sink.created.map((n) => n.userId),
      ['partner'],
    )
  })

  it('resolveNotificationRecipientIds dedupes and skips blanks', () => {
    assert.deepEqual(
      resolveNotificationRecipientIds({
        userId: 'u1',
        representativeUserIds: ['u1', ' u2 ', '', 'u3'],
      }),
      ['u1', 'u2', 'u3'],
    )
  })
})
