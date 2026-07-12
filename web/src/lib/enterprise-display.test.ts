import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatEnterpriseReference,
  formatOpportunityPresentation,
  formatPartyCompanyCode,
  formatUserEmployeeNumber,
  looksLikeInternalId,
  presentationYear,
  safeEnterpriseLabel,
  stableHash32,
} from '@/lib/enterprise-display.ts'

describe('enterprise-display', () => {
  it('derives deterministic references from the same entity id', () => {
    const a = formatEnterpriseReference('opportunity', 'seed-opp-001', '2024-03-15T00:00:00.000Z')
    const b = formatEnterpriseReference('opportunity', 'seed-opp-001', '2024-03-15T00:00:00.000Z')
    assert.equal(a, b)
    assert.match(a, /^OPP-2024-\d{5}$/)
  })

  it('uses distinct prefixes per entity kind', () => {
    const id = 'entity-42'
    assert.match(formatEnterpriseReference('post_match', id, '2025-01-01'), /^PM-2025-\d{5}$/)
    assert.match(formatEnterpriseReference('negotiation', id, '2025-01-01'), /^NEG-2025-\d{5}$/)
    assert.match(formatEnterpriseReference('commercial_agreement', id, '2025-01-01'), /^CA-2025-\d{5}$/)
    assert.match(formatEnterpriseReference('contract', id, '2025-01-01'), /^CTR-2025-\d{5}$/)
    assert.match(formatUserEmployeeNumber(id, '2025-01-01'), /^USR-2025-\d{5}$/)
    assert.match(formatPartyCompanyCode(id), /^CO-[A-Z0-9]{5}$/)
  })

  it('formats opportunity presentation without exposing repository id', () => {
    const view = formatOpportunityPresentation({
      id: 'seed-opp-001',
      title: 'Hospital Expansion',
      createdAt: '2024-06-01T00:00:00.000Z',
    })
    assert.equal(view.name, 'Hospital Expansion')
    assert.match(view.reference, /^OPP-2024-\d{5}$/)
    assert.equal(view.name.includes('seed-'), false)
  })

  it('detects internal and demo-style ids', () => {
    assert.equal(looksLikeInternalId('seed-opp-001'), true)
    assert.equal(looksLikeInternalId('demo-user-12'), true)
    assert.equal(looksLikeInternalId('550e8400-e29b-41d4-a716-446655440000'), true)
    assert.equal(looksLikeInternalId('Hospital Expansion'), false)
    assert.equal(looksLikeInternalId('OPP-2024-01234'), false)
  })

  it('safeEnterpriseLabel never returns raw internal ids', () => {
    assert.equal(safeEnterpriseLabel('seed-opp-001', 'Untitled Opportunity'), 'Untitled Opportunity')
    assert.equal(safeEnterpriseLabel('Riyadh Metro', 'Untitled Opportunity'), 'Riyadh Metro')
  })

  it('presentationYear prefers createdAt', () => {
    assert.equal(presentationYear('2023-11-01T00:00:00.000Z', 'x'), 2023)
    assert.ok(presentationYear(undefined, 'stable-id') >= 2020)
    assert.equal(stableHash32('a'), stableHash32('a'))
  })
})
