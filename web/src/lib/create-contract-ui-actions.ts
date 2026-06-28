import type { CommandResult } from '@pm-twin/commands'
import type { Contract } from '@/types/domain.ts'
import { contractCommandService } from '@/services/contract-command-service.ts'

export type CreateContractUiActionResult =
  | { readonly success: true; readonly contractId: string; readonly contract: Contract }
  | { readonly success: false; readonly message: string }

export type CreateContractUiActionsDeps = {
  readonly createContractFromDeal?: (
    dealId: string,
  ) => { result: CommandResult; contract: Contract | null }
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Contract could not be created.'
}

export function createContractFromDealUiAction(
  dealId: string,
  deps?: CreateContractUiActionsDeps,
): CreateContractUiActionResult {
  const create =
    deps?.createContractFromDeal ??
    contractCommandService.createContractFromDeal.bind(contractCommandService)

  const { result, contract } = create(dealId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }
  if (!contract?.id) {
    return {
      success: false,
      message: 'Contract could not be created. Deal may not exist.',
    }
  }
  return { success: true, contractId: contract.id, contract }
}
