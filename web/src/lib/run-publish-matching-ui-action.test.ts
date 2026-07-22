import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runPublishMatchingUiAction } from '@/lib/run-publish-matching-ui-action.ts'
import type { BatchPublishMatchingResult } from '@/services/matching-service.ts'

const emptyBatch: BatchPublishMatchingResult = {
  runId: 'run-test',
  discoveredMatchesCount: 0,
  skippedDuplicatesCount: 0,
  matchingErrors: [],
  postMatchIds: [],
  opportunitiesProcessed: 0,
  status: 'completed',
}

describe('runPublishMatchingUiAction', () => {
  it('denies non-admin actors', () => {
    const result = runPublishMatchingUiAction({
      userId: 'u1',
      userRole: 'professional',
    })
    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, 'ACCESS_DENIED')
  })

  it('runs batch publish matching for admins', () => {
    let calls = 0
    const result = runPublishMatchingUiAction(
      { userId: 'admin-1', userRole: 'admin' },
      {
        runPublishMatching: () => {
          calls += 1
          return {
            ...emptyBatch,
            discoveredMatchesCount: 1,
            opportunitiesProcessed: 2,
            postMatchIds: ['pm-1'],
          }
        },
      },
    )
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(calls, 1)
    assert.equal(result.discoveredMatchesCount, 1)
    assert.equal(result.opportunitiesProcessed, 2)
  })
})
