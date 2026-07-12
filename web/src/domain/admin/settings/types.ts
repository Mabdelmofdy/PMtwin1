/**
 * Demo/UAT Admin Settings — typed configuration persisted in namespaced overrides.
 * LocalStorage is the authoritative persistence layer for Demo/UAT (no backend).
 */

export const ADMIN_SETTINGS_SCHEMA_VERSION = '1.0' as const

export type AdminSettingsSectionId =
  | 'general'
  | 'access'
  | 'vetting'
  | 'marketplace'
  | 'matching'
  | 'readiness'
  | 'commercial'
  | 'contract'
  | 'notifications'
  | 'localization'
  | 'branding'

export type AdminSettingsGeneral = {
  readonly platformDisplayName: string
  readonly supportEmail: string
  readonly defaultCountry: string
  readonly defaultCurrency: string
  readonly timezone: string
  readonly dateFormat: 'gregorian' | 'gregorian_hijri'
  readonly defaultLocale: 'en' | 'ar'
  readonly registrationOpen: boolean
  readonly defaultLandingPath: string
}

export type AdminSettingsAccess = {
  readonly defaultInviteRole: string
  readonly invitationExpiryDays: number
  readonly requireReasonOnSensitiveActions: boolean
  readonly localSessionIdleMinutes: number
  readonly confirmDangerousAdminActions: boolean
}

export type AdminSettingsVetting = {
  readonly atRiskDays: number
  readonly overdueDays: number
  readonly clarificationMaxRequests: number
  readonly expiryWarningDays: number
  readonly autoAssignReviewers: boolean
  readonly escalateAfterDays: number
  readonly suspendOnComplianceFailure: boolean
}

export type AdminSettingsMarketplace = {
  /** Display enablement only — does not invent taxonomy models. */
  readonly showUnimplementedTaxonomyGap: boolean
  readonly moderationRequireReason: boolean
  readonly featuredOpportunityHighlight: boolean
  readonly showClosedInAdminLists: boolean
  readonly showArchivedInAdminLists: boolean
  /** Public marketplace remains published-only; this only affects Admin list filters default. */
  readonly adminDefaultVisibilityFilter: 'published' | 'all_non_draft'
}

export type AdminSettingsMatching = {
  readonly candidateMax: number
  readonly postToPostThreshold: number
  readonly minSkillScoreForMatch: number
  readonly highMatchUiThreshold: number
  readonly enableCircularMatchingUi: boolean
}

export type AdminSettingsReadiness = {
  /** Presentation preferences — does not rewrite readiness engine thresholds. */
  readonly showReadinessWarningsInAdmin: boolean
  readonly warnBelowScore: number
}

export type AdminSettingsCommercial = {
  readonly enabledCurrencies: readonly string[]
  readonly defaultPaymentTermDays: number
  readonly showVatInclusiveLabels: boolean
  readonly vatRatePercent: number
  readonly requireAwardConfirmReason: boolean
}

export type AdminSettingsContract = {
  readonly contractNumberPrefix: string
  readonly showLegalReviewBadge: boolean
  readonly signatureRequiredHint: boolean
  readonly expiryWarningDays: number
}

export type AdminSettingsNotifications = {
  readonly inAppEnabled: boolean
  readonly notifyVettingOverdue: boolean
  readonly notifyMatchingCompleted: boolean
  readonly notifyAwardEvents: boolean
  /** External channels are preview-only in Demo/UAT (no delivery integration). */
  readonly previewExternalTemplates: boolean
}

export type AdminSettingsLocalization = {
  readonly enableEnglish: boolean
  readonly enableArabic: boolean
  readonly defaultDirection: 'ltr' | 'rtl' | 'auto'
  readonly preferProductLanguageOverrides: boolean
}

export type AdminSettingsBranding = {
  readonly brandPrimaryColor: string
  readonly brandAccentColor: string
  readonly logoUrl: string
  readonly faviconUrl: string
}

export type AdminSettingsSections = {
  readonly general: AdminSettingsGeneral
  readonly access: AdminSettingsAccess
  readonly vetting: AdminSettingsVetting
  readonly marketplace: AdminSettingsMarketplace
  readonly matching: AdminSettingsMatching
  readonly readiness: AdminSettingsReadiness
  readonly commercial: AdminSettingsCommercial
  readonly contract: AdminSettingsContract
  readonly notifications: AdminSettingsNotifications
  readonly localization: AdminSettingsLocalization
  readonly branding: AdminSettingsBranding
}

export type AdminSettingsSectionMeta = {
  readonly updatedAt: string
  readonly updatedBy: string
  readonly updatedByRole?: string
}

export type AdminSettingsDocument = {
  readonly schemaVersion: typeof ADMIN_SETTINGS_SCHEMA_VERSION | string
  readonly sections: AdminSettingsSections
  /** Overrides for editable Demo/UAT feature flags only. */
  readonly featureFlagOverrides: Readonly<Record<string, boolean>>
  readonly sectionMeta: Readonly<Partial<Record<AdminSettingsSectionId | 'feature_flags', AdminSettingsSectionMeta>>>
  readonly updatedAt: string
  readonly updatedBy: string
}

export type AdminSettingsValidationResult = {
  readonly ok: boolean
  readonly errors: Readonly<Record<string, string>>
}

export type AdminSettingsChangeEvent = {
  readonly section: AdminSettingsSectionId | 'feature_flags'
  readonly actorId: string
  readonly actorRole: string
  readonly environment: string
  readonly previous: unknown
  readonly next: unknown
  readonly reason?: string
  readonly changedFields: readonly string[]
}

export type AdminSettingsDefinition = {
  readonly id: AdminSettingsSectionId
  readonly title: string
  readonly description: string
  readonly capability: string
  readonly auditAction: string
}
