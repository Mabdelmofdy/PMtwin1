import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMatchingRunAuditDetails,
  resolveMatchingRunStatus,
} from '@/services/matching/matching-run-audit.ts'

describe('matching run audit helpers', () => {
  it('resolveMatchingRunStatus maps outcomes', () => {
    assert.equal(resolveMatchingRunStatus([]), 'completed')
    assert.equal(resolveMatchingRunStatus(['error']), 'completed_with_errors')
    assert.equal(resolveMatchingRunStatus([], { failed: true }), 'failed')
  })

  it('buildMatchingRunAuditDetails includes error count', () => {
    const details = buildMatchingRunAuditDetails({
      runId: 'run-1',
      runType: 'circular',
      actorId: 'admin-1',
      actorRole: 'admin',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:05.000Z',
      discoveredMatchesCount: 2,
      skippedDuplicatesCount: 1,
      matchingErrors: ['one', 'two'],
      status: 'completed_with_errors',
    })

    assert.equal(details.matchingErrorsCount, 2)
    assert.deepEqual(details.matchingErrors, ['one', 'two'])
    assert.equal(details.runType, 'circular')
  })
})
