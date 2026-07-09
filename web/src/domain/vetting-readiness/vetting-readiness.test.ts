import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'

describe('evaluateVettingReadiness', () => {
  it('returns zero-ish readiness when missing required docs', () => {
    const result = evaluateVettingReadiness({
      accountStatus: 'pending_vetting',
      reviewProgress: 'not_started',
      documents: [],
    })
    assert.equal(result.status, 'incomplete')
    assert.ok(result.score < 30)
    assert.equal(result.documentsProgress.approvedRequired, 0)
  })

  it('keeps pending_review below approved', () => {
    const result = evaluateVettingReadiness({
      accountStatus: 'pending_vetting',
      reviewProgress: 'in_review',
      documents: [
        {
          id: 'd-1',
          ownerPartyId: 'p-1',
          uploadedByUserId: 'u-1',
          documentCategory: 'vetting',
          documentType: 'commercial_registration',
          fileName: 'cr.pdf',
          status: 'pending_review',
          uploadedAt: new Date().toISOString(),
        },
      ],
    })
    assert.ok(result.score < 50)
    assert.ok(result.missingRequired.length > 0)
  })

  it('forces 100 for active accounts', () => {
    const result = evaluateVettingReadiness({ accountStatus: 'active' })
    assert.equal(result.score, 100)
    assert.equal(result.status, 'ready_for_matching')
  })
})

