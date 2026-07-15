import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createDefaultUserSettings,
  validateUserSettings,
} from './index.ts'

describe('user settings domain', () => {
  it('creates privacy-conscious defaults with unsupported security metadata', () => {
    const settings = createDefaultUserSettings(
      'user-1',
      '2026-07-15T08:00:00.000Z',
    )

    assert.deepEqual(settings.privacy.contactOptIns, {
      email: false,
      sms: false,
      whatsapp: false,
    })
    assert.deepEqual(settings.interface, {
      direction: 'auto',
      theme: 'system',
      density: 'comfortable',
    })
    assert.equal(settings.securityCapabilities.passwordChange.availability, 'unavailable')
    assert.equal(
      settings.securityCapabilities.passwordChange.reason,
      'requires_backend_identity_provider',
    )
    assert.equal('password' in settings, false)
  })

  it('creates independent nested settings values', () => {
    const first = createDefaultUserSettings('user-1')
    const second = createDefaultUserSettings('user-2')

    assert.notEqual(first.privacy.contactOptIns, second.privacy.contactOptIns)
    assert.notEqual(first.notifications.inApp, second.notifications.inApp)
    assert.notEqual(first.matching, second.matching)
  })

  it('validates an exact settings document', () => {
    const settings = createDefaultUserSettings(
      'user-1',
      '2026-07-15T08:00:00.000Z',
    )

    const result = validateUserSettings(settings)

    assert.equal(result.valid, true)
  })

  it('rejects unsupported password data and invalid preference values', () => {
    const settings = createDefaultUserSettings(
      'user-1',
      '2026-07-15T08:00:00.000Z',
    )
    const result = validateUserSettings({
      ...settings,
      password: 'must-not-be-persisted',
      interface: {
        ...settings.interface,
        theme: 'blue',
      },
    })

    assert.equal(result.valid, false)
    if (result.valid) return
    assert.ok(result.errors.includes('settings.password is not supported'))
    assert.ok(result.errors.some((error) => error.startsWith('interface.theme')))
  })
})
