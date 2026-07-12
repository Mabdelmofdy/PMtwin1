import { adminSettingsRepository } from '@/repositories/admin-settings-repository.ts'
import type { AdminSettingsDocument, AdminSettingsSections } from '@/domain/admin/settings/types.ts'
import { productFlags } from '@/config/product-flags.ts'
import { runtimeFeatureFlags } from '@/config/runtime-feature-flags.ts'
import { FEATURE_FLAG_REGISTRY } from '@/domain/admin/settings/feature-flag-registry.ts'

export function getEffectiveAdminSettings(): AdminSettingsDocument {
  return adminSettingsRepository.get()
}

export function getEffectiveSettingsSections(): AdminSettingsSections {
  return getEffectiveAdminSettings().sections
}

export type EffectiveProductFlags = {
  readonly showLegacyApplications: boolean
}

export function getEffectiveProductFlags(): EffectiveProductFlags {
  const overrides = getEffectiveAdminSettings().featureFlagOverrides
  return {
    showLegacyApplications:
      overrides.showLegacyApplications ?? productFlags.showLegacyApplications,
  }
}

export type EffectiveRuntimeFlagView = {
  readonly key: string
  readonly label: string
  readonly kind: 'editable' | 'locked'
  readonly value: boolean | string
  readonly reason?: string
  readonly group: 'product' | 'runtime'
}

export function listEffectiveFeatureFlags(): readonly EffectiveRuntimeFlagView[] {
  const overrides = getEffectiveAdminSettings().featureFlagOverrides
  return FEATURE_FLAG_REGISTRY.map((def) => {
    if (def.key === 'showLegacyApplications') {
      return {
        ...def,
        value: overrides.showLegacyApplications ?? productFlags.showLegacyApplications,
      }
    }
    if (def.key === 'showEnvironmentBanner') {
      return {
        ...def,
        value: overrides.showEnvironmentBanner ?? runtimeFeatureFlags.showEnvironmentBanner,
      }
    }
    if (def.key === 'runtimeMode') {
      return { ...def, value: runtimeFeatureFlags.runtimeMode }
    }
    if (def.key === 'usesNamespacedLocalStorage') {
      return { ...def, value: runtimeFeatureFlags.usesNamespacedLocalStorage }
    }
    if (def.key === 'storageTypeLabel') {
      return { ...def, value: runtimeFeatureFlags.storageTypeLabel }
    }
    return { ...def, value: def.defaultValue }
  })
}

export function getVettingSlaFromSettings(): {
  readonly atRiskDays: number
  readonly overdueDays: number
} {
  const vetting = getEffectiveSettingsSections().vetting
  return { atRiskDays: vetting.atRiskDays, overdueDays: vetting.overdueDays }
}

export function getMatchingConfigFromSettings(): {
  readonly CANDIDATE_MAX: number
  readonly POST_TO_POST_THRESHOLD: number
  readonly MIN_SKILL_SCORE_FOR_MATCH: number
} {
  const matching = getEffectiveSettingsSections().matching
  return {
    CANDIDATE_MAX: matching.candidateMax,
    POST_TO_POST_THRESHOLD: matching.postToPostThreshold,
    MIN_SKILL_SCORE_FOR_MATCH: matching.minSkillScoreForMatch,
  }
}
