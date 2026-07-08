import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatMatchTypeBadgeLabel,
  resolveCollaborationStepFromDeal,
  resolveCollaborationStepFromMatch,
  resolveMatchTypeTone,
} from '@/components/collaboration/collaboration-display.ts'

describe('collaboration-display', () => {
  it('resolves collaboration step from match context', () => {
    assert.equal(resolveCollaborationStepFromMatch({}), 'PostMatch')
    assert.equal(
      resolveCollaborationStepFromMatch({ hasNegotiation: true }),
      'Negotiation',
    )
    assert.equal(
      resolveCollaborationStepFromMatch({ hasDeal: true, hasNegotiation: true }),
      'Commercial Agreement',
    )
  })

  it('resolves collaboration step from deal context', () => {
    assert.equal(resolveCollaborationStepFromDeal(false), 'Commercial Agreement')
    assert.equal(resolveCollaborationStepFromDeal(true), 'Contract')
  })

  it('maps match type tones and labels', () => {
    assert.equal(resolveMatchTypeTone('two_way'), 'primary')
    assert.equal(resolveMatchTypeTone('unknown'), 'neutral')
    assert.equal(formatMatchTypeBadgeLabel('one_way'), 'One Way Matching')
  })
})
