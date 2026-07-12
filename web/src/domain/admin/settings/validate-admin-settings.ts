import type {
  AdminSettingsMatching,
  AdminSettingsSectionId,
  AdminSettingsSections,
  AdminSettingsValidationResult,
  AdminSettingsVetting,
} from '@/domain/admin/settings/types.ts'
import { isLockedFeatureFlag } from '@/domain/admin/settings/feature-flag-registry.ts'

function err(errors: Record<string, string>, key: string, message: string): void {
  errors[key] = message
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(value)
}

export function validateAdminSettingsSection(
  sectionId: AdminSettingsSectionId,
  value: AdminSettingsSections[AdminSettingsSectionId],
): AdminSettingsValidationResult {
  const errors: Record<string, string> = {}

  switch (sectionId) {
    case 'general': {
      const v = value as AdminSettingsSections['general']
      if (!v.platformDisplayName.trim()) err(errors, 'platformDisplayName', 'Required')
      if (!validateEmail(v.supportEmail)) err(errors, 'supportEmail', 'Invalid email')
      if (!v.defaultCountry.trim()) err(errors, 'defaultCountry', 'Required')
      if (!v.defaultCurrency.trim()) err(errors, 'defaultCurrency', 'Required')
      if (!v.timezone.trim()) err(errors, 'timezone', 'Required')
      if (!v.defaultLandingPath.startsWith('/')) {
        err(errors, 'defaultLandingPath', 'Must start with /')
      }
      break
    }
    case 'access': {
      const v = value as AdminSettingsSections['access']
      if (v.invitationExpiryDays < 1 || v.invitationExpiryDays > 365) {
        err(errors, 'invitationExpiryDays', 'Must be 1–365')
      }
      if (v.localSessionIdleMinutes < 5 || v.localSessionIdleMinutes > 24 * 60) {
        err(errors, 'localSessionIdleMinutes', 'Must be 5–1440')
      }
      break
    }
    case 'vetting': {
      const v = value as AdminSettingsVetting
      if (v.atRiskDays < 1) err(errors, 'atRiskDays', 'Must be ≥ 1')
      if (v.overdueDays <= v.atRiskDays) {
        err(errors, 'overdueDays', 'Must be greater than at-risk days')
      }
      if (v.clarificationMaxRequests < 1 || v.clarificationMaxRequests > 20) {
        err(errors, 'clarificationMaxRequests', 'Must be 1–20')
      }
      break
    }
    case 'matching': {
      const v = value as AdminSettingsMatching
      if (v.candidateMax < 10 || v.candidateMax > 1000) {
        err(errors, 'candidateMax', 'Must be 10–1000')
      }
      if (v.postToPostThreshold < 0 || v.postToPostThreshold > 1) {
        err(errors, 'postToPostThreshold', 'Must be 0–1')
      }
      if (v.minSkillScoreForMatch < 0 || v.minSkillScoreForMatch > 1) {
        err(errors, 'minSkillScoreForMatch', 'Must be 0–1')
      }
      if (v.highMatchUiThreshold < 0 || v.highMatchUiThreshold > 1) {
        err(errors, 'highMatchUiThreshold', 'Must be 0–1')
      }
      break
    }
    case 'readiness': {
      const v = value as AdminSettingsSections['readiness']
      if (v.warnBelowScore < 0 || v.warnBelowScore > 100) {
        err(errors, 'warnBelowScore', 'Must be 0–100')
      }
      break
    }
    case 'commercial': {
      const v = value as AdminSettingsSections['commercial']
      if (!v.enabledCurrencies.length) err(errors, 'enabledCurrencies', 'At least one currency')
      if (v.vatRatePercent < 0 || v.vatRatePercent > 100) {
        err(errors, 'vatRatePercent', 'Must be 0–100')
      }
      if (v.defaultPaymentTermDays < 0) {
        err(errors, 'defaultPaymentTermDays', 'Must be ≥ 0')
      }
      break
    }
    case 'contract': {
      const v = value as AdminSettingsSections['contract']
      if (!v.contractNumberPrefix.trim()) err(errors, 'contractNumberPrefix', 'Required')
      if (v.expiryWarningDays < 1) err(errors, 'expiryWarningDays', 'Must be ≥ 1')
      break
    }
    case 'branding': {
      const v = value as AdminSettingsSections['branding']
      if (!validateHexColor(v.brandPrimaryColor)) {
        err(errors, 'brandPrimaryColor', 'Use #RRGGBB')
      }
      if (!validateHexColor(v.brandAccentColor)) {
        err(errors, 'brandAccentColor', 'Use #RRGGBB')
      }
      break
    }
    case 'localization': {
      const v = value as AdminSettingsSections['localization']
      if (!v.enableEnglish && !v.enableArabic) {
        err(errors, 'enableEnglish', 'At least one locale must be enabled')
      }
      break
    }
    default:
      break
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateFeatureFlagOverrides(
  overrides: Readonly<Record<string, boolean>>,
): AdminSettingsValidationResult {
  const errors: Record<string, string> = {}
  for (const key of Object.keys(overrides)) {
    if (isLockedFeatureFlag(key)) {
      err(errors, key, 'Locked architectural flag cannot be changed')
    }
  }
  return { ok: Object.keys(errors).length === 0, errors }
}
