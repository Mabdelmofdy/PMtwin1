import type {
  AgreementExplainabilitySnapshot,
  AgreementStatus,
} from '@pm-twin/explainability'
import type { CommercialAgreementDetailReadModel } from '@/lib/commercial-agreement-detail-read-model.ts'

const AGREEMENT_STATUSES = new Set<AgreementStatus>([
  'draft',
  'review',
  'signing',
  'executing',
  'completed',
  'cancelled',
])

function normalizeAgreementStatus(status: string): AgreementStatus {
  const key = status.trim().toLowerCase()
  return AGREEMENT_STATUSES.has(key as AgreementStatus)
    ? (key as AgreementStatus)
    : 'draft'
}

export type AgreementSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
}

export function buildAgreementExplainabilitySnapshot(
  model: CommercialAgreementDetailReadModel,
  options?: AgreementSnapshotOptions,
): AgreementExplainabilitySnapshot {
  const deal = model.commercialAgreement
  const participants = model.participants
  const totalSignatures = participants.length
  const pendingSignatures = participants.filter(
    (participant) => participant.participantStatus !== 'signed',
  ).length

  return {
    entityId: deal.id,
    status: normalizeAgreementStatus(model.canonicalStatus),
    linkedNegotiationId: model.negotiationId,
    linkedContractId: model.existingContract?.id ?? null,
    canCreateContract: model.canCreateContract,
    pendingSignatures: totalSignatures > 0 ? pendingSignatures : undefined,
    totalSignatures: totalSignatures > 0 ? totalSignatures : undefined,
    createdAt: deal.createdAt,
    evaluatedAt: options?.evaluatedAt ?? deal.updatedAt ?? deal.createdAt,
    locale: options?.locale ?? 'en-SA',
  }
}
