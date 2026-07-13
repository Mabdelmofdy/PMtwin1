import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MockOtpDelivery } from '@/domain/otp/mock-otp-delivery.ts'

describe('MockOtpDelivery', () => {
  it('sends a challenge with fixed debug code', async () => {
    const otp = new MockOtpDelivery({ fixedCode: '654321', exposeDebugCode: true })
    const sent = await otp.send({
      channel: 'email',
      destination: 'user@example.test',
      purpose: 'registration',
    })
    assert.equal(sent.ok, true)
    if (!sent.ok) return
    assert.equal(sent.challenge.debugCode, '654321')
    assert.ok(sent.challenge.challengeId)
    assert.ok(Date.parse(sent.challenge.expiresAt) > Date.now())
  })

  it('verifies correct code and rejects wrong code', async () => {
    let now = 1_000_000
    const otp = new MockOtpDelivery({
      fixedCode: '111111',
      maxAttempts: 3,
      now: () => now,
    })
    const sent = await otp.send({
      channel: 'email',
      destination: 'a@b.test',
      purpose: 'registration',
    })
    assert.equal(sent.ok, true)
    if (!sent.ok) return

    const bad = await otp.verify({ challengeId: sent.challenge.challengeId, code: '000000' })
    assert.equal(bad.ok, false)
    if (bad.ok) return
    assert.equal(bad.code, 'INVALID_CODE')
    assert.equal(bad.attemptsRemaining, 2)

    const good = await otp.verify({ challengeId: sent.challenge.challengeId, code: '111111' })
    assert.equal(good.ok, true)
  })

  it('expires after ttl', async () => {
    let now = 1_000_000
    const otp = new MockOtpDelivery({
      fixedCode: '222222',
      ttlMs: 1_000,
      now: () => now,
    })
    const sent = await otp.send({
      channel: 'email',
      destination: 'exp@test',
      purpose: 'registration',
    })
    assert.equal(sent.ok, true)
    if (!sent.ok) return

    now += 2_000
    const result = await otp.verify({
      challengeId: sent.challenge.challengeId,
      code: '222222',
    })
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.code, 'EXPIRED')
  })

  it('rate-limits resend to same destination', async () => {
    const otp = new MockOtpDelivery({
      resendCooldownMs: 60_000,
      now: () => 5_000_000,
    })
    const first = await otp.send({
      channel: 'email',
      destination: 'rate@test',
      purpose: 'registration',
    })
    assert.equal(first.ok, true)
    const second = await otp.send({
      channel: 'email',
      destination: 'rate@test',
      purpose: 'registration',
    })
    assert.equal(second.ok, false)
    if (second.ok) return
    assert.equal(second.code, 'RATE_LIMITED')
  })

  it('locks out after too many attempts', async () => {
    const otp = new MockOtpDelivery({ fixedCode: '999999', maxAttempts: 2 })
    const sent = await otp.send({
      channel: 'sms',
      destination: '+966500000000',
      purpose: 'registration',
    })
    assert.equal(sent.ok, true)
    if (!sent.ok) return

    await otp.verify({ challengeId: sent.challenge.challengeId, code: '000000' })
    const locked = await otp.verify({
      challengeId: sent.challenge.challengeId,
      code: '000000',
    })
    assert.equal(locked.ok, false)
    if (locked.ok) return
    assert.equal(locked.code, 'TOO_MANY_ATTEMPTS')
  })
})
