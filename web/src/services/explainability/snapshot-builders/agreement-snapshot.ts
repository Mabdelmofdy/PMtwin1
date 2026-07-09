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
  readonly subModelKey?: string
  readonly getOpportunity?: (
    opportunityId: string,
  ) => { readonly subModelType?: string | null } | undefined
  readonly getPostMatch?: (
    postMatchId: string,
  ) => {
    readonly needOpportunityId?: string | null
    readonly offerOpportunityId?: string | null
  } | undefined
}

function resolveSubModelTypeFromOpportunity(
  opportunityId: string | null | undefined,
  getOpportunity?: AgreementSnapshotOptions['getOpportunity'],
): string | undefined {
  if (!opportunityId || !getOpportunity) return undefined
  const opportunity = getOpportunity(opportunityId)
  const subModelType = opportunity?.subModelType
  return typeof subModelType === 'string' && subModelType.trim()
    ? subModelType
    : undefined
}

/**
 * Derives agreement knowledge subModelKey from linked opportunities or post-match.
 */
export function resolveAgreementSubModelKey(
  model: CommercialAgreementDetailReadModel,
  options?: AgreementSnapshotOptions,
): string | undefined {
  if (options?.subModelKey) return options.subModelKey

  const fromNeed = resolveSubModelTypeFromOpportunity(
    model.needOpportunityId,
    options?.getOpportunity,
  )
  if (fromNeed) return fromNeed

  const fromOffer = resolveSubModelTypeFromOpportunity(
    model.offerOpportunityId,
    options?.getOpportunity,
  )
  if (fromOffer) return fromOffer

  if (model.postMatchId && options?.getPostMatch) {
    const postMatch = options.getPostMatch(model.postMatchId)
    const fromMatchNeed = resolveSubModelTypeFromOpportunity(
      postMatch?.needOpportunityId ?? null,
      options?.getOpportunity,
    )
    if (fromMatchNeed) return fromMatchNeed

    const fromMatchOffer = resolveSubModelTypeFromOpportunity(
      postMatch?.offerOpportunityId ?? null,
      options?.getOpportunity,
    )
    if (fromMatchOffer) return fromMatchOffer
  }

  return undefined
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
