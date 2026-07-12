import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { IStorageAdapter } from '@/types/storage.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'
import {
  AdminSettingsRepository,
  replaceAdminSettingsRepositoryForTests,
} from '@/repositories/admin-settings-repository.ts'
import {
  executeUpdateAdminSettingsSection,
  executeUpdateFeatureFlag,
  getEffectiveProductFlags,
  getMatchingConfigFromSettings,
  getVettingSlaFromSettings,
  validateAdminSettingsSection,
  createDefaultAdminSettingsDocument,
} from '@/domain/admin/settings/index.ts'
import { buildEnvironmentSnapshotOverrides } from '@/infrastructure/environment/environment-snapshot-overrides.ts'
import { resetMatchingEngineContextCacheForTests } from '@/infrastructure/matching/matching-engine-context.ts'
import { getMatchingEngineContext } from '@/infrastructure/matching/matching-engine-context.ts'
import { resolveVettingSlaStatus } from '@/lib/vetting-sla-service.ts'
import type { PlatformUser } from '@/types/domain.ts'
import type { EnvironmentExportPayload } from '@/infrastructure/environment/environment-export-service.ts'
import {
  loadApplications,
  loadAuditLog,
  loadCommercialAgreements,
  loadCompanies,
  loadContracts,
  loadNegotiations,
  loadNegotiationMessages,
  loadNegotiationOffers,
  loadNegotiationTranscriptEvents,
  loadNotifications,
  loadOpportunities,
  loadPostMatches,
  loadUsers,
} from '@/infrastructure/seed/seed-loader.ts'

class MemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, structuredClone(value))
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

function installMemorySettingsRepo(): {
  storage: MemoryStorageAdapter
  repo: AdminSettingsRepository
} {
  const storage = new MemoryStorageAdapter()
  const repo = new AdminSettingsRepository(storage)
  replaceAdminSettingsRepositoryForTests(repo)
  resetMatchingEngineContextCacheForTests()
  return { storage, repo }
}

