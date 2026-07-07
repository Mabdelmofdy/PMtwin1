/** @deprecated Import from `@/lib/commercial-agreement-transition-ui-actions.ts` */
import {
  canShowCommercialAgreementTransition,
  listCommercialAgreementTransitionOptions,
  transitionCommercialAgreementStatusUiAction,
  type CommercialAgreementTransitionOption,
  type CommercialAgreementTransitionUiActionResult,
  type CommercialAgreementTransitionUiActionsDeps,
} from '@/lib/commercial-agreement-transition-ui-actions.ts'
import type { CommandResult } from '@pm-twin/commands'
import type { Deal } from '@/types/domain.ts'

export type DealTransitionOption = CommercialAgreementTransitionOption
export type DealTransitionUiActionResult = CommercialAgreementTransitionUiActionResult

export type DealTransitionUiActionsDeps = {
  readonly transitionDealStatus?: (
    dealId: string,
    targetStatus: string,
  ) => {
    readonly result: CommandResult
    readonly deal: Deal | null
  }
  readonly readDealStatus?: (dealId: string) => string | undefined
}

function mapLegacyDeps(
  deps?: DealTransitionUiActionsDeps,
): CommercialAgreementTransitionUiActionsDeps | undefined {
  if (!deps) return undefined
  return {
    transitionCommercialAgreementStatus: deps.transitionDealStatus
      ? (commercialAgreementId, targetStatus) => {
          const { result, deal } = deps.transitionDealStatus!(
            commercialAgreementId,
            targetStatus,
          )
          return { result, commercialAgreement: deal }
        }
      : undefined,
    readCommercialAgreementStatus: deps.readDealStatus,
  }
}

export function listDealTransitionOptions(
  deal: Deal | null | undefined,
): readonly DealTransitionOption[] {
  return listCommercialAgreementTransitionOptions(deal)
}

export function canShowDealTransition(
  deal: Deal | null | undefined,
  targetStatus: string,
): boolean {
  return canShowCommercialAgreementTransition(deal, targetStatus)
}

export function transitionDealStatusUiAction(
  dealId: string,
  targetStatus: string,
  deps?: DealTransitionUiActionsDeps,
): DealTransitionUiActionResult {
  return transitionCommercialAgreementStatusUiAction(
    dealId,
    targetStatus,
    mapLegacyDeps(deps),
  )
}
