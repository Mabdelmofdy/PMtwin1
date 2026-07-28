import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  mergeMatchingRunDiagnosticSummaries,
  toMatchingRunDiagnosticSummary,
} from './matching-diagnostic-summary.ts'

describe('matching diagnostic summary', () => {
  it('compacts engine diagnostics for audit storage', () => {
    const summary = toMatchingRunDiagnosticSummary({
      sourceOpportunityId: 'need-1',
      scannedCount: 2,
      eligibleCount: 1,
      rejectedCount: 1,
      matchedCount: 1,
      candidates: [
        {
          candidateOpportunityId: 'offer-1',
          result: 'matched',
          finalScore: 0.84,
          locationTier: 'same_country',
          locationScore: 0.75,
          postMatchCreated: true,
          checks: [
            { id: 'published', status: 'pass' },
            { id: 'location', status: 'pass', detail: 'Same Country Score 0.75' },
            { id: 'threshold', status: 'pass' },
          ],
        },
        {
          candidateOpportunityId: 'offer-2',
          result: 'rejected',
          rejectReason: 'TARGET_ROLE_REQUIRED',
          postMatchCreated: false,
          checks: [
            { id: 'published', status: 'pass' },
            { id: 'target_role', status: 'fail', detail: 'Target role missing' },
          ],
        },
      ],
    })

    assert.ok(summary)
    assert.equal(summary?.matchedCount, 1)
    assert.equal(summary?.rejectedCount, 1)
    assert.equal(summary?.candidates[1]?.rejectReason, 'TARGET_ROLE_REQUIRED')
    assert.deepEqual(summary?.candidates[1]?.failedChecks, ['target_role'])
  })

  it('merges multiple run summaries', () => {
    const merged = mergeMatchingRunDiagnosticSummaries([
      {
        scannedCount: 2,
        eligibleCount: 1,
        rejectedCount: 1,
        matchedCount: 1,
        candidates: [
          { candidateOpportunityId: 'a', result: 'matched', finalScore: 0.9 },
        ],
      },
      {
        scannedCount: 3,
        eligibleCount: 0,
        rejectedCount: 3,
        matchedCount: 0,
        candidates: [
          {
            candidateOpportunityId: 'b',
            result: 'rejected',
            rejectReason: 'BELOW_MATCH_THRESHOLD',
          },
        ],
      },
    ])
    assert.equal(merged?.scannedCount, 5)
    assert.equal(merged?.matchedCount, 1)
    assert.equal(merged?.rejectedCount, 4)
    assert.equal(merged?.candidates.length, 2)
  })
})
