import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildEnvironmentMetadataSnapshot,
  canRenderScenarioRestoreControls,
} from '@/components/admin/environment-management-panel.tsx'

describe('EnvironmentManagementPanel helpers', () => {
  it('builds environment metadata snapshot with required fields', () => {
    const snapshot = buildEnvironmentMetadataSnapshot()
    assert.ok(snapshot.runtimeMode.length > 0)
    assert.ok(snapshot.storageType.length > 0)
    assert.ok(snapshot.namespace.length > 0)
    assert.ok(snapshot.seedVersion.length > 0)
    assert.ok(snapshot.bootstrappedAt.length > 0)
    assert.equal(typeof snapshot.recordCounts.opportunities, 'number')
  })

  it('hides restore controls in production mode', () => {
    assert.equal(canRenderScenarioRestoreControls('production'), false)
    assert.equal(canRenderScenarioRestoreControls('demo'), true)
    assert.equal(canRenderScenarioRestoreControls('uat'), true)
  })
})

