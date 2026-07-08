import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { NamespacedStorageAdapter } from '@/infrastructure/storage/namespaced-storage-adapter.ts'
import type { EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  BOOTSTRAP_METADATA_KEY,
  readEnvironmentBootstrapMetadata,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'
import { ACTIVE_SCENARIO_KEY } from '@/infrastructure/environment/environment-scenario-restore-service.ts'
import {
  EnvironmentResetError,
  ENVIRONMENT_RESET_STORAGE_KEYS,
  hasEnvironmentResetStorage,
  resetEnvironment,
} from '@/infrastructure/environment/environment-reset-service.ts'
import { buildEnvironmentSnapshotOverrides } from '@/infrastructure/environment/environment-snapshot-overrides.ts'
import {
  EXPORT_SCHEMA_VERSION,
  EXPORT_TYPE,
} from '@/infrastructure/environment/environment-export-service.ts'
import { loadUsers } from '@/infrastructure/seed/seed-loader.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import {
  NEGOTIATION_MESSAGES_STORAGE_KEY,
  NEGOTIATION_OFFERS_STORAGE_KEY,
  NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
} from '@/types/negotiation-discussion.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'

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

function seedImportedEnvironmentState(context: EnvironmentContext): void {
  const storage = context.storageAdapter

  storage.set(
    OVERRIDES_KEY,
    buildEnvironmentSnapshotOverrides({
      metadata: {
        exportType: EXPORT_TYPE,
        schemaVersion: EXPORT_SCHEMA_VERSION,
        applicationVersion: 'dev',
        seedVersion: '1.0.0',
        runtimeMode: 'demo',
        exportedBy: 'test',
        exportedAt: '2026-07-07T00:00:00.000Z',
      },
      users: [
        {
          id: 'import-only-user',
          email: 'import-only@test',
          role: 'admin',
          status: 'active',
        },
      ],
      companies: [],
      opportunities: [],
      postMatches: [],
      negotiations: [],
      negotiationMessages: [],
      negotiationOffers: [],
      negotiationTranscriptEvents: [],
      commercialAgreements: [],
      contracts: [],
      applications: [],
      audit: [{ id: 'import-audit', action: 'imported', timestamp: '2026-07-07T00:00:00.000Z' }],
      notifications: [],
    }),
  )
  storage.set(BOOTSTRAP_METADATA_KEY, {
    bootstrappedAt: '2026-01-01T00:00:00.000Z',
    seedVersion: '9.9.9',
    mode: 'demo',
    appVersion: 'imported',
  })
  storage.set(ACTIVE_SCENARIO_KEY, {
    scenarioId: 'marketplace',
    restoredAt: '2026-07-07T00:00:00.000Z',
    runtimeMode: 'demo',
    seedSubsetRefs: [],
    entityPatchSet: null,
  })
  storage.set(NEGOTIATION_MESSAGES_STORAGE_KEY, [{ id: 'msg-import', negotiationId: 'neg-1', body: 'Hi' }])
  storage.set(NEGOTIATION_OFFERS_STORAGE_KEY, [{ id: 'offer-import', negotiationId: 'neg-1', version: 1 }])
  storage.set(NEGOTIATION_TRANSCRIPT_STORAGE_KEY, [{ id: 'event-import', negotiationId: 'neg-1' }])
}

