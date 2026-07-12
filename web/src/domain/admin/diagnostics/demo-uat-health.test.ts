import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('buildDemoUatHealthSnapshot', () => {
  it('never invents DB/API service health rows', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/domain/admin/diagnostics/demo-uat-health.ts'),
      'utf8',
    )
    assert.equal(source.includes('Data service'), false)
    assert.equal(source.includes('Matching engine'), false)
    assert.equal(source.includes('All operational'), false)
    assert.ok(source.includes('LocalStorage availability'))
    assert.ok(source.includes('buildDemoUatHealthSnapshot'))
  })
})
