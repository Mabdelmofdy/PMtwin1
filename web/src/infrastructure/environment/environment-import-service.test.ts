import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { NamespacedStorageAdapter } from '@/infrastructure/storage/namespaced-storage-adapter.ts'
import type { EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  EXPORT_SCHEMA_VERSION,
  EXPORT_TYPE,
  type EnvironmentExportPayload,
} from '@/infrastructure/environment/environment-export-service.ts'
import {
  EnvironmentImportError,
  importEnvironmentData,
  parseEnvironmentImportJson,
  readImportedEnvironmentCollections,
  validateEnvironmentImportPayload,
} from '@/infrastructure/environment/environment-import-service.ts'
import { readEnvironmentBootstrapMetadata } from '@/infrastructure/environment/environment-bootstrap-service.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import { NEGOTIATION_MESSAGES_STORAGE_KEY } from '@/types/negotiation-discussion.ts'

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
  return {
    runtimeMode: 'demo',
    storageType: 'LocalStorage',
    namespace: 'PMTWIN_DEMO_',
    storageAdapter: new NamespacedStorageAdapter(new LocalStorageAdapter(), 'PMTWIN_DEMO_'),
    canRestoreScenario: true,
    canExportEnvironment: true,
    canImportEnvironment: true,
    canResetEnvironment: true,
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
    canImportEnvironment: false,
    canResetEnvironment: false,
  }
}

function buildValidImportPayload(): EnvironmentExportPayload {
  return {
    metadata: {
      exportType: EXPORT_TYPE,
      schemaVersion: EXPORT_SCHEMA_VERSION,
      applicationVersion: 'dev',
      seedVersion: '1.0.0',
      runtimeMode: 'demo',
      exportedBy: 'admin@test',
      exportedAt: '2026-07-07T10:00:00.000Z',
    },
    users: [{ id: 'user-1', email: 'user@test', role: 'admin', status: 'active' }],
    companies: [{ id: 'company-1', email: 'co@test', role: 'company_owner', status: 'active' }],
    opportunities: [
      {
        id: 'opp-1',
        title: 'Need',
        status: 'published',
        modelType: 'project_based',
        subModelType: 'task_based',
        mainCollaborationModel: 'cash_subcontracting',
        exchangeMode: 'cash',
      },
    ],
    postMatches: [
      {
        id: 'pm-1',
        matchType: 'one_way',
        status: 'discovered',
        matchScore: 80,
        participants: [],
      },
    ],
    negotiations: [{ id: 'neg-1', status: 'active' }],
    negotiationMessages: [
      {
        id: 'msg-1',
        negotiationId: 'neg-1',
        senderId: 'user-1',
        senderRole: 'admin',
        body: 'Hi',
        visibility: 'participants',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    negotiationOffers: [
      {
        id: 'offer-1',
        negotiationId: 'neg-1',
        submittedBy: 'user-1',
        version: 1,
        status: 'submitted',
        createdAt: '2026-01-01T00:00:00.000Z',
        terms: { mode: 'cash' },
      },
    ],
    negotiationTranscriptEvents: [
      {
        id: 'event-1',
        negotiationId: 'neg-1',
        eventType: 'message.sent',
        actorId: 'user-1',
        actorRole: 'admin',
        timestamp: '2026-01-01T00:00:00.000Z',
        summary: 'Message sent',
      },
    ],
    commercialAgreements: [
      {
        id: 'deal-1',
        negotiationId: 'neg-1',
        opportunityId: 'opp-1',
        title: 'Deal',
        status: 'draft',
        participants: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    contracts: [
      {
        id: 'contract-1',
        participants: [],
        status: 'draft',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    applications: [{ id: 'app-1', opportunityId: 'opp-1', applicantId: 'user-1', status: 'submitted' }],
    audit: [{ id: 'audit-1', action: 'test.action', timestamp: '2026-01-01T00:00:00.000Z' }],
    notifications: [
      {
        id: 'notif-1',
        userId: 'user-1',
        title: 'Alert',
        message: 'Hello',
        read: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  }
}

describe('validateEnvironmentImportPayload', () => {
  it('rejects invalid JSON', () => {
    assert.throws(
      () => parseEnvironmentImportJson('{not-json'),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'INVALID_JSON')
        return true
      },
    )
  })

  it('rejects wrong exportType', () => {
    const payload = buildValidImportPayload()
    payload.metadata.exportType = 'wrong-type' as typeof EXPORT_TYPE

    assert.throws(
      () => validateEnvironmentImportPayload(payload),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'INVALID_EXPORT_TYPE')
        return true
      },
    )
  })

  it('rejects incompatible schemaVersion', () => {
    const payload = buildValidImportPayload()
    payload.metadata.schemaVersion = '2.0'

    assert.throws(
      () => validateEnvironmentImportPayload(payload),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'INCOMPATIBLE_SCHEMA')
        return true
      },
    )
  })

  it('rejects missing collections', () => {
    const payload = buildValidImportPayload() as unknown as Record<string, unknown>
    delete payload.users

    assert.throws(
      () => validateEnvironmentImportPayload(payload),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'MISSING_COLLECTIONS')
        return true
      },
    )
  })

  it('rejects invalid taxonomy', () => {
    const payload = buildValidImportPayload()
    payload.opportunities = [
      {
        ...payload.opportunities[0]!,
        subModelType: 'one_way',
      },
    ]

    assert.throws(
      () => validateEnvironmentImportPayload(payload),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'TAXONOMY')
        return true
      },
    )
  })
})

