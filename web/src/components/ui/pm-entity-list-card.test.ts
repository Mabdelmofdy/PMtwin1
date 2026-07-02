import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmEntityListCardProps } from '@/components/ui/pm-entity-list-card'

describe('PmEntityListCard contract', () => {
  it('requires title, href, and primary action', () => {
    const props: PmEntityListCardProps = {
      title: 'Deal Alpha',
      href: '/deals/deal-1',
      primary: { label: 'Open deal', href: '/deals/deal-1' },
    }

    assert.equal(props.title, 'Deal Alpha')
    assert.equal(props.primary.label, 'Open deal')
  })

  it('supports optional badge, meta, and secondary action', () => {
    const props: PmEntityListCardProps = {
      title: 'Contract C-1',
      href: '/contracts/c-1',
      meta: 'Updated 1 Jan 2026',
      primary: { label: 'Open contract', href: '/contracts/c-1' },
      secondary: { label: 'View deal', href: '/deals/d-1', variant: 'outline' },
    }

    assert.equal(props.meta, 'Updated 1 Jan 2026')
    assert.equal(props.secondary?.variant, 'outline')
  })
})
