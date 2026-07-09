import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('vetting documents provider source', () => {
  it('exports presentation provider functions for required and optional documents', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/vetting/vetting-documents-provider.ts'),
      'utf8',
    )
    assert.equal(source.includes('export function getRequiredDocuments'), true)
    assert.equal(source.includes('export function getOptionalDocuments'), true)
    assert.equal(source.includes('export function resolveDocumentsProgress'), true)
    assert.equal(source.includes('Knowledge Registry'), true)
  })
})
