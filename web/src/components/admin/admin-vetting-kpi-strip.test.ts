import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('admin vetting kpi strip source', () => {
  it('renders seven operational KPI cards including average review time and SLA compliance', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/admin/admin-vetting-kpi-strip.tsx'),
      'utf8',
    )
    assert.equal(source.includes('Pending Review'), true)
    assert.equal(source.includes('Changes Requested'), true)
    assert.equal(source.includes('Resubmitted'), true)
    assert.equal(source.includes('Overdue'), true)
    assert.equal(source.includes('Average Review Time'), true)
    assert.equal(source.includes('Approved Today'), true)
    assert.equal(source.includes('SLA Compliance'), true)
    assert.equal(source.includes('Rejected Today'), false)
  })
})
