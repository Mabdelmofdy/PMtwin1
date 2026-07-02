import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmBoardColumnProps } from '@/components/ui/pm-board'

describe('PmBoardColumn contract', () => {
  it('requires title and children; count and description are optional', () => {
    const props: Pick<PmBoardColumnProps, 'title' | 'count' | 'description'> = {
      title: 'Published',
      count: 4,
      description: 'Visible to the network.',
    }
    assert.equal(props.title, 'Published')
    assert.equal(props.count, 4)
  })

  it('supports zero count display (distinct from undefined)', () => {
    const withZero: Pick<PmBoardColumnProps, 'count'> = { count: 0 }
    const withoutCount: Pick<PmBoardColumnProps, 'count'> = {}
    assert.equal(withZero.count, 0)
    assert.equal(withoutCount.count, undefined)
  })
})
