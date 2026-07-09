import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PartyDocument } from '@/types/party-document.ts'
import { calculateProfileCompletion } from '@/lib/profile-completion.ts'

describe('profile completion engine', () => {
  it('calculates company profile completion independent from opportunity readiness', () => {
    const documents: PartyDocument[] = [
      {
        id: 'doc-1',
        ownerPartyId: 'party-1',
        uploadedByUserId: 'user-1',
        documentCategory: 'vetting',
        documentType: 'commercial_registration',
        fileName: 'cr.pdf',
        status: 'pending_review',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'doc-2',
        ownerPartyId: 'party-1',
        uploadedByUserId: 'user-1',
        documentCategory: 'certification',
        documentType: 'certification',
        fileName: 'cert.pdf',
        status: 'approved',
        uploadedAt: new Date().toISOString(),
      },
    ]

    const result = calculateProfileCompletion(
      {
        id: 'user-1',
        email: 'company@test',
        role: 'company_owner',
        status: 'pending',
        profile: {
          name: 'Company User',
          location: 'Riyadh',
          skills: ['PM', 'Risk', 'Procurement'],
          website: 'https://example.com',
        },
      },
      documents,
      true,
    )

    assert.equal(result.totalCount > 5, true)
    assert.equal(result.score > 0, true)
    assert.ok(result.missingItems.includes('Company logo'))
    assert.ok(result.missingItems.includes('VAT'))
  })
})