describe('importEnvironmentData', () => {
  it('valid import restores all collections', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    const payload = buildValidImportPayload()
    const json = JSON.stringify(payload)

    importEnvironmentData(json, { confirmed: true, importedBy: 'admin@test' }, {
      context,
      importedAt: '2026-07-07T11:00:00.000Z',
      appendAudit: () => {},
    })

    const restored = readImportedEnvironmentCollections(context.storageAdapter)
    assert.ok(restored.overrides)
    assert.equal(restored.overrides?.newUsers?.length, 1)
    assert.equal(restored.overrides?.newUsers?.[0]?.id, 'user-1')
    assert.equal(restored.overrides?.newOpportunities?.length, 1)
    assert.equal(restored.overrides?.newOpportunities?.[0]?.id, 'opp-1')
    assert.equal(restored.overrides?.newApplications?.length, 1)
    assert.equal(restored.negotiationMessages.length, 1)
    assert.equal(restored.negotiationOffers.length, 1)
    assert.equal(restored.negotiationTranscriptEvents.length, 1)

    const bootstrap = readEnvironmentBootstrapMetadata(context.storageAdapter)
    assert.equal(bootstrap?.seedVersion, '1.0.0')
    assert.equal(bootstrap?.bootstrappedAt, '2026-07-07T11:00:00.000Z')
  })

  it('import clears current namespace first', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    localStorage.setItem('PMTWIN_DEMO_existing_key', JSON.stringify({ stale: true }))
    localStorage.setItem('PMTWIN_UAT_other_namespace', JSON.stringify({ keep: true }))

    importEnvironmentData(JSON.stringify(buildValidImportPayload()), {
      confirmed: true,
      importedBy: 'admin@test',
    }, {
      context,
      importedAt: '2026-07-07T11:00:00.000Z',
      appendAudit: () => {},
    })

    assert.equal(localStorage.getItem('PMTWIN_DEMO_existing_key'), null)
    assert.equal(localStorage.getItem('PMTWIN_UAT_other_namespace') !== null, true)
    assert.equal(localStorage.getItem(`PMTWIN_DEMO_${OVERRIDES_KEY}`) !== null, true)
  })

  it('import writes audit event', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    const auditEvents: Array<{ action: string; details: Record<string, unknown> }> = []

    importEnvironmentData(JSON.stringify(buildValidImportPayload()), {
      confirmed: true,
      importedBy: 'admin@test',
    }, {
      context,
      importedAt: '2026-07-07T11:00:00.000Z',
      appendAudit: (entry) => {
        auditEvents.push({ action: entry.action, details: entry.details })
      },
    })

    assert.equal(auditEvents.length, 1)
    assert.equal(auditEvents[0]?.action, 'environment.imported')
    assert.equal(auditEvents[0]?.details.importedBy, 'admin@test')
    assert.equal(auditEvents[0]?.details.runtimeMode, 'demo')
  })

  it('import blocked in production', () => {
    assert.throws(
      () =>
        importEnvironmentData(JSON.stringify(buildValidImportPayload()), {
          confirmed: true,
          importedBy: 'admin@test',
        }, {
          context: createProductionContext(),
          importedAt: '2026-07-07T11:00:00.000Z',
          appendAudit: () => {},
        }),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'BLOCKED_PRODUCTION')
        return true
      },
    )
  })

  it('failed import does not mutate namespace', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    localStorage.setItem(
      `PMTWIN_DEMO_${OVERRIDES_KEY}`,
      JSON.stringify({ users: { 'seed-user': { status: 'active' } } }),
    )
    localStorage.setItem(
      `PMTWIN_DEMO_${NEGOTIATION_MESSAGES_STORAGE_KEY}`,
      JSON.stringify([{ id: 'keep-msg' }]),
    )
    const before = snapshotLocalStorage(localStorage)

    const invalidPayload = buildValidImportPayload()
    invalidPayload.metadata.schemaVersion = '9.9'

    assert.throws(
      () =>
        importEnvironmentData(JSON.stringify(invalidPayload), {
          confirmed: true,
          importedBy: 'admin@test',
        }, {
          context,
          importedAt: '2026-07-07T11:00:00.000Z',
          appendAudit: () => {},
        }),
      /schemaVersion/,
    )

    const after = snapshotLocalStorage(localStorage)
    assert.deepEqual(after, before)
  })

  it('requires overwrite confirmation before restore', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)

    assert.throws(
      () =>
        importEnvironmentData(JSON.stringify(buildValidImportPayload()), {
          confirmed: false,
          importedBy: 'admin@test',
        }, {
          context,
          importedAt: '2026-07-07T11:00:00.000Z',
          appendAudit: () => {},
        }),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentImportError)
        assert.equal(error.code, 'NOT_CONFIRMED')
        return true
      },
    )

    assert.equal(localStorage.getItem(`PMTWIN_DEMO_${OVERRIDES_KEY}`), null)
  })
})
