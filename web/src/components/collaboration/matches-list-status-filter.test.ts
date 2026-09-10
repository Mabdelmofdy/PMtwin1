import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MATCH_LIST_ALL_STATUSES_FILTER,
  MATCH_LIST_DEFAULT_STATUS_FILTER,
  matchListStatusFilterLabel,
  matchPassesListStatusFilter,
} from './matches-list-status-filter.ts'

const STATUSES = [
  'discovered',
  'accepted',
  'confirmed',
  'declined',
  'expired',
  'superseded',
] as const

function passing(statusFilter: string): string[] {
  return STATUSES.filter((status) => matchPassesListStatusFilter(status, statusFilter))
}

describe('match list status filter', () => {
  it('excludes Expired from the default active list and keeps Confirmed visible', () => {
    assert.deepEqual(passing(MATCH_LIST_DEFAULT_STATUS_FILTER), [
      'discovered',
      'accepted',
      'confirmed',
      'declined',
      'superseded',
    ])
    assert.equal(matchPassesListStatusFilter('expired', MATCH_LIST_DEFAULT_STATUS_FILTER), false)
    assert.equal(matchPassesListStatusFilter('confirmed', MATCH_LIST_DEFAULT_STATUS_FILTER), true)
    assert.equal(matchListStatusFilterLabel(MATCH_LIST_DEFAULT_STATUS_FILTER), 'All active')
  })

  it('returns only Expired when the Expired filter is selected', () => {
    assert.deepEqual(passing('expired'), ['expired'])
  })

  it('includes Expired in the All statuses / history view', () => {
    assert.deepEqual(passing(MATCH_LIST_ALL_STATUSES_FILTER), [...STATUSES])
    assert.equal(matchPassesListStatusFilter('expired', MATCH_LIST_ALL_STATUSES_FILTER), true)
    assert.equal(matchListStatusFilterLabel(MATCH_LIST_ALL_STATUSES_FILTER), 'All statuses')
  })

  it('yields an empty default list when every match is Expired', () => {
    const matches = [{ status: 'expired' }, { status: 'expired' }]
    const visible = matches.filter((match) =>
      matchPassesListStatusFilter(match.status, MATCH_LIST_DEFAULT_STATUS_FILTER),
    )
    assert.equal(visible.length, 0)
  })

  it('treats canonical expired aliases as Expired', () => {
    assert.equal(matchPassesListStatusFilter('Expired', MATCH_LIST_DEFAULT_STATUS_FILTER), false)
    assert.equal(matchPassesListStatusFilter('expired', 'expired'), true)
  })
})
