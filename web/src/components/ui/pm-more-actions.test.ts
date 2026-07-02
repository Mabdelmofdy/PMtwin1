import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/** Structural tests for card action rule helpers (no DOM). */
describe('PmMoreActionItem contract', () => {
  it('requires href or onSelect for visible menu items', () => {
    const items = [
      { label: 'Edit', href: '/edit' },
      { label: 'Delete', onSelect: () => undefined, variant: 'destructive' as const },
    ]

    const visible = items.filter((item) => item.href || item.onSelect)
    assert.equal(visible.length, 2)
    assert.equal(visible[1]?.variant, 'destructive')
  })
})

describe('Card action rule priority', () => {
  type Actions = {
    showAccept?: boolean
    showDecline?: boolean
    showStartNegotiation?: boolean
    showViewNegotiation?: boolean
    showCreateDeal?: boolean
    showViewDeal?: boolean
  }

  function resolvePrimaryLabel(actions: Actions): string {
    if (actions.showAccept) return 'Accept match'
    if (actions.showStartNegotiation) return 'Start negotiation'
    if (actions.showCreateDeal) return 'Create deal'
    if (actions.showViewNegotiation) return 'Open negotiation'
    if (actions.showViewDeal) return 'Open deal'
    return 'Open match'
  }

  it('picks the next lifecycle action as primary', () => {
    assert.equal(resolvePrimaryLabel({ showAccept: true }), 'Accept match')
    assert.equal(
      resolvePrimaryLabel({ showStartNegotiation: true }),
      'Start negotiation',
    )
    assert.equal(resolvePrimaryLabel({ showViewDeal: true }), 'Open deal')
    assert.equal(resolvePrimaryLabel({}), 'Open match')
  })
})
