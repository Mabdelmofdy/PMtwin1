/** @deprecated Import from `@/lib/commercial-agreement-detail-read-model.ts` */
import type { Deal } from '@/types/domain.ts'
import {
  buildCommercialAgreementDetailReadModel,
  canCreateContractFromCommercialAgreement,
  commercialAgreementDetailLinkFallbackLabel,
  formatCommercialTermsLines,
  isActiveContract,
  resolveCommercialAgreementCommercialTerms,
  resolveCommercialAgreementPostMatchId,
  resolveExistingActiveContract,
  CONTRACT_DETAIL_ROUTE_PREFIX,
  type CommercialAgreementDetailLink,
  type CommercialAgreementDetailParticipant,
  type CommercialAgreementDetailReadModel,
  type CommercialAgreementDetailReadModelDeps,
} from '@/lib/commercial-agreement-detail-read-model.ts'

export {
  formatCommercialTermsLines,
  isActiveContract,
  resolveExistingActiveContract,
  CONTRACT_DETAIL_ROUTE_PREFIX,
}

export type DealDetailLink = CommercialAgreementDetailLink
export type DealDetailParticipant = CommercialAgreementDetailParticipant

export type DealDetailReadModel = Omit<
  CommercialAgreementDetailReadModel,
  'commercialAgreement'
> & {
  readonly deal: Deal
}

export type DealDetailReadModelDeps = {
  readonly getDeal: (id: string) => Deal | undefined
  readonly getNegotiation: CommercialAgreementDetailReadModelDeps['getNegotiation']
  readonly getPostMatch: CommercialAgreementDetailReadModelDeps['getPostMatch']
  readonly getOpportunity: CommercialAgreementDetailReadModelDeps['getOpportunity']
  readonly getContractsForDeal?: (dealId: string) => CommercialAgreementDetailReadModelDeps extends {
    getContractsForCommercialAgreement?: infer F
  }
    ? F extends (id: string) => infer R
      ? R
      : never
    : never
  readonly getPersonName?: CommercialAgreementDetailReadModelDeps['getPersonName']
}

/** @deprecated Use `canCreateContractFromCommercialAgreement` */
export const DEAL_DETAIL_SHOWS_CONTRACT_ACTION = false

export function canCreateContractFromDeal(
  deal: Deal | null | undefined,
  contractsForDeal: Parameters<typeof canCreateContractFromCommercialAgreement>[1] = [],
  options?: Parameters<typeof canCreateContractFromCommercialAgreement>[2],
): boolean {
  return canCreateContractFromCommercialAgreement(deal, contractsForDeal, options)
}

export function resolveDealPostMatchId(deal: Deal): string | null {
  return resolveCommercialAgreementPostMatchId(deal)
}

export function resolveDealCommercialTerms(deal: Deal) {
  return resolveCommercialAgreementCommercialTerms(deal)
}

export function buildDealDetailReadModel(
  dealId: string,
  deps: DealDetailReadModelDeps,
): DealDetailReadModel | null {
  const model = buildCommercialAgreementDetailReadModel(dealId, {
    getCommercialAgreement: deps.getDeal,
    getNegotiation: deps.getNegotiation,
    getPostMatch: deps.getPostMatch,
    getOpportunity: deps.getOpportunity,
    getContractsForCommercialAgreement: deps.getContractsForDeal,
    getPersonName: deps.getPersonName,
  })
  if (!model) return null
  const { commercialAgreement, ...rest } = model
  return { ...rest, deal: commercialAgreement }
}

export function dealDetailLinkFallbackLabel(label: string): string {
  return commercialAgreementDetailLinkFallbackLabel(label)
}
