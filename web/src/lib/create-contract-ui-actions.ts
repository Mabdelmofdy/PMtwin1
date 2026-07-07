import type { CommandResult } from '@pm-twin/commands'
import type { Contract } from '@/types/domain.ts'
import { contractCommandService } from '@/services/contract-command-service.ts'

export type CreateContractUiActionResult =
  | { readonly success: true; readonly contractId: string; readonly contract: Contract }
  | { readonly success: false; readonly message: string }

export type CreateContractUiActionsDeps = {
  readonly createContractFromCommercialAgreement?: (
    commercialAgreementId: string,
  ) => { result: CommandResult; contract: Contract | null }
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Contract could not be created.'
}

export function createContractFromCommercialAgreementUiAction(
  commercialAgreementId: string,
  deps?: CreateContractUiActionsDeps,
): CreateContractUiActionResult {
  const create =
    deps?.createContractFromCommercialAgreement
    ?? contractCommandService.createContractFromCommercialAgreement.bind(
      contractCommandService,
    )

  const { result, contract } = create(commercialAgreementId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }
  if (!contract?.id) {
    return {
      success: false,
      message: 'Contract could not be created. Commercial agreement may not exist.',
    }
  }
  return { success: true, contractId: contract.id, contract }
}

/** @deprecated Use `createContractFromCommercialAgreementUiAction` */
export function createContractFromDealUiAction(
  dealId: string,
  deps?: {
    readonly createContractFromDeal?: (
      commercialAgreementId: string,
    ) => { result: CommandResult; contract: Contract | null }
  },
): CreateContractUiActionResult {
  return createContractFromCommercialAgreementUiAction(dealId, {
    createContractFromCommercialAgreement: deps?.createContractFromDeal,
  })
}
