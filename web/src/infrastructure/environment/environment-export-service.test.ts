import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { NamespacedStorageAdapter } from '@/infrastructure/storage/namespaced-storage-adapter.ts'
import type { EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  buildEnvironmentExportPayload,
  ENVIRONMENT_EXPORT_COLLECTION_KEYS,
  EXPORT_SCHEMA_VERSION,
  EXPORT_TYPE,
  serializeEnvironmentExportPayload,
} from '@/infrastructure/environment/environment-export-service.ts'
import { ensureEnvironmentBootstrap } from '@/infrastructure/environment/environment-bootstrap-service.ts'

class MemoryLocalStorage {
  private readonly data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }
}

function snapshotLocalStorage(localStorage: MemoryLocalStorage): Map<string, string> {
  return new Map(
    Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index)
      return [key ?? '', localStorage.getItem(key ?? '') ?? '']
    }),
  )
}

function createDemoContext(localStorage: MemoryLocalStorage): EnvironmentContext {
  ;(globalThis as unknown as { window: { localStorage: MemoryLocalStorage } }).window = {
    localStorage,
  }
  const storageAdapter = new NamespacedStorageAdapter(new LocalStorageAdapter(), 'PMTWIN_DEMO_')
  ensureEnvironmentBootstrap(storageAdapter, 'demo')
  return {
    runtimeMode: 'demo',
    storageType: 'LocalStorage',
    namespace: 'PMTWIN_DEMO_',
    storageAdapter,
    canRestoreScenario: true,
    canExportEnvironment: true,
  }
}

function createProductionContext(): EnvironmentContext {
  return {
    runtimeMode: 'production',
    storageType: 'Future API',
    namespace: null,
    storageAdapter: new LocalStorageAdapter(),
    canRestoreScenario: false,
    canExportEnvironment: false,
  }
}

