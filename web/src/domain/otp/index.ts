export type {
  OtpChannel,
  OtpChallenge,
  OtpSendResult,
  OtpVerifyResult,
  OtpDeliveryPort,
} from '@/domain/otp/otp-delivery-port.ts'

export {
  MockOtpDelivery,
  getSharedMockOtpDelivery,
  resetSharedMockOtpDelivery,
  type MockOtpOptions,
} from '@/domain/otp/mock-otp-delivery.ts'

export { resolveOtpDelivery } from '@/domain/otp/resolve-otp-delivery.ts'