describe('admin settings Demo/UAT', () => {
  beforeEach(() => {
    installMemorySettingsRepo()
  })

  it('persists section updates in namespaced overrides', () => {
    const { storage, repo } = installMemorySettingsRepo()
    const result = executeUpdateAdminSettingsSection({
      sectionId: 'general',
      value: {
        ...createDefaultAdminSettingsDocument().sections.general,
        platformDisplayName: 'PM-Twin UAT Lab',
      },
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    assert.equal(result.ok, true)
    const stored = storage.get<{
      adminSettings?: { sections: { general: { platformDisplayName: string } } }
    }>(OVERRIDES_KEY)
    assert.equal(stored?.adminSettings?.sections.general.platformDisplayName, 'PM-Twin UAT Lab')
    assert.equal(repo.get().sections.general.platformDisplayName, 'PM-Twin UAT Lab')
  })

  it('rejects invalid vetting SLA values', () => {
    const validation = validateAdminSettingsSection('vetting', {
      ...createDefaultAdminSettingsDocument().sections.vetting,
      atRiskDays: 5,
      overdueDays: 3,
    })
    assert.equal(validation.ok, false)
    assert.ok(validation.errors.overdueDays)
  })

  it('denies auditor mutations', () => {
    const result = executeUpdateAdminSettingsSection({
      sectionId: 'general',
      value: createDefaultAdminSettingsDocument().sections.general,
      actorId: 'auditor-1',
      actorRole: 'auditor',
    })
    assert.equal(result.ok, false)
  })

  it('allows authorized admin to edit supported settings', () => {
    const { repo } = installMemorySettingsRepo()
    const result = executeUpdateAdminSettingsSection({
      sectionId: 'matching',
      value: {
        ...createDefaultAdminSettingsDocument().sections.matching,
        candidateMax: 150,
      },
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    assert.equal(result.ok, true)
    assert.equal(repo.get().sections.matching.candidateMax, 150)
  })

  it('rejects locked feature flag updates', () => {
    const result = executeUpdateFeatureFlag({
      key: 'runtimeMode',
      value: true,
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    assert.equal(result.ok, false)
  })

  it('persists editable feature flags', () => {
    const result = executeUpdateFeatureFlag({
      key: 'showLegacyApplications',
      value: true,
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    assert.equal(result.ok, true)
    assert.equal(getEffectiveProductFlags().showLegacyApplications, true)
  })

  it('includes adminSettings in environment snapshot overrides', () => {
    const { repo } = installMemorySettingsRepo()
    executeUpdateAdminSettingsSection({
      sectionId: 'general',
      value: {
        ...createDefaultAdminSettingsDocument().sections.general,
        supportEmail: 'uat-support@pm-twin.sa',
      },
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    const settings = repo.get()
    const payload = {
      metadata: {
        exportType: 'pmtwin-environment-export',
        schemaVersion: '1.0',
        applicationVersion: 'dev',
        seedVersion: '1',
        runtimeMode: 'demo',
        exportedBy: 'admin-1',
        exportedAt: new Date().toISOString(),
      },
      users: loadUsers(),
      companies: loadCompanies(),
      opportunities: loadOpportunities(),
      postMatches: loadPostMatches(),
      negotiations: loadNegotiations(),
      negotiationMessages: loadNegotiationMessages(),
      negotiationOffers: loadNegotiationOffers(),
      negotiationTranscriptEvents: loadNegotiationTranscriptEvents(),
      commercialAgreements: loadCommercialAgreements(),
      contracts: loadContracts(),
      applications: loadApplications(),
      audit: loadAuditLog(),
      notifications: loadNotifications(),
      adminSettings: settings,
    } as EnvironmentExportPayload

    const overrides = buildEnvironmentSnapshotOverrides(payload)
    assert.equal(overrides.adminSettings?.sections.general.supportEmail, 'uat-support@pm-twin.sa')
  })

  it('reset to defaults clears custom values', () => {
    const { repo } = installMemorySettingsRepo()
    executeUpdateAdminSettingsSection({
      sectionId: 'general',
      value: {
        ...createDefaultAdminSettingsDocument().sections.general,
        platformDisplayName: 'Custom',
      },
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    repo.resetToDefaults('admin-1')
    assert.equal(repo.get().sections.general.platformDisplayName, 'PM-Twin')
  })

  it('matching adapter consumes settings thresholds without algorithm change', () => {
    executeUpdateAdminSettingsSection({
      sectionId: 'matching',
      value: {
        ...createDefaultAdminSettingsDocument().sections.matching,
        candidateMax: 77,
        postToPostThreshold: 0.61,
      },
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    assert.equal(getMatchingConfigFromSettings().CANDIDATE_MAX, 77)
    resetMatchingEngineContextCacheForTests()
    const ctx = getMatchingEngineContext()
    assert.equal(ctx.config.CANDIDATE_MAX, 77)
    assert.equal(ctx.config.POST_TO_POST_THRESHOLD, 0.61)
  })

  it('vetting SLA consumes settings', () => {
    executeUpdateAdminSettingsSection({
      sectionId: 'vetting',
      value: {
        ...createDefaultAdminSettingsDocument().sections.vetting,
        atRiskDays: 1,
        overdueDays: 2,
      },
      actorId: 'admin-1',
      actorRole: 'admin',
    })
    assert.equal(getVettingSlaFromSettings().overdueDays, 2)
    const createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const user = {
      id: 'u1',
      status: 'pending_vetting',
      createdAt,
      profile: {},
    } as PlatformUser
    assert.equal(resolveVettingSlaStatus(user), 'overdue')
  })

  it('does not introduce Match Type settings keys', () => {
    const doc = createDefaultAdminSettingsDocument()
    const serialized = JSON.stringify(doc)
    assert.equal(serialized.includes('matchType'), false)
    assert.equal(serialized.includes('Match Type'), false)
  })
})
