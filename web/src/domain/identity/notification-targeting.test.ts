import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterNotificationsForViewer } from './notification-targeting.ts'

describe('notification targeting', () => {
  it('hides workspace-targeted notifications from other workspaces', () => {
    const items = filterNotificationsForViewer(
      [
        {
          id: 'n1',
          userId: 'u1',
          recipientWorkspaceId: 'ws-a',
          title: 'A',
          message: 'm',
          read: false,
          createdAt: '2020-01-01T00:00:00.000Z',
        },
        {
          id: 'n2',
          userId: 'u1',
          recipientWorkspaceId: 'ws-b',
          title: 'B',
          message: 'm',
          read: false,
          createdAt: '2020-01-01T00:00:00.000Z',
        },
      ],
      { userId: 'u1', activeWorkspaceId: 'ws-a' },
    )
    assert.deepEqual(
      items.map((n) => n.id),
      ['n1'],
    )
  })
})
