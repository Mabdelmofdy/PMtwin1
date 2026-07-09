import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PlatformUser } from '@/types/domain.ts'
import {
  formatVettingSlaDisplay,
  resolveVettingReviewAnchor,
  resolveVettingSlaStatus,
  shouldEmitOverdueNotification,
  VETTING_SLA_CONFIG,
} from '@/lib/vetting-sla-service.ts'

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function pendingUser(createdAt: string): PlatformUser {
  return {
    id: 'u-1',
    email: 'user@test.com',
    role: 'user',
    status: 'pending_vetting',
    createdAt,
    profile: {},
  }
}

describe('vetting sla service', () => {
  it('marks queue entries at_risk after configured days', () => {
    const user = pendingUser(daysAgo(VETTING_SLA_CONFIG.atRiskDays))
    assert.equal(resolveVettingSlaStatus(user), 'at_risk')
  })

  it('marks queue entries overdue after SLA days', () => {
    const user = pendingUser(daysAgo(VETTING_SLA_CONFIG.overdueDays))
    assert.equal(resolveVettingSlaStatus(user), 'overdue')
    assert.equal(shouldEmitOverdueNotification(user), true)
  })

  it('returns on_track for active or rejected users', () => {
    assert.equal(
      resolveVettingSlaStatus({ ...pendingUser(daysAgo(30)), status: 'active' }),
      'on_track',
    )
    assert.equal(
      resolveVettingSlaStatus({ ...pendingUser(daysAgo(30)), status: 'rejected' }),
      'on_track',
    )
  })

  it('uses last resubmitted date before reviewedAt and createdAt', () => {
    const user = pendingUser(daysAgo(20))
    user.profile = {
      vetting: {
        reviewedAt: daysAgo(10),
        lastResubmittedAt: daysAgo(1),
      },
    }
    assert.equal(resolveVettingReviewAnchor(user), user.profile.vetting.lastResubmittedAt)
    assert.equal(resolveVettingSlaStatus(user), 'on_track')
  })

  it('keeps on_track before at-risk threshold', () => {
    const user = pendingUser(daysAgo(VETTING_SLA_CONFIG.atRiskDays - 1))
    assert.equal(resolveVettingSlaStatus(user), 'on_track')
    assert.equal(shouldEmitOverdueNotification(user), false)
  })

  it('formats relative and target SLA labels for display', () => {
    const overdueUser = pendingUser(daysAgo(VETTING_SLA_CONFIG.overdueDays + 5))
    const overdueDisplay = formatVettingSlaDisplay(overdueUser, 'overdue')
    assert.match(overdueDisplay.relativeLabel, /overdue/)
    assert.equal(overdueDisplay.targetLabel, `Target SLA: ${VETTING_SLA_CONFIG.overdueDays} days`)

    const onTrackUser = pendingUser(daysAgo(1))
    const onTrackDisplay = formatVettingSlaDisplay(onTrackUser, 'on_track')
    assert.match(onTrackDisplay.relativeLabel, /Due in/)
    assert.equal(onTrackDisplay.targetLabel, `SLA: ${VETTING_SLA_CONFIG.overdueDays} days`)
  })
})
