import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runRerunMatchingUiAction } from '@/lib/run-rerun-matching-ui-action.ts'
import type { PublishMatchingResult } from '@/services/matching-service.ts'

const empty: PublishMatchingResult = {
  discoveredMatchesCount: 0,
  skippedDuplicatesCount: 0,
  matchingErrors: [],
  postMatchIds: [],
}

describe('runRerunMatchingUiAction', () => {
  it('denies non-admin actors', () => {
    const result = runRerunMatchingUiAction('opp-1', {
      userId: 'u1',
      userRole: 'professional',
    })
    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, 'ACCESS_DENIED')
  })

  it('runs publish + circular matching for admins', () => {
    let publishCalls = 0
    let circularCalls = 0
    const result = runRerunMatchingUiAction(
      'opp-1',
      { userId: 'admin-1', userRole: 'admin' },
      {
        runPublishMatching: () => {
          publishCalls += 1
          return {
            ...empty,
            discoveredMatchesCount: 2,
            postMatchIds: ['pm-1', 'pm-2'],
          }
        },
        runCircularMatching: () => {
          circularCalls += 1
          return {
            ...empty,
            discoveredMatchesCount: 1,
            skippedDuplicatesCount: 1,
            postMatchIds: ['pm-c1'],
          }
        },
      },
    )
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(publishCalls, 1)
    assert.equal(circularCalls, 1)
    assert.equal(result.discoveredMatchesCount, 2)
    assert.equal(result.circularDiscoveredMatchesCount, 1)
    assert.equal(result.circularSkippedDuplicatesCount, 1)
  })

  it('treats second rerun duplicates as skipped via deps', () => {
    const result = runRerunMatchingUiAction(
      'opp-1',
      { userId: 'admin-1', userRole: 'admin' },
      {
        runPublishMatching: () => ({
          ...empty,
          skippedDuplicatesCount: 2,
        }),
        runCircularMatching: () => empty,
      },
    )
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.discoveredMatchesCount, 0)
    assert.equal(result.skippedDuplicatesCount, 2)
  })
})
