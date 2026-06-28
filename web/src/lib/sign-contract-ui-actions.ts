import type { CommandResult } from '@pm-twin/commands'
import type { Contract } from '@/types/domain.ts'
import { contractCommandService } from '@/services/contract-command-service.ts'

export type SignContractUiActionResult =
  | { readonly success: true; readonly contract: Contract }
  | { readonly success: false; readonly message: string }

export type SignContractUiActionsDeps = {
  readonly signContract?: (
    contractId: string,
    userId: string,
  ) => CommandResult
  readonly getContract?: (contractId: string) => Contract | undefined
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Contract could not be signed.'
}

export function signContractUiAction(
  contractId: string,
  userId: string,
  deps?: SignContractUiActionsDeps,
): SignContractUiActionResult {
  const sign =
    deps?.signContract ??
    contractCommandService.signContract.bind(contractCommandService)
  const getContract = deps?.getContract

  const result = sign(contractId, userId)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const contract = getContract?.(contractId)
  if (!contract) {
    return {
      success: false,
      message: 'Contract could not be signed. Contract may not exist.',
    }
  }

  return { success: true, contract }
}