describe('resetEnvironment', () => {
  it('clears current namespace only', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    seedImportedEnvironmentState(context)
    localStorage.setItem('PMTWIN_DEMO_stale_key', JSON.stringify({ stale: true }))
    localStorage.setItem('PMTWIN_UAT_preserved_key', JSON.stringify({ preserved: true }))

    resetEnvironment({
      context,
      appendAudit: () => {},
    })

    assert.equal(localStorage.getItem('PMTWIN_DEMO_stale_key'), null)
    assert.equal(localStorage.getItem('PMTWIN_UAT_preserved_key') !== null, true)
  })

  it('does not clear other namespace', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    localStorage.setItem('PMTWIN_UAT_other_namespace', JSON.stringify({ keep: true }))

    resetEnvironment({
      context,
      appendAudit: () => {},
    })

    assert.equal(localStorage.getItem('PMTWIN_UAT_other_namespace') !== null, true)
  })

  it('removes tombstones and imported snapshots', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    seedImportedEnvironmentState(context)

    const overridesBefore = context.storageAdapter.get<Record<string, unknown>>(OVERRIDES_KEY)
    assert.ok(overridesBefore?.deletedUsers)
    assert.ok(overridesBefore?.auditSnapshot)

    resetEnvironment({
      context,
      appendAudit: () => {},
    })

    const overridesAfter = context.storageAdapter.get(OVERRIDES_KEY)
    assert.equal(overridesAfter, null)
    assert.equal(context.storageAdapter.get(ACTIVE_SCENARIO_KEY), null)
    assert.equal(context.storageAdapter.get(NEGOTIATION_MESSAGES_STORAGE_KEY), null)
    assert.equal(context.storageAdapter.get(NEGOTIATION_OFFERS_STORAGE_KEY), null)
    assert.equal(context.storageAdapter.get(NEGOTIATION_TRANSCRIPT_STORAGE_KEY), null)
  })

  it('removes active scenario state', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    context.storageAdapter.set(ACTIVE_SCENARIO_KEY, {
      scenarioId: 'hiring',
      restoredAt: '2026-07-07T00:00:00.000Z',
      runtimeMode: 'demo',
      seedSubsetRefs: [],
      entityPatchSet: null,
    })

    resetEnvironment({
      context,
      appendAudit: () => {},
    })

    assert.equal(context.storageAdapter.get(ACTIVE_SCENARIO_KEY), null)
  })

  it('reboots seed metadata', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    context.storageAdapter.set(BOOTSTRAP_METADATA_KEY, {
      bootstrappedAt: '2020-01-01T00:00:00.000Z',
      seedVersion: '0.0.1',
      mode: 'demo',
      appVersion: 'stale',
    })

    const bootstrap = resetEnvironment({
      context,
      appendAudit: () => {},
    })

    assert.equal(bootstrap.seedVersion, '1.0.0')
    assert.notEqual(bootstrap.bootstrappedAt, '2020-01-01T00:00:00.000Z')
    assert.equal(readEnvironmentBootstrapMetadata(context.storageAdapter)?.mode, 'demo')
  })

  it('writes reset audit event', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    const auditEvents: Array<{ action: string; details: Record<string, unknown> }> = []

    resetEnvironment({
      context,
      appendAudit: (entry) => {
        auditEvents.push({ action: entry.action, details: entry.details })
      },
    })

    assert.equal(auditEvents.length, 1)
    assert.equal(auditEvents[0]?.action, 'environment.reset')
    assert.equal(auditEvents[0]?.details.runtimeMode, 'demo')
  })

  it('is blocked in production', () => {
    assert.throws(
      () =>
        resetEnvironment({
          context: createProductionContext(),
          appendAudit: () => {},
        }),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentResetError)
        assert.equal(error.code, 'BLOCKED_PRODUCTION')
        return true
      },
    )
  })

  it('restores seed records and removes imported-only records', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    const repository = new UserRepository(context.storageAdapter, loadUsers)
    seedImportedEnvironmentState(context)

    assert.equal(repository.getAll().some((user) => user.id === 'import-only-user'), true)
    assert.equal(repository.getAll().some((user) => user.id === loadUsers()[0]!.id), false)

    resetEnvironment({
      context,
      appendAudit: () => {},
    })

    const users = repository.getAll()
    assert.equal(users.some((user) => user.id === 'import-only-user'), false)
    assert.equal(users.some((user) => user.id === loadUsers()[0]!.id), true)
    assert.equal(users.length, loadUsers().length)
  })

  it('only retains bootstrap metadata after reset', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    seedImportedEnvironmentState(context)

    resetEnvironment({
      context,
      appendAudit: () => {},
    })

    for (const key of ENVIRONMENT_RESET_STORAGE_KEYS) {
      if (key === BOOTSTRAP_METADATA_KEY) {
        assert.ok(context.storageAdapter.get(key) !== null)
      } else {
        assert.equal(context.storageAdapter.get(key), null, `expected cleared key: ${key}`)
      }
    }

    assert.equal(hasEnvironmentResetStorage(context.storageAdapter), true)
  })
})
