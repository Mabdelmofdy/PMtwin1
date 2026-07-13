import type {
  OtpChallenge,
  OtpDeliveryPort,
  OtpSendResult,
  OtpVerifyResult,
} from '@/domain/otp/otp-delivery-port.ts'

export type MockOtpOptions = {
  /** Fixed code for Demo/UAT (default 123456). */
  readonly fixedCode?: string
  /** TTL in milliseconds (default 5 minutes). */
  readonly ttlMs?: number
  /** Max verify attempts per challenge (default 5). */
  readonly maxAttempts?: number
  /** Min interval between sends to same destination (default 30s). */
  readonly resendCooldownMs?: number
  /** When true, include debugCode on challenge and log to console. */
  readonly exposeDebugCode?: boolean
  readonly now?: () => number
}

type StoredChallenge = {
  readonly challengeId: string
  readonly channel: 'email' | 'sms'
  readonly destination: string
  readonly code: string
  readonly expiresAtMs: number
  attemptsRemaining: number
  readonly createdAtMs: number
}

const DEFAULT_CODE = '123456'
const DEFAULT_TTL_MS = 5 * 60 * 1000
const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_RESEND_COOLDOWN_MS = 30_000

function createChallengeId(): string {
  return `otp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeDestination(destination: string): string {
  return destination.trim().toLowerCase()
}

/**
 * In-memory mock OTP provider for Demo/UAT.
 * Same UX contract as a future SMS/email provider.
 */
export class MockOtpDelivery implements OtpDeliveryPort {
  private readonly fixedCode: string
  private readonly ttlMs: number
  private readonly maxAttempts: number
  private readonly resendCooldownMs: number
  private readonly exposeDebugCode: boolean
  private readonly now: () => number
  private readonly challenges = new Map<string, StoredChallenge>()
  private readonly lastSendByDestination = new Map<string, number>()

  constructor(options: MockOtpOptions = {}) {
    this.fixedCode = options.fixedCode ?? DEFAULT_CODE
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
    this.resendCooldownMs = options.resendCooldownMs ?? DEFAULT_RESEND_COOLDOWN_MS
    this.exposeDebugCode = options.exposeDebugCode ?? true
    this.now = options.now ?? Date.now
  }

  async send(input: {
    readonly channel: 'email' | 'sms'
    readonly destination: string
    readonly purpose: string
  }): Promise<OtpSendResult> {
    const destination = normalizeDestination(input.destination)
    if (!destination) {
      return {
        ok: false,
        code: 'INVALID_DESTINATION',
        message: 'A valid email or phone is required to send a verification code.',
      }
    }

    const now = this.now()
    const lastSend = this.lastSendByDestination.get(destination)
    if (lastSend != null && now - lastSend < this.resendCooldownMs) {
      return {
        ok: false,
        code: 'RATE_LIMITED',
        message: 'Please wait before requesting another verification code.',
      }
    }

    const challengeId = createChallengeId()
    const expiresAtMs = now + this.ttlMs
    const stored: StoredChallenge = {
      challengeId,
      channel: input.channel,
      destination,
      code: this.fixedCode,
      expiresAtMs,
      attemptsRemaining: this.maxAttempts,
      createdAtMs: now,
    }
    this.challenges.set(challengeId, stored)
    this.lastSendByDestination.set(destination, now)

    const challenge: OtpChallenge = {
      challengeId,
      channel: input.channel,
      destination,
      expiresAt: new Date(expiresAtMs).toISOString(),
      attemptsRemaining: this.maxAttempts,
      ...(this.exposeDebugCode ? { debugCode: this.fixedCode } : {}),
    }

    if (this.exposeDebugCode && typeof console !== 'undefined') {
      console.info(
        `[MockOTP] purpose=${input.purpose} channel=${input.channel} to=${destination} code=${this.fixedCode}`,
      )
    }

    return { ok: true, challenge }
  }

  async verify(input: {
    readonly challengeId: string
    readonly code: string
  }): Promise<OtpVerifyResult> {
    const stored = this.challenges.get(input.challengeId)
    if (!stored) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        message: 'Verification session not found. Request a new code.',
      }
    }

    const now = this.now()
    if (now > stored.expiresAtMs) {
      this.challenges.delete(input.challengeId)
      return {
        ok: false,
        code: 'EXPIRED',
        message: 'Verification code expired. Request a new code.',
      }
    }

    if (stored.attemptsRemaining <= 0) {
      this.challenges.delete(input.challengeId)
      return {
        ok: false,
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many incorrect attempts. Request a new code.',
      }
    }

    const code = input.code.trim()
    if (code !== stored.code) {
      stored.attemptsRemaining -= 1
      if (stored.attemptsRemaining <= 0) {
        this.challenges.delete(input.challengeId)
        return {
          ok: false,
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many incorrect attempts. Request a new code.',
          attemptsRemaining: 0,
        }
      }
      return {
        ok: false,
        code: 'INVALID_CODE',
        message: 'Incorrect verification code.',
        attemptsRemaining: stored.attemptsRemaining,
      }
    }

    this.challenges.delete(input.challengeId)
    return { ok: true }
  }

  /** Test helper — peek challenge without consuming. */
  getChallengeForTests(challengeId: string): StoredChallenge | undefined {
    return this.challenges.get(challengeId)
  }

  clear(): void {
    this.challenges.clear()
    this.lastSendByDestination.clear()
  }
}

let sharedMock: MockOtpDelivery | null = null

export function getSharedMockOtpDelivery(): MockOtpDelivery {
  if (!sharedMock) {
    sharedMock = new MockOtpDelivery({ exposeDebugCode: true })
  }
  return sharedMock
}

export function resetSharedMockOtpDelivery(): void {
  sharedMock?.clear()
  sharedMock = null
}
