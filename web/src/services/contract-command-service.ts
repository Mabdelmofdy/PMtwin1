import type {
  ActivateContractCommand,
  Command,
  CommandResult,
  CompleteContractCommand,
  CreateContractFromCommercialAgreementCommand,
  SignContractCommand,
  TerminateContractCommand,
} from '@pm-twin/commands'
import type { Contract } from '@/types/domain.ts'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import type { ContractRepository } from '@/repositories/contract-repository.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'
import { contractRepository } from '@/repositories/index.ts'

export type ContractCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
  readonly contractRepository?: ContractRepository
}

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

let gatewayOverride: DefaultCommandGateway | null = null

/** Test hook — inject an isolated gateway without touching UI wiring. */
export function setContractCommandGatewayForTests(
  gateway: DefaultCommandGateway | null,
): void {
  gatewayOverride = gateway
}

function resolveGateway(
  deps?: ContractCommandServiceDeps,
): DefaultCommandGateway {
  return deps?.gateway ?? gatewayOverride ?? getApplicationCommandGateway()
}

function resolveContractRepository(
  deps?: ContractCommandServiceDeps,
): ContractRepository {
  return deps?.contractRepository ?? contractRepository
}

function executeCommand(
  command: Command,
  deps?: ContractCommandServiceDeps,
): CommandResult {
  return resolveGateway(deps).execute(command)
}

export function createContractCommandService(deps?: ContractCommandServiceDeps) {
  return {
    createContractFromCommercialAgreement(
      commercialAgreementId: string,
      options: Omit<
        CreateContractFromCommercialAgreementCommand,
        'commandType' | 'aggregateId' | 'clientRequestId' | 'commercialAgreementId'
      > = {},
      serviceDeps?: ContractCommandServiceDeps,
    ): { result: CommandResult; contract: Contract | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateContractFromCommercialAgreement',
        aggregateId: commercialAgreementId,
        commercialAgreementId,
        clientRequestId: createClientRequestId('CreateContractFromCommercialAgreement'),
        ...options,
      } satisfies CreateContractFromCommercialAgreementCommand

      const result = executeCommand(command, effectiveDeps)
      if (!result.success) {
        return { result, contract: null }
      }

      const repository = resolveContractRepository(effectiveDeps)
      const contract = repository.getById(result.aggregateId) ?? null
      return { result, contract }
    },

    /** @deprecated Use `createContractFromCommercialAgreement` */
    createContractFromDeal(
      dealId: string,
      options: Omit<
        CreateContractFromCommercialAgreementCommand,
        'commandType' | 'aggregateId' | 'clientRequestId' | 'dealId' | 'commercialAgreementId'
      > = {},
      serviceDeps?: ContractCommandServiceDeps,
    ): { result: CommandResult; contract: Contract | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateContractFromCommercialAgreement',
        aggregateId: dealId,
        commercialAgreementId: dealId,
        clientRequestId: createClientRequestId('CreateContractFromCommercialAgreement'),
        ...options,
      } satisfies CreateContractFromCommercialAgreementCommand

      const result = executeCommand(command, effectiveDeps)
      if (!result.success) {
        return { result, contract: null }
      }

      const repository = resolveContractRepository(effectiveDeps)
      const contract = repository.getById(result.aggregateId) ?? null
      return { result, contract }
    },

    signContract(
      contractId: string,
      userId: string,
      serviceDeps?: ContractCommandServiceDeps,
    ): CommandResult {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'SignContract',
        aggregateId: contractId,
        clientRequestId: createClientRequestId('SignContract'),
        userId,
      } satisfies SignContractCommand
      return executeCommand(command, effectiveDeps)
    },

    activateContract(
      contractId: string,
      triggeredByCommandId?: string,
      serviceDeps?: ContractCommandServiceDeps,
    ): CommandResult {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'ActivateContract',
        aggregateId: contractId,
        clientRequestId: createClientRequestId('ActivateContract'),
        triggeredByCommandId,
      } satisfies ActivateContractCommand
      return executeCommand(command, effectiveDeps)
    },

    completeContract(
      contractId: string,
      reason?: string,
      serviceDeps?: ContractCommandServiceDeps,
    ): CommandResult {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CompleteContract',
        aggregateId: contractId,
        clientRequestId: createClientRequestId('CompleteContract'),
        reason,
      } satisfies CompleteContractCommand
      return executeCommand(command, effectiveDeps)
    },

    terminateContract(
      contractId: string,
      reason?: string,
      serviceDeps?: ContractCommandServiceDeps,
    ): CommandResult {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'TerminateContract',
        aggregateId: contractId,
        clientRequestId: createClientRequestId('TerminateContract'),
        reason,
      } satisfies TerminateContractCommand
      return executeCommand(command, effectiveDeps)
    },
  }
}

export const contractCommandService = createContractCommandService()
