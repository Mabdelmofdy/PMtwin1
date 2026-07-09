import {
  AGREEMENT_REASON_CODES,
  type AgreementReasonCode,
} from '../reason-codes/agreement.ts'
import {
  COMMERCIAL_REASON_CODES,
  type CommercialReasonCode,
} from '../reason-codes/commercial.ts'
import type { AgreementStatus } from './agreement-types.ts'

export const AGREEMENT_ADAPTER_SCORE_WEIGHTS = {
  stageProgression: 35,
  commercialApproval: 25,
  signatures: 25,
  contractLinkage: 15,
} as const

export const AGREEMENT_BREAKDOWN_LABELS = {
  stageProgression: 'Stage progression',
  commercialApproval: 'Commercial approval',
  signatures: 'Signatures',
  contractLinkage: 'Contract linkage',
} as const

export type AgreementBreakdownDimension =
  keyof typeof AGREEMENT_ADAPTER_SCORE_WEIGHTS

export const AGREEMENT_STATUS_TO_REASON_CODE: Readonly<
  Record<AgreementStatus, AgreementReasonCode>
> = {
  draft: AGREEMENT_REASON_CODES.STATUS_DRAFT,
  review: AGREEMENT_REASON_CODES.STATUS_REVIEW,
  signing: AGREEMENT_REASON_CODES.STATUS_SIGNING,
  executing: AGREEMENT_REASON_CODES.STATUS_EXECUTING,
  completed: AGREEMENT_REASON_CODES.STATUS_COMPLETED,
  cancelled: AGREEMENT_REASON_CODES.STATUS_CANCELLED,
}

export function agreementStatusToReasonCode(
  status: AgreementStatus,
): AgreementReasonCode {
  return AGREEMENT_STATUS_TO_REASON_CODE[status]
}

export function agreementStatusToHref(
  entityId: string,
  section?: 'review' | 'signing' | 'contract' | 'timeline',
): string {
  const base = `/commercial-agreements/${entityId}`
  if (section) return `${base}/${section}`
  return base
}

export function commercialDecisionToReasonCode(): CommercialReasonCode {
  return COMMERCIAL_REASON_CODES.APPROVAL_PENDING
}

export function commercialAwardToReasonCode(): CommercialReasonCode {
  return COMMERCIAL_REASON_CODES.AWARD_PENDING
}

export function isDecisionPending(
  decisionStatus: string | undefined,
): boolean {
  return decisionStatus === 'pending'
}

export function isAwardPending(awardStatus: string | undefined): boolean {
  return awardStatus === 'pending'
}

export function hasPendingSignatures(
  pendingSignatures: number | undefined,
  totalSignatures: number | undefined,
): boolean {
  if (pendingSignatures != null && pendingSignatures > 0) return true
  if (
    totalSignatures != null
    && pendingSignatures != null
    && pendingSignatures < totalSignatures
  ) {
    return pendingSignatures > 0
  }
  return false
}
