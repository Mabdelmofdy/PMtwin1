import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmPageProps } from '@/components/ui/pm-page'

describe('PmPage props contract', () => {
  it('accepts the same slots as PmPageLayout', () => {
    const props: PmPageProps = {
      header: undefined,
      toolbar: undefined,
      children: null,
      inspector: undefined,
      activity: undefined,
      actionBar: undefined,
      withInspector: false,
      className: 'custom-page',
      contentClassName: 'space-y-6',
    }

    assert.equal(props.withInspector, false)
    assert.equal(props.contentClassName, 'space-y-6')
  })
})
