import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  allowedTransitions,
  forbiddenTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '../src/index.js'

describe('getFsm', () => {
  it('returns ADR-001 FSM for opportunity', () => {
    const fsm = getFsm('opportunity')
    assert.ok(fsm)
    assert.equal(fsm.entityType, 'opportunity')
    assert.ok(fsm.states.includes('negotiating'))
    assert.deepEqual(fsm.terminalStates, ['completed', 'cancelled'])
    assert.deepEqual(fsm.transitions.draft, ['published', 'cancelled'])
  })

  it('returns null for unknown entity', () => {
    assert.equal(getFsm('unknown'), null)
  })
})

describe('isTerminal', () => {
  it('recognizes canonical terminal states', () => {
    assert.equal(isTerminal('match', 'confirmed'), true)
    assert.equal(isTerminal('match', 'discovered'), false)
  })

  it('maps legacy status before terminal check', () => {
    assert.equal(isTerminal('negotiation', 'failed'), true)
    assert.equal(isTerminal('negotiation', 'open'), false)
  })
})

describe('allowedTransitions', () => {
  it('returns canonical next states', () => {
    assert.deepEqual(allowedTransitions('commercial_agreement', 'draft'), ['review', 'cancelled'])
  })

  it('supports legacy entity alias', () => {
    assert.deepEqual(allowedTransitions('deal', 'draft'), ['review', 'cancelled'])
  })

  it('maps legacy from-status', () => {
    assert.deepEqual(allowedTransitions('match', 'pending'), [
      'accepted',
      'declined',
      'expired',
    ])
  })
})

describe('forbiddenTransitions', () => {
  it('excludes current and allowed states', () => {
    const forbidden = forbiddenTransitions('commercial_agreement', 'draft')
    assert.ok(!forbidden.includes('draft'))
    assert.ok(!forbidden.includes('review'))
    assert.ok(!forbidden.includes('cancelled'))
    assert.ok(forbidden.includes('executing'))
  })
})

describe('toCanonical', () => {
  it('maps legacy opportunity status', () => {
    assert.equal(toCanonical('opportunity', 'in_negotiation'), 'negotiating')
  })
})
