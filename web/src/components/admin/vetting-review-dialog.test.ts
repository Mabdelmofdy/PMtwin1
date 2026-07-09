import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('vetting review dialog source', () => {
  it('includes review fields and request changes options', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/admin/vetting-review-dialog.tsx'),
      'utf8',
    )

    assert.equal(source.includes('Review Notes'), true)
    assert.equal(source.includes('Requested Items'), true)
    assert.equal(source.includes('Due Date'), true)
    assert.equal(source.includes('Request Changes'), true)
  })
})
