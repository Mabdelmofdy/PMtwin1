import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mapReadinessReasonToUserMessage,
  sanitizeReadinessDisplayText,
  groupReadinessIssues,
} from './index.ts'

describe('readiness presentation', () => {
  it('never returns technical codes as titles', () => {
    const msg = mapReadinessReasonToUserMessage('READINESS_MISSING_LOCATION')
    assert.equal(msg.title, 'Add a location or service area')
    assert.doesNotMatch(msg.title, /READINESS_/)
    assert.equal(msg.stepId, 'opportunity')
  })

  it('sanitizes accidental code leakage', () => {
    assert.equal(
      sanitizeReadinessDisplayText('Missing READINESS_MISSING_TITLE field'),
      'Missing field',
    )
  })

  it('groups required recommended and completed', () => {
    const groups = groupReadinessIssues({
      reasonCodes: ['READINESS_MISSING_TITLE'],
      recommendedReasonCodes: ['READINESS_MISSING_ATTACHMENTS'],
      completedLabels: ['Title'],
    })
    assert.equal(groups.required.length, 1)
    assert.equal(groups.recommended.length, 1)
    assert.equal(groups.completed.length, 1)
  })
})
