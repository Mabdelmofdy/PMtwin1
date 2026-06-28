import type { CommandResult } from '@pm-twin/commands'
import type { Contract } from '@/types/domain.ts'
import { contractCommandService } from '@/services/contract-command-service.ts'

export type CompleteContractUiActionResult =
  | { readonly success: true; readonly contract: Contract }
  | { readonly success: false; readonly message: string }

export type CompleteContractUiActionsDeps = {
  readonly completeContract?: (
    contractId: string,
    reason?: string,
  ) => CommandResult
  readonly getContract?: (contractId: string) => Contract | undefined
}

function formatCommandErrors(result: CommandResult): string {
  if (result.errors && result.errors.length > 0) {
    return result.errors.join('. ')
  }
  return 'Contract could not be completed.'
}

export function completeContractUiAction(
  contractId: string,
  reason?: string,
  deps?: CompleteContractUiActionsDeps,
): CompleteContractUiActionResult {
  const complete =
    deps?.completeContract ??
    contractCommandService.completeContract.bind(contractCommandService)
  const getContract = deps?.getContract

  const result = complete(contractId, reason)
  if (!result.success) {
    return { success: false, message: formatCommandErrors(result) }
  }

  const contract = getContract?.(contractId)
  if (!contract) {
    return {
      success: false,
      message: 'Contract could not be completed. Contract may not exist.',
    }
  }

  return { success: true, contract }
}