const sampleCollections = {
  users: [{ id: 'user-1', email: 'user@test', role: 'admin', status: 'active' }],
  companies: [{ id: 'company-1', email: 'co@test', role: 'company_owner', status: 'active' }],
  opportunities: [{ id: 'opp-1', title: 'Need', status: 'published' }],
  postMatches: [{ id: 'pm-1', matchType: 'one_way', status: 'discovered', matchScore: 80, participants: [] }],
  negotiations: [{ id: 'neg-1', status: 'active' }],
  negotiationMessages: [{ id: 'msg-1', negotiationId: 'neg-1', senderId: 'user-1', senderRole: 'admin', body: 'Hi', visibility: 'participants', createdAt: '2026-01-01T00:00:00.000Z' }],
  negotiationOffers: [{ id: 'offer-1', negotiationId: 'neg-1', version: 1, status: 'submitted', createdAt: '2026-01-01T00:00:00.000Z', terms: { mode: 'cash' } }],
  negotiationTranscriptEvents: [{ id: 'event-1', negotiationId: 'neg-1', eventType: 'message.posted', timestamp: '2026-01-01T00:00:00.000Z' }],
  commercialAgreements: [{ id: 'deal-1', negotiationId: 'neg-1', opportunityId: 'opp-1', title: 'Deal', status: 'draft', participants: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
  contracts: [{ id: 'contract-1', participants: [], status: 'draft', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
  applications: [{ id: 'app-1', opportunityId: 'opp-1', applicantId: 'user-1', status: 'submitted' }],
  audit: [{ id: 'audit-1', action: 'test.action', timestamp: '2026-01-01T00:00:00.000Z' }],
  notifications: [{ id: 'notif-1', userId: 'user-1', title: 'Alert', message: 'Hello', read: false, createdAt: '2026-01-01T00:00:00.000Z' }],
} as const

describe('buildEnvironmentExportPayload', () => {
  it('builds export payload shape with metadata and collections', () => {
    const context = createDemoContext(new MemoryLocalStorage())
    const payload = buildEnvironmentExportPayload('admin@test', {
      context,
      exportedAt: '2026-07-07T10:00:00.000Z',
      readUsers: () => [...sampleCollections.users],
      readCompanies: () => [...sampleCollections.companies],
      readOpportunities: () => [...sampleCollections.opportunities],
      readPostMatches: () => [...sampleCollections.postMatches],
      readNegotiations: () => [...sampleCollections.negotiations],
      readNegotiationMessages: () => [...sampleCollections.negotiationMessages],
      readNegotiationOffers: () => [...sampleCollections.negotiationOffers],
      readNegotiationTranscriptEvents: () => [...sampleCollections.negotiationTranscriptEvents],
      readCommercialAgreements: () => [...sampleCollections.commercialAgreements],
      readContracts: () => [...sampleCollections.contracts],
      readApplications: () => [...sampleCollections.applications],
      readAudit: () => [...sampleCollections.audit],
      readNotifications: () => [...sampleCollections.notifications],
    })

    assert.equal(payload.metadata.exportType, EXPORT_TYPE)
    assert.equal(payload.metadata.schemaVersion, EXPORT_SCHEMA_VERSION)
    assert.equal(payload.metadata.applicationVersion.length > 0, true)
    assert.equal(payload.metadata.seedVersion, '1.0.0')
    assert.equal(payload.metadata.runtimeMode, 'demo')
    assert.equal(payload.metadata.exportedBy, 'admin@test')
    assert.equal(payload.metadata.exportedAt, '2026-07-07T10:00:00.000Z')

    for (const key of ENVIRONMENT_EXPORT_COLLECTION_KEYS) {
      assert.ok(Array.isArray(payload[key]), `missing collection: ${key}`)
    }
  })

  it('includes all required entity collections', () => {
    const context = createDemoContext(new MemoryLocalStorage())
    const payload = buildEnvironmentExportPayload('admin@test', {
      context,
      exportedAt: '2026-07-07T10:00:00.000Z',
      readUsers: () => [...sampleCollections.users],
      readCompanies: () => [...sampleCollections.companies],
      readOpportunities: () => [...sampleCollections.opportunities],
      readPostMatches: () => [...sampleCollections.postMatches],
      readNegotiations: () => [...sampleCollections.negotiations],
      readNegotiationMessages: () => [...sampleCollections.negotiationMessages],
      readNegotiationOffers: () => [...sampleCollections.negotiationOffers],
      readNegotiationTranscriptEvents: () => [...sampleCollections.negotiationTranscriptEvents],
      readCommercialAgreements: () => [...sampleCollections.commercialAgreements],
      readContracts: () => [...sampleCollections.contracts],
      readApplications: () => [...sampleCollections.applications],
      readAudit: () => [...sampleCollections.audit],
      readNotifications: () => [...sampleCollections.notifications],
    })

    assert.equal(payload.users.length, 1)
    assert.equal(payload.companies.length, 1)
    assert.equal(payload.opportunities.length, 1)
    assert.equal(payload.postMatches.length, 1)
    assert.equal(payload.negotiations.length, 1)
    assert.equal(payload.negotiationMessages.length, 1)
    assert.equal(payload.negotiationOffers.length, 1)
    assert.equal(payload.negotiationTranscriptEvents.length, 1)
    assert.equal(payload.commercialAgreements.length, 1)
    assert.equal(payload.contracts.length, 1)
    assert.equal(payload.applications.length, 1)
    assert.equal(payload.audit.length, 1)
    assert.equal(payload.notifications.length, 1)
  })

  it('blocks export in production runtime mode', () => {
    assert.throws(
      () =>
        buildEnvironmentExportPayload('admin@test', {
          context: createProductionContext(),
          exportedAt: '2026-07-07T10:00:00.000Z',
          readUsers: () => [],
          readCompanies: () => [],
          readOpportunities: () => [],
          readPostMatches: () => [],
          readNegotiations: () => [],
          readNegotiationMessages: () => [],
          readNegotiationOffers: () => [],
          readNegotiationTranscriptEvents: () => [],
          readCommercialAgreements: () => [],
          readContracts: () => [],
          readApplications: () => [],
          readAudit: () => [],
          readNotifications: () => [],
        }),
      /only available in Demo\/UAT runtime modes/,
    )
  })

  it('does not mutate namespace storage during export', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    localStorage.setItem('PMTWIN_DEMO_pmtwin_web_overrides', JSON.stringify({ users: { 'user-1': { status: 'active' } } }))
    const before = snapshotLocalStorage(localStorage)

    buildEnvironmentExportPayload('admin@test', {
      context,
      exportedAt: '2026-07-07T10:00:00.000Z',
      readUsers: () => [...sampleCollections.users],
      readCompanies: () => [...sampleCollections.companies],
      readOpportunities: () => [...sampleCollections.opportunities],
      readPostMatches: () => [...sampleCollections.postMatches],
      readNegotiations: () => [...sampleCollections.negotiations],
      readNegotiationMessages: () => [...sampleCollections.negotiationMessages],
      readNegotiationOffers: () => [...sampleCollections.negotiationOffers],
      readNegotiationTranscriptEvents: () => [...sampleCollections.negotiationTranscriptEvents],
      readCommercialAgreements: () => [...sampleCollections.commercialAgreements],
      readContracts: () => [...sampleCollections.contracts],
      readApplications: () => [...sampleCollections.applications],
      readAudit: () => [...sampleCollections.audit],
      readNotifications: () => [...sampleCollections.notifications],
    })

    const after = snapshotLocalStorage(localStorage)
    assert.deepEqual(after, before)
  })

  it('serializes export payload as JSON', () => {
    const context = createDemoContext(new MemoryLocalStorage())
    const payload = buildEnvironmentExportPayload('admin@test', {
      context,
      exportedAt: '2026-07-07T10:00:00.000Z',
      readUsers: () => [],
      readCompanies: () => [],
      readOpportunities: () => [],
      readPostMatches: () => [],
      readNegotiations: () => [],
      readNegotiationMessages: () => [],
      readNegotiationOffers: () => [],
      readNegotiationTranscriptEvents: () => [],
      readCommercialAgreements: () => [],
      readContracts: () => [],
      readApplications: () => [],
      readAudit: () => [],
      readNotifications: () => [],
    })

    const serialized = serializeEnvironmentExportPayload(payload)
    const parsed = JSON.parse(serialized) as typeof payload
    assert.equal(parsed.metadata.exportType, EXPORT_TYPE)
    assert.ok(Array.isArray(parsed.users))
  })
})
