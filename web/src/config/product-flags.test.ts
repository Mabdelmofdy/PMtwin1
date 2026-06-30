import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { productFlags } from '@/config/product-flags.ts'
import { getVisiblePipelineTabs } from '@/pages/workspace/pipeline-pages.tsx'

describe('productFlags', () => {
  it('hides legacy application UI by default before Visual Freeze', () => {
    assert.equal(productFlags.showLegacyApplications, false)
  })
})

describe('getVisiblePipelineTabs', () => {
  it('omits applications tab when legacy UI is suppressed', () => {
    const tabs = getVisiblePipelineTabs(false)
    assert.equal(
      tabs.some((t) => t.value === 'applications'),
      false,
    )
    assert.equal(tabs.length, 2)
  })

  it('includes applications tab when legacy UI is enabled', () => {
    const tabs = getVisiblePipelineTabs(true)
    assert.equal(
      tabs.some((t) => t.value === 'applications'),
      true,
    )
    assert.equal(tabs.length, 3)
  })
})
