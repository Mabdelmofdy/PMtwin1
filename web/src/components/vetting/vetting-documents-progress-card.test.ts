import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('vetting documents progress card source', () => {
  it('uses presentation provider and shows required vs optional counts', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/vetting-documents-progress-card.tsx'),
      'utf8',
    )
    assert.equal(source.includes('resolveDocumentsProgress'), true)
    assert.equal(source.includes('Required documents'), true)
    assert.equal(source.includes('Optional documents'), true)
    assert.equal(source.includes('OPTIONAL_VETTING_DOCUMENT'), false)
  })
})
