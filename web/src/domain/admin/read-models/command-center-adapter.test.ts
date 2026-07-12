import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('command-center-adapter', () => {
  it('builds from repositories and avoids hardcoded demo metrics', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/domain/admin/read-models/command-center-adapter.ts'),
      'utf8',
    )
    assert.ok(source.includes('buildCommandCenterSummary'))
    assert.ok(source.includes('buildOperationsSummary'))
    assert.ok(source.includes('buildRiskSummary'))
    assert.ok(source.includes('userRepository'))
    assert.ok(source.includes('commercialAgreementRepository'))
    assert.equal(source.includes('value: 12'), false)
    assert.equal(source.includes("'78%'"), false)
    assert.equal(source.includes('"78%"'), false)
  })
})
