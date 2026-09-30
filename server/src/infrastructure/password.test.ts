import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decodeLegacyBase64Password,
  hashPassword,
  isBcryptHash,
  verifyPassword,
} from './password.js'

describe('password helpers', () => {
  it('upgrades POC base64 hashes and verifies the original password', async () => {
    const legacy = Buffer.from('Pmtwin@2026', 'utf8').toString('base64')
    assert.equal(legacy, 'UG10d2luQDIwMjY=')
    assert.equal(decodeLegacyBase64Password(legacy), 'Pmtwin@2026')
    assert.equal(isBcryptHash(legacy), false)
    assert.equal(await verifyPassword('Pmtwin@2026', legacy), true)
    assert.equal(await verifyPassword('wrong', legacy), false)
  })

  it('verifies bcrypt hashes', async () => {
    const hashed = await hashPassword('admin123')
    assert.equal(isBcryptHash(hashed), true)
    assert.equal(await verifyPassword('admin123', hashed), true)
    assert.equal(await verifyPassword('nope', hashed), false)
  })
})
