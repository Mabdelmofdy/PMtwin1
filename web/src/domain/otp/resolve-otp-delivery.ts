import type { OtpDeliveryPort } from '@/domain/otp/otp-delivery-port.ts'
import { getSharedMockOtpDelivery } from '@/domain/otp/mock-otp-delivery.ts'
import { resolveRuntimeMode } from '@/config/runtime-environment.ts'

/**
 * Resolves OTP delivery for the current runtime.
 * Demo/UAT → mock. Production stays mock-shaped but callers should not
 * enable local registration without an explicit flag (registration already gated).
 */
export function resolveOtpDelivery(): OtpDeliveryPort {
  const mode = resolveRuntimeMode()
  if (mode === 'demo' || mode === 'uat') {
    return getSharedMockOtpDelivery()
  }
  // Production: still return mock port so UI contracts compile; real providers
  // plug in here later. Registration itself remains API-gated.
  return getSharedMockOtpDelivery()
}
