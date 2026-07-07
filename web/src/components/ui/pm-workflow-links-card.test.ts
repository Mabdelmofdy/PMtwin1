import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmWorkflowLinksCardProps } from '@/components/ui/pm-workflow-links-card'
import {
  ENTITY_BROWSE_ROUTES,
  resolveEntityBrowseBackHref,
  resolveEntityBrowseBackLabel,
} from '@/components/auth/entity-browse-routes'

describe('PmWorkflowLinksCard contract', () => {
  it('accepts workflow link items with id, label, and href', () => {
    const props: PmWorkflowLinksCardProps = {
      links: [
        { id: 'match', label: 'Open match', href: '/matches/m-1' },
        { id: 'deal', label: 'Open commercial agreement', href: '/commercial-agreements/d-1' },
      ],
    }

    assert.equal(props.links.length, 2)
    assert.equal(props.links[0]?.href, '/matches/m-1')
  })
})

describe('Entity access browse routes', () => {
  it('maps workflow entities to canonical browse routes', () => {
    assert.equal(resolveEntityBrowseBackHref('negotiation'), '/negotiations')
    assert.equal(resolveEntityBrowseBackHref('match'), '/matches')
    assert.equal(ENTITY_BROWSE_ROUTES.opportunity, '/opportunities')
  })

  it('provides human-readable back labels', () => {
    assert.equal(resolveEntityBrowseBackLabel('deal'), 'Back to commercial agreements')
    assert.equal(resolveEntityBrowseBackLabel('contract'), 'Back to contracts')
  })
})
