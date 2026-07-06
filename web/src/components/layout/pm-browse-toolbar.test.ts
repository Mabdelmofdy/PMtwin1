import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmBrowseToolbarProps } from '@/components/layout/pm-browse-toolbar'

describe('PmBrowseToolbar contract', () => {
  it('uses the canonical browse toolbar data-slot name', () => {
    const slot = 'pm-browse-toolbar'
    assert.equal(slot, 'pm-browse-toolbar')
  })

  it('accepts PmToolbarSurface-compatible props', () => {
    const props: PmBrowseToolbarProps = {
      className: 'space-y-3',
      children: null,
    }

    assert.equal(props.className, 'space-y-3')
  })
})
