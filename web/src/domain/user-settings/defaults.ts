import {
  USER_SETTINGS_SCHEMA_VERSION,
  type SecurityCapabilities,
  type UserSettingsDocument,
  type UserSettingsPreferences,
} from './types.ts'

export const DEFAULT_USER_SETTINGS_PREFERENCES: UserSettingsPreferences = {
  privacy: {
    contactOptIns: {
      email: false,
      sms: false,
      whatsapp: false,
    },
    publicProfile: {
      published: false,
      showPhone: false,
      showWebsite: false,
      showLinkedIn: false,
    },
  },
  notifications: {
    inApp: {
      matching: true,
      applications: true,
      negotiations: true,
      commercial: true,
      account: true,
    },
  },
  interface: {
    direction: 'auto',
    theme: 'system',
    density: 'comfortable',
  },
  matching: {
    participateInMatching: true,
    allowProfileDiscovery: true,
    receiveRecommendations: true,
  },
}

export const UNAVAILABLE_SECURITY_CAPABILITIES: SecurityCapabilities = {
  passwordChange: {
    availability: 'unavailable',
    reason: 'requires_backend_identity_provider',
  },
  multiFactorAuthentication: {
    availability: 'unavailable',
    reason: 'requires_backend_identity_provider',
  },
  sessionManagement: {
    availability: 'unavailable',
    reason: 'requires_backend_identity_provider',
  },
}

export function createDefaultUserSettings(
  userId: string,
  timestamp = new Date().toISOString(),
): UserSettingsDocument {
  return {
    schemaVersion: USER_SETTINGS_SCHEMA_VERSION,
    userId,
    privacy: {
      contactOptIns: { ...DEFAULT_USER_SETTINGS_PREFERENCES.privacy.contactOptIns },
      publicProfile: { ...DEFAULT_USER_SETTINGS_PREFERENCES.privacy.publicProfile },
    },
    notifications: {
      inApp: { ...DEFAULT_USER_SETTINGS_PREFERENCES.notifications.inApp },
    },
    interface: { ...DEFAULT_USER_SETTINGS_PREFERENCES.interface },
    matching: { ...DEFAULT_USER_SETTINGS_PREFERENCES.matching },
    securityCapabilities: {
      passwordChange: { ...UNAVAILABLE_SECURITY_CAPABILITIES.passwordChange },
      multiFactorAuthentication: {
        ...UNAVAILABLE_SECURITY_CAPABILITIES.multiFactorAuthentication,
      },
      sessionManagement: { ...UNAVAILABLE_SECURITY_CAPABILITIES.sessionManagement },
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
