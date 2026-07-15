import {
  USER_SETTINGS_SCHEMA_VERSION,
  type UserSettingsDocument,
  type UserSettingsValidationResult,
} from './types.ts'

type UnknownRecord = Readonly<Record<string, unknown>>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateObject(
  value: unknown,
  path: string,
  keys: readonly string[],
  errors: string[],
): value is UnknownRecord {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return false
  }

  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      errors.push(`${path}.${key} is not supported`)
    }
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) {
      errors.push(`${path}.${key} is required`)
    }
  }
  return true
}

function validateBoolean(record: UnknownRecord, key: string, path: string, errors: string[]): void {
  if (typeof record[key] !== 'boolean') {
    errors.push(`${path}.${key} must be a boolean`)
  }
}

function validateEnum(
  record: UnknownRecord,
  key: string,
  path: string,
  allowed: readonly string[],
  errors: string[],
): void {
  if (typeof record[key] !== 'string' || !allowed.includes(record[key])) {
    errors.push(`${path}.${key} must be one of: ${allowed.join(', ')}`)
  }
}

function validateCanonicalTimestamp(value: unknown, path: string, errors: string[]): void {
  if (
    typeof value !== 'string'
    || Number.isNaN(Date.parse(value))
    || new Date(value).toISOString() !== value
  ) {
    errors.push(`${path} must be an ISO 8601 UTC timestamp`)
  }
}

function validatePrivacy(value: unknown, errors: string[]): void {
  if (!validateObject(value, 'privacy', ['contactOptIns', 'publicProfile'], errors)) return
  const contactOptIns = value.contactOptIns
  if (
    !validateObject(
      contactOptIns,
      'privacy.contactOptIns',
      ['email', 'sms', 'whatsapp'],
      errors,
    )
  ) return

  validateBoolean(contactOptIns, 'email', 'privacy.contactOptIns', errors)
  validateBoolean(contactOptIns, 'sms', 'privacy.contactOptIns', errors)
  validateBoolean(contactOptIns, 'whatsapp', 'privacy.contactOptIns', errors)

  const publicProfile = value.publicProfile
  if (
    !validateObject(
      publicProfile,
      'privacy.publicProfile',
      ['published', 'showPhone', 'showWebsite', 'showLinkedIn', 'showSocialLinks'],
      errors,
    )
  ) return
  validateBoolean(publicProfile, 'published', 'privacy.publicProfile', errors)
  validateBoolean(publicProfile, 'showPhone', 'privacy.publicProfile', errors)
  validateBoolean(publicProfile, 'showWebsite', 'privacy.publicProfile', errors)
  validateBoolean(publicProfile, 'showLinkedIn', 'privacy.publicProfile', errors)
  validateBoolean(publicProfile, 'showSocialLinks', 'privacy.publicProfile', errors)
}

function validateNotifications(value: unknown, errors: string[]): void {
  if (!validateObject(value, 'notifications', ['inApp'], errors)) return
  const inApp = value.inApp
  if (
    !validateObject(
      inApp,
      'notifications.inApp',
      ['matching', 'applications', 'negotiations', 'commercial', 'account'],
      errors,
    )
  ) return

  validateBoolean(inApp, 'matching', 'notifications.inApp', errors)
  validateBoolean(inApp, 'applications', 'notifications.inApp', errors)
  validateBoolean(inApp, 'negotiations', 'notifications.inApp', errors)
  validateBoolean(inApp, 'commercial', 'notifications.inApp', errors)
  validateBoolean(inApp, 'account', 'notifications.inApp', errors)
}

function validateInterface(value: unknown, errors: string[]): void {
  if (!validateObject(value, 'interface', ['direction', 'theme', 'density'], errors)) return

  validateEnum(value, 'direction', 'interface', ['auto', 'ltr', 'rtl'], errors)
  validateEnum(value, 'theme', 'interface', ['system', 'light', 'dark'], errors)
  validateEnum(value, 'density', 'interface', ['comfortable', 'compact'], errors)
}

function validateMatching(value: unknown, errors: string[]): void {
  if (
    !validateObject(
      value,
      'matching',
      ['participateInMatching', 'allowProfileDiscovery', 'receiveRecommendations'],
      errors,
    )
  ) return

  validateBoolean(value, 'participateInMatching', 'matching', errors)
  validateBoolean(value, 'allowProfileDiscovery', 'matching', errors)
  validateBoolean(value, 'receiveRecommendations', 'matching', errors)
}

function validateUnavailableCapability(
  value: unknown,
  path: string,
  errors: string[],
): void {
  if (!validateObject(value, path, ['availability', 'reason'], errors)) return
  if (value.availability !== 'unavailable') {
    errors.push(`${path}.availability must be unavailable`)
  }
  if (value.reason !== 'requires_backend_identity_provider') {
    errors.push(`${path}.reason must be requires_backend_identity_provider`)
  }
}

function validateSecurityCapabilities(value: unknown, errors: string[]): void {
  if (
    !validateObject(
      value,
      'securityCapabilities',
      ['passwordChange', 'multiFactorAuthentication', 'sessionManagement'],
      errors,
    )
  ) return

  validateUnavailableCapability(
    value.passwordChange,
    'securityCapabilities.passwordChange',
    errors,
  )
  validateUnavailableCapability(
    value.multiFactorAuthentication,
    'securityCapabilities.multiFactorAuthentication',
    errors,
  )
  validateUnavailableCapability(
    value.sessionManagement,
    'securityCapabilities.sessionManagement',
    errors,
  )
}

export function validateUserSettings(value: unknown): UserSettingsValidationResult {
  const errors: string[] = []
  if (
    !validateObject(
      value,
      'settings',
      [
        'schemaVersion',
        'userId',
        'privacy',
        'notifications',
        'interface',
        'matching',
        'securityCapabilities',
        'createdAt',
        'updatedAt',
      ],
      errors,
    )
  ) {
    return { valid: false, errors }
  }

  if (value.schemaVersion !== USER_SETTINGS_SCHEMA_VERSION) {
    errors.push(`settings.schemaVersion must be ${USER_SETTINGS_SCHEMA_VERSION}`)
  }
  if (typeof value.userId !== 'string' || value.userId.trim().length === 0) {
    errors.push('settings.userId must be a non-empty string')
  }
  validatePrivacy(value.privacy, errors)
  validateNotifications(value.notifications, errors)
  validateInterface(value.interface, errors)
  validateMatching(value.matching, errors)
  validateSecurityCapabilities(value.securityCapabilities, errors)
  validateCanonicalTimestamp(value.createdAt, 'settings.createdAt', errors)
  validateCanonicalTimestamp(value.updatedAt, 'settings.updatedAt', errors)

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true, value: value as UserSettingsDocument, errors: [] }
}

export function isUserSettingsDocument(value: unknown): value is UserSettingsDocument {
  return validateUserSettings(value).valid
}
