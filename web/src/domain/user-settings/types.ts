export const USER_SETTINGS_SCHEMA_VERSION = '1.0' as const

export type ContactOptIns = {
  readonly email: boolean
  readonly sms: boolean
  readonly whatsapp: boolean
}

export type PrivacySettings = {
  readonly contactOptIns: ContactOptIns
  readonly publicProfile: {
    readonly published: boolean
    readonly showPhone: boolean
    readonly showWebsite: boolean
    readonly showLinkedIn: boolean
    readonly showSocialLinks: boolean
  }
}

export type InAppNotificationCategories = {
  readonly matching: boolean
  readonly applications: boolean
  readonly negotiations: boolean
  readonly commercial: boolean
  readonly account: boolean
}

export type NotificationSettings = {
  readonly inApp: InAppNotificationCategories
}

export type InterfaceDirection = 'auto' | 'ltr' | 'rtl'
export type InterfaceTheme = 'system' | 'light' | 'dark'
export type InterfaceDensity = 'comfortable' | 'compact'

export type InterfaceSettings = {
  readonly direction: InterfaceDirection
  readonly theme: InterfaceTheme
  readonly density: InterfaceDensity
}

export type PrivateMatchingPreferences = {
  readonly participateInMatching: boolean
  readonly allowProfileDiscovery: boolean
  readonly receiveRecommendations: boolean
}

export type UserSettingsPreferences = {
  readonly privacy: PrivacySettings
  readonly notifications: NotificationSettings
  readonly interface: InterfaceSettings
  readonly matching: PrivateMatchingPreferences
}

export type UnavailableSecurityCapability = {
  readonly availability: 'unavailable'
  readonly reason: 'requires_backend_identity_provider'
}

export type SecurityCapabilities = {
  readonly passwordChange: UnavailableSecurityCapability
  readonly multiFactorAuthentication: UnavailableSecurityCapability
  readonly sessionManagement: UnavailableSecurityCapability
}

export type UserSettingsDocument = UserSettingsPreferences & {
  readonly schemaVersion: typeof USER_SETTINGS_SCHEMA_VERSION
  readonly userId: string
  readonly securityCapabilities: SecurityCapabilities
  readonly createdAt: string
  readonly updatedAt: string
}

export type UserSettingsValidationResult =
  | {
      readonly valid: true
      readonly value: UserSettingsDocument
      readonly errors: readonly []
    }
  | {
      readonly valid: false
      readonly errors: readonly string[]
    }
