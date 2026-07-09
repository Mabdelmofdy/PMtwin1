import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Party } from '@pm-twin/party'
import type { PlatformUser } from '@/types/domain.ts'
import { createVettingService } from '@/lib/vetting-service.ts'

function createInMemoryDeps() {
  const users = new Map<string, PlatformUser>()
  const companies = new Map<string, PlatformUser>()
  const parties = new Map<string, Party>()
  const documents: Array<Record<string, unknown>> = []
  const audits: Array<Record<string, unknown>> = []

  const deps = {
    peopleApi: {
      listUsers: () => [...users.values()],
      listAll: () => [...users.values(), ...companies.values()],
      listCompanies: () => [...companies.values()],
      get: (id: string) => users.get(id) ?? companies.get(id),
    },
    partiesApi: {
      resolveActiveParty: (userId: string) => parties.get(userId) ?? null,
    },
    userRepository: {
      getById: (id: string) => users.get(id),
      update: (id: string, patch: Partial<PlatformUser>) => {
        const existing = users.get(id)
        if (!existing) return undefined
        const updated = {
          ...existing,
          ...patch,
          profile: patch.profile
            ? { ...existing.profile, ...patch.profile }
            : existing.profile,
        }
        users.set(id, updated)
        return updated
      },
    },
    companyRepository: {
      getById: (id: string) => companies.get(id),
      update: (id: string, patch: Partial<PlatformUser>) => {
        const existing = companies.get(id)
        if (!existing) return undefined
        const updated = {
          ...existing,
          ...patch,
          profile: patch.profile
            ? { ...existing.profile, ...patch.profile }
            : existing.profile,
        }
        companies.set(id, updated)
        return updated
      },
    },
    partyRepository: {
      updateStatus: (id: string, status: string) => {
        const existing = parties.get(id)
        if (!existing) return undefined
        const updated = { ...existing, status }
        parties.set(id, updated)
        return updated
      },
    },
    partyDocumentRepository: {
      create: (payload: Record<string, unknown>) => {
        const document = {
          id: `doc-${documents.length + 1}`,
          uploadedAt: new Date().toISOString(),
          ...payload,
        }
        documents.push(document)
        return document
      },
      getById: (id: string) =>
        documents.find((document) => String(document.id) === id),
      update: (id: string, patch: Record<string, unknown>) => {
        const index = documents.findIndex((document) => String(document.id) === id)
        if (index < 0) return undefined
        documents[index] = { ...documents[index], ...patch }
        return documents[index]
      },
      listForParty: (ownerPartyId: string) =>
        documents.filter((doc) => doc.ownerPartyId === ownerPartyId),
    },
    auditRepository: {
      append: (entry: Record<string, unknown>) => {
        audits.push(entry)
        return { id: `audit-${audits.length}`, ...entry }
      },
    },
    notificationRepository: {
      create: (entry: Record<string, unknown>) => {
        audits.push({ action: 'notification.created', ...entry })
        return { id: `notif-${audits.length}`, ...entry }
      },
    },
  }

  return { deps, users, companies, parties, documents, audits }
}

describe('vetting service', () => {
  it('requests changes then resubmits with pending status', () => {
    const stack = createInMemoryDeps()
    stack.users.set('u-1', {
      id: 'u-1',
      email: 'user@test',
      role: 'user',
      status: 'pending_vetting',
      profile: { name: 'User One' },
    })
    stack.parties.set('u-1', {
      id: 'u-1',
      partyType: 'individual',
      displayName: 'User One',
      status: 'pending_vetting',
      sourceEntityId: 'u-1',
      sourceEntityType: 'individual',
    })

    const service = createVettingService(stack.deps as never)

    service.requestChanges({
      userId: 'u-1',
      partyId: 'u-1',
      reviewerId: 'admin-1',
      reason: 'CR expired',
      requestedItems: ['Upload valid CR'],
    })
    assert.equal(stack.users.get('u-1')?.status, 'pending_vetting')

    service.resubmitForReview('u-1', 'u-1')
    assert.equal(stack.users.get('u-1')?.status, 'pending_vetting')
    assert.ok(
      stack.audits.some((entry) => entry.action === 'vetting.changes_requested'),
    )
    assert.ok(
      stack.audits.some((entry) => entry.action === 'vetting.resubmitted'),
    )
    assert.ok(
      stack.audits.some(
        (entry) =>
          entry.action === 'notification.created'
          && entry.title === 'Changes requested',
      ),
    )
  })

  it('stores PartyDocument metadata and logs replacement audit', () => {
    const stack = createInMemoryDeps()
    const service = createVettingService(stack.deps as never)

    const document = service.replacePartyDocument({
      ownerPartyId: 'party-1',
      uploadedByUserId: 'user-1',
      documentCategory: 'vetting',
      documentType: 'Commercial Registration',
      fileName: 'cr-2026.pdf',
    })

    assert.equal(document.documentType, 'Commercial Registration')
    assert.equal(document.fileName, 'cr-2026.pdf')
    assert.equal(document.status, 'pending_review')
    assert.equal(stack.documents.length, 1)
    assert.ok(
      stack.audits.some((entry) => entry.action === 'vetting.document_replaced'),
    )
    const listed = service.listPartyDocuments('party-1')
    assert.equal(listed.length, 1)
    assert.equal(listed[0]?.ownerPartyId, 'party-1')

    const reviewed = service.reviewPartyDocument(String(document.id), {
      status: 'approved',
      reviewedBy: 'admin-1',
      reviewNotes: 'Looks valid',
    })
    assert.equal(reviewed?.status, 'approved')
    assert.ok(
      stack.audits.some(
        (entry) =>
          entry.action === 'notification.created'
          && entry.title === 'Document approved',
      ),
    )
  })
})
