/**
 * OTP delivery abstraction — production providers plug in later without
 * changing onboarding UX. Demo/UAT uses MockOtpDelivery only.
 */

export type OtpChannel = 'email' | 'sms'

export type OtpChallenge = {
  readonly challengeId: string
  readonly channel: OtpChannel
  readonly destination: string
  readonly expiresAt: string
  readonly attemptsRemaining: number
  /** Demo/UAT only — never expose in production providers. */
  readonly debugCode?: string
}

export type OtpSendResult =
  | { readonly ok: true; readonly challenge: OtpChallenge }
  | { readonly ok: false; readonly code: 'RATE_LIMITED' | 'INVALID_DESTINATION'; readonly message: string }

export type OtpVerifyResult =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly code: 'INVALID_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'NOT_FOUND'
      readonly message: string
      readonly attemptsRemaining?: number
    }

export interface OtpDeliveryPort {
  send(input: {
    readonly channel: OtpChannel
    readonly destination: string
    readonly purpose: string
  }): Promise<OtpSendResult>

  verify(input: {
    readonly challengeId: string
    readonly code: string
  }): Promise<OtpVerifyResult>
}
