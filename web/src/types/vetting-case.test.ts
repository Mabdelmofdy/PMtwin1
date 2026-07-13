import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveVettingCaseStatus,
  userStatusForVettingCase,
  type VettingCaseStatus,
} from '@/types/vetting.ts'

describe('vetting case status', () => {
  it('maps canonical cases to auth gate statuses', () => {
    const cases: Array<[VettingCaseStatus, string]> = [
      ['draft', 'pending_vetting'],
      ['submitted', 'pending_vetting'],
      ['pending_review', 'pending_vetting'],
      ['resubmitted', 'pending_vetting'],
      ['clarification_requested', 'clarification_requested'],
      ['approved', 'active'],
      ['rejected', 'rejected'],
      ['suspended', 'suspended'],
    ]
    for (const [caseStatus, expected] of cases) {
      assert.equal(userStatusForVettingCase(caseStatus), expected)
    }
  })

  it('resolves caseStatus from metadata first', () => {
    assert.equal(
      resolveVettingCaseStatus({ caseStatus: 'pending_review' }, 'pending_vetting'),
      'pending_review',
    )
  })

  it('infers clarification from dual legacy model', () => {
    assert.equal(
      resolveVettingCaseStatus({ reviewProgress: 'changes_requested' }, 'pending_vetting'),
      'clarification_requested',
    )
  })
})
