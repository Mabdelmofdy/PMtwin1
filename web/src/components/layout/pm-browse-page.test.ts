import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmBrowsePageProps } from '@/components/layout/pm-browse-page'

describe('PmBrowsePage contract', () => {
  it('requires header and content children', () => {
    const props: PmBrowsePageProps = {
      header: null,
      children: null,
    }

    assert.equal(props.header, null)
    assert.equal(props.children, null)
  })

  it('supports optional summary, toolbar, and pagination slots', () => {
    const props: PmBrowsePageProps = {
      header: null,
      summary: null,
      toolbar: null,
      pagination: null,
      children: null,
      contentClassName: 'space-y-6',
    }

    assert.equal(props.contentClassName, 'space-y-6')
    assert.equal(props.toolbar, null)
  })
})
