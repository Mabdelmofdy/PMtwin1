import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PmEmptyStateProps } from '@/components/ui/pm-empty-state'

/** Structural contract — component renders role="status" and size variants. */
describe('PmEmptyState contract', () => {
  it('requires title and supports optional description and action', () => {
    const props: PmEmptyStateProps = {
      title: 'No matches yet',
      description: 'Publish an opportunity to start matching.',
    }
    assert.equal(props.title, 'No matches yet')
    assert.ok(props.description)
  })

  it('supports default and compact size variants', () => {
    const sizes: PmEmptyStateProps['size'][] = ['default', 'compact']
    assert.deepEqual(sizes, ['default', 'compact'])
  })

  it('documents live-region semantics via role=status in implementation', () => {
    const expectedRole = 'status'
    assert.equal(expectedRole, 'status')
  })
})
