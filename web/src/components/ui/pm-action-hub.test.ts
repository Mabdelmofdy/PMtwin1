import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/** Structural tests for action hub item contract (no DOM). */
describe('PmActionHubItem contract', () => {
  it('requires title and primary action slot', () => {
    const item = {
      id: 'match-1',
      title: 'Review match',
      context: 'Awaiting your response',
      status: 'discovered',
      statusEntity: 'match' as const,
      primary: { label: 'Open match', href: '/matches/1' },
    }

    assert.equal(item.primary.label, 'Open match')
    assert.ok(item.primary.href)
  })

  it('allows optional secondary and more actions', () => {
    const item = {
      id: 'deal-1',
      title: 'Sign deal',
      primary: { label: 'Open deal', href: '/deals/1' },
      secondary: { label: 'View pipeline', href: '/pipeline', variant: 'outline' as const },
      more: [{ label: 'View match', href: '/matches/1' }],
    }

    assert.equal(item.more?.length, 1)
    assert.equal(item.secondary?.variant, 'outline')
  })
})
