import type {
  AdminSettingsDocument,
  AdminSettingsSections,
} from '@/domain/admin/settings/types.ts'
import { ADMIN_SETTINGS_SCHEMA_VERSION } from '@/domain/admin/settings/types.ts'

export const DEFAULT_ADMIN_SETTINGS_SECTIONS: AdminSettingsSections = {
  general: {
    platformDisplayName: 'PM-Twin',
    supportEmail: 'support@pm-twin.sa',
    defaultCountry: 'SA',
    defaultCurrency: 'SAR',
    timezone: 'Asia/Riyadh',
    dateFormat: 'gregorian',
    defaultLocale: 'en',
    registrationOpen: true,
    defaultLandingPath: '/marketplace',
  },
  access: {
    defaultInviteRole: 'member',
    invitationExpiryDays: 14,
    requireReasonOnSensitiveActions: true,
    localSessionIdleMinutes: 480,
    confirmDangerousAdminActions: true,
  },
  vetting: {
    atRiskDays: 3,
    overdueDays: 7,
    clarificationMaxRequests: 3,
    expiryWarningDays: 2,
    autoAssignReviewers: false,
    escalateAfterDays: 10,
    suspendOnComplianceFailure: false,
  },
  marketplace: {
    showUnimplementedTaxonomyGap: true,
    moderationRequireReason: true,
    featuredOpportunityHighlight: true,
    showClosedInAdminLists: true,
    showArchivedInAdminLists: true,
    adminDefaultVisibilityFilter: 'all_non_draft',
  },
  matching: {
    candidateMax: 200,
    postToPostThreshold: 0.5,
    minSkillScoreForMatch: 0.5,
    highMatchUiThreshold: 0.9,
    enableCircularMatchingUi: true,
  },
  readiness: {
    showReadinessWarningsInAdmin: true,
    warnBelowScore: 60,
  },
  commercial: {
    enabledCurrencies: ['SAR', 'USD'],
    defaultPaymentTermDays: 30,
    showVatInclusiveLabels: true,
    vatRatePercent: 15,
    requireAwardConfirmReason: true,
  },
  contract: {
    contractNumberPrefix: 'PMT',
    showLegalReviewBadge: true,
    signatureRequiredHint: true,
    expiryWarningDays: 14,
  },
  notifications: {
    inAppEnabled: true,
    notifyVettingOverdue: true,
    notifyMatchingCompleted: true,
    notifyAwardEvents: true,
    previewExternalTemplates: true,
  },
  localization: {
    enableEnglish: true,
    enableArabic: true,
    defaultDirection: 'auto',
    preferProductLanguageOverrides: true,
  },
  branding: {
    brandPrimaryColor: '#0F766E',
    brandAccentColor: '#C2410C',
    logoUrl: '',
    faviconUrl: '',
  },
}

export function createDefaultAdminSettingsDocument(
  updatedBy = 'system',
): AdminSettingsDocument {
  const now = new Date().toISOString()
  return {
    schemaVersion: ADMIN_SETTINGS_SCHEMA_VERSION,
    sections: structuredClone(DEFAULT_ADMIN_SETTINGS_SECTIONS),
    featureFlagOverrides: {},
    sectionMeta: {},
    updatedAt: now,
    updatedBy,
  }
}
