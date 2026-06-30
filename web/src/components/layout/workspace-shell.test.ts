import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveBreadcrumbHomeHref,
  resolveWorkspaceContext,
  getUserInitials,
} from '@/components/layout/workspace-display.ts'
import { Heart } from 'lucide-react'
import {
  groupNotifications,
  resolveNotificationIcon,
} from '@/components/layout/notification-display.ts'
import {
  clearRecentPages,
  readRecentPages,
  recordRecentPage,
} from '@/components/layout/recent-pages.ts'

describe('workspace-display', () => {
  it('derives user initials', () => {
    assert.equal(getUserInitials('Khalid Al-Harbi'), 'KA')
  })

  it('resolves admin workspace context', () => {
    const ctx = resolveWorkspaceContext('/admin/users', {
      isCompanyUser: false,
      isAdminArea: true,
    })
    assert.match(ctx.title, /Admin/)
    assert.equal(ctx.homeHref, '/admin')
  })

  it('resolves company dashboard context', () => {
    const ctx = resolveWorkspaceContext('/company-dashboard', {
      isCompanyUser: true,
      isAdminArea: false,
    })
    assert.equal(ctx.title, 'Company workspace')
  })

  it('resolves breadcrumb home for admin routes', () => {
    assert.equal(
      resolveBreadcrumbHomeHref('/admin/matching', false),
      '/admin',
    )
  })
})

describe('notification-display', () => {
  it('groups notifications by day buckets', () => {
    const now = new Date().toISOString()
    const groups = groupNotifications([
      {
        id: '1',
        userId: 'u1',
        title: 'Today',
        message: 'm',
        read: false,
        createdAt: now,
      },
    ])
    assert.equal(groups[0]?.key, 'today')
    assert.equal(groups[0]?.items.length, 1)
  })

  it('maps match notifications to heart icon', () => {
    const icon = resolveNotificationIcon({
      id: '1',
      userId: 'u1',
      type: 'match',
      title: 't',
      message: 'm',
      read: false,
      createdAt: new Date().toISOString(),
    })
    assert.equal(icon, Heart)
  })
})

describe('recent-pages', () => {
  it('records and reads recent pages in order', () => {
    clearRecentPages()
    recordRecentPage('/deals', 'Deals')
    const pages = recordRecentPage('/matches', 'Post-matches')
    assert.equal(pages[0]?.href, '/matches')
    assert.equal(readRecentPages()[1]?.href, '/deals')
    clearRecentPages()
  })
})
