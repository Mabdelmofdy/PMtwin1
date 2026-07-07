/** @deprecated Import from `@/lib/create-commercial-agreement-ui-actions.ts` */
export { isPostMatchNegotiation } from '@/lib/create-commercial-agreement-ui-actions.ts'

import {
  canShowCreateCommercialAgreementFromNegotiation,
  createCommercialAgreementFromNegotiationUiAction,
  type CreateCommercialAgreementUiActionsDeps,
} from '@/lib/create-commercial-agreement-ui-actions.ts'
import type { CommandResult } from '@pm-twin/commands'
import type { Deal } from '@/types/domain.ts'

/** @deprecated Use `CreateCommercialAgreementUiActionResult` */
export type CreateDealUiActionResult =
  | { readonly success: true; readonly dealId: string; readonly deal: Deal }
  | { readonly success: false; readonly message: string }

/** @deprecated Use `CreateCommercialAgreementUiActionsDeps` */
export type CreateDealUiActionsDeps = {
  readonly createDealFromNegotiation?: (negotiationId: string) => {
    readonly result: CommandResult
    readonly deal: Deal | null
  }
  readonly findDealByNegotiationId?: (negotiationId: string) => Deal | undefined
  readonly postMatch?: { id: string; matchType?: string } | null
  readonly userId?: string | null
  readonly canMutate?: boolean
}

function mapLegacyDeps(
  deps?: CreateDealUiActionsDeps,
): CreateCommercialAgreementUiActionsDeps | undefined {
  if (!deps) return undefined
  return {
    createCommercialAgreementFromNegotiation: deps.createDealFromNegotiation
      ? (negotiationId) => {
          const { result, deal } = deps.createDealFromNegotiation!(negotiationId)
          return { result, commercialAgreement: deal }
        }
      : undefined,
    findCommercialAgreementByNegotiationId: deps.findDealByNegotiationId,
    postMatch: deps.postMatch,
    userId: deps.userId,
    canMutate: deps.canMutate,
  }
}

/** @deprecated Use `canShowCreateCommercialAgreementFromNegotiation` */
export function canShowCreateDealFromNegotiation(
  negotiation: Parameters<typeof canShowCreateCommercialAgreementFromNegotiation>[0],
  deps?: CreateDealUiActionsDeps,
): boolean {
  return canShowCreateCommercialAgreementFromNegotiation(negotiation, mapLegacyDeps(deps))
}

/** @deprecated Use `createCommercialAgreementFromNegotiationUiAction` */
export function createDealFromNegotiationUiAction(
  negotiationId: string,
  deps?: CreateDealUiActionsDeps,
): CreateDealUiActionResult {
  const result = createCommercialAgreementFromNegotiationUiAction(
    negotiationId,
    mapLegacyDeps(deps),
  )
  if (!result.success) return result
  return {
    success: true,
    dealId: result.commercialAgreementId,
    deal: result.commercialAgreement,
  }
}
