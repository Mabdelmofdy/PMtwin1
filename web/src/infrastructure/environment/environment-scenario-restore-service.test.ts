import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { NamespacedStorageAdapter } from '@/infrastructure/storage/namespaced-storage-adapter.ts'
import type { EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  ACTIVE_SCENARIO_KEY,
  readActiveScenarioState,
  restoreDemoScenario,
} from '@/infrastructure/environment/environment-scenario-restore-service.ts'
import { readEnvironmentBootstrapMetadata } from '@/infrastructure/environment/environment-bootstrap-service.ts'

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
  }
}

describe('restoreDemoScenario', () => {
  it('clears current namespace only', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    localStorage.setItem('PMTWIN_DEMO_some_key', JSON.stringify({ x: 1 }))
    localStorage.setItem('PMTWIN_UAT_some_key', JSON.stringify({ y: 1 }))

    restoreDemoScenario('cash-subcontracting', {
      context,
      appendAudit: () => {},
    })

    assert.equal(localStorage.getItem('PMTWIN_DEMO_some_key'), null)
    assert.equal(localStorage.getItem('PMTWIN_UAT_some_key') !== null, true)
  })

  it('reboots seed metadata after restore', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)

    restoreDemoScenario('joint-venture', {
      context,
      appendAudit: () => {},
    })

    const metadata = readEnvironmentBootstrapMetadata(context.storageAdapter)
    assert.equal(metadata?.mode, 'demo')
    assert.ok((metadata?.bootstrappedAt ?? '').length > 0)
  })

  it('applies selected scenario state', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)

    const result = restoreDemoScenario('marketplace', {
      context,
      appendAudit: () => {},
    })

    assert.equal(result.activeScenario.scenarioId, 'marketplace')
    assert.equal(result.activeScenario.seedSubsetRefs.length > 0, true)
    const activeScenario = readActiveScenarioState(context)
    assert.equal(activeScenario?.scenarioId, 'marketplace')
    assert.equal(localStorage.getItem(`PMTWIN_DEMO_${ACTIVE_SCENARIO_KEY}`) !== null, true)
  })

  it('writes scenario restored audit event', () => {
    const localStorage = new MemoryLocalStorage()
    const context = createDemoContext(localStorage)
    const auditEvents: Array<{ action: string; details: Record<string, unknown> }> = []

    restoreDemoScenario('hiring', {
      context,
      appendAudit: (entry) => {
        auditEvents.push({ action: entry.action, details: entry.details })
      },
    })

    assert.equal(auditEvents.length, 1)
    assert.equal(auditEvents[0]?.action, 'environment.scenario_restored')
    assert.equal(auditEvents[0]?.details.scenarioId, 'hiring')
  })
})

