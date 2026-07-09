import { OPPORTUNITY_FIELD_ID_TO_REASON_CODE } from '../adapters/opportunity-field-map.ts'
import { COMMERCIAL_REASON_CODES } from '../reason-codes/commercial.ts'
import { NEGOTIATION_REASON_CODES } from '../reason-codes/negotiation.ts'
import { READINESS_REASON_CODES } from '../reason-codes/readiness.ts'
import type { ReasonCode } from '../reason-codes/index.ts'

const REASON_CODE_TO_FIELD_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(OPPORTUNITY_FIELD_ID_TO_REASON_CODE).map(([fieldId, code]) => [
    code,
    fieldId,
  ]),
)

export function reasonCodeToFieldId(reasonCode: ReasonCode): string | undefined {
  return REASON_CODE_TO_FIELD_ID[reasonCode]
}

export function isComplianceReasonCode(reasonCode: ReasonCode): boolean {
  return (
    reasonCode === READINESS_REASON_CODES.MISSING_COMPLIANCE
    || reasonCode === COMMERCIAL_REASON_CODES.VAT_VALIDATION_REQUIRED
    || reasonCode.startsWith('DOCUMENT_')
  )
}

export function isRiskReasonCode(reasonCode: ReasonCode): boolean {
  return (
    reasonCode === NEGOTIATION_REASON_CODES.PRICE_GAP
    || reasonCode === NEGOTIATION_REASON_CODES.TERMS_MISMATCH
    || reasonCode === NEGOTIATION_REASON_CODES.RESPONSE_DELAY
    || reasonCode === NEGOTIATION_REASON_CODES.COUNTER_PENDING
    || reasonCode.startsWith('VETTING_')
  )
}

export function isLifecycleReasonCode(reasonCode: ReasonCode): boolean {
  return (
    reasonCode.startsWith('NEGOTIATION_STATUS_')
    || reasonCode.startsWith('AGREEMENT_STATUS_')
    || reasonCode.startsWith('CONTRACT_STATUS_')
    || reasonCode === READINESS_REASON_CODES.PUBLISH_READY
    || reasonCode === READINESS_REASON_CODES.PUBLISH_BLOCKED
  )
}

export function isReadinessFieldReasonCode(reasonCode: ReasonCode): boolean {
  return reasonCode.startsWith('READINESS_MISSING_')
}
