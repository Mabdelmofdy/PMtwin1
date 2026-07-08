import type { Command, CommandResult } from '@pm-twin/commands'
import type { CommercialAgreement } from '@/types/domain.ts'
import type { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import type { CommercialAgreementRepository } from '@/repositories/commercial-agreement-repository.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'
import { commercialAgreementRepository } from '@/repositories/index.ts'

export type CommercialAgreementCommandServiceDeps = {
  readonly gateway?: DefaultCommandGateway
  readonly commercialAgreementRepository?: CommercialAgreementRepository
}

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

let gatewayOverride: DefaultCommandGateway | null = null

export function setCommercialAgreementCommandGatewayForTests(gateway: DefaultCommandGateway | null): void {
  gatewayOverride = gateway
}

function resolveGateway(deps?: CommercialAgreementCommandServiceDeps): DefaultCommandGateway {
  return deps?.gateway ?? gatewayOverride ?? getApplicationCommandGateway()
}

function resolveRepository(
  deps?: CommercialAgreementCommandServiceDeps,
): CommercialAgreementRepository {
  return deps?.commercialAgreementRepository ?? commercialAgreementRepository
}

function executeCommand(command: Command, deps?: CommercialAgreementCommandServiceDeps): CommandResult {
  return resolveGateway(deps).execute(command)
}

export function createCommercialAgreementCommandService(deps?: CommercialAgreementCommandServiceDeps) {
  return {
    createCommercialAgreementFromPostMatch(
      postMatchId: string,
      negotiationId: string,
      serviceDeps?: CommercialAgreementCommandServiceDeps,
    ): { result: CommandResult; commercialAgreement: CommercialAgreement | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateCommercialAgreementFromPostMatch',
        aggregateId: postMatchId,
        negotiationId,
        clientRequestId: createClientRequestId('CreateCommercialAgreementFromPostMatch'),
      } as const
      const result = executeCommand(command, effectiveDeps)
      if (!result.success) return { result, commercialAgreement: null }
      const repository = resolveRepository(effectiveDeps)
      const commercialAgreement =
        repository.getById(result.aggregateId)
        ?? repository.findByPostMatchId(postMatchId)
        ?? repository.findByNegotiationId(negotiationId)
        ?? null
      return { result, commercialAgreement }
    },
    createCommercialAgreementFromApplication(
      applicationId: string,
      negotiationId: string,
      serviceDeps?: CommercialAgreementCommandServiceDeps,
    ): { result: CommandResult; commercialAgreement: CommercialAgreement | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateCommercialAgreementFromApplication',
        aggregateId: applicationId,
        negotiationId,
        clientRequestId: createClientRequestId('CreateCommercialAgreementFromApplication'),
      } as const
      const result = executeCommand(command, effectiveDeps)
      if (!result.success) return { result, commercialAgreement: null }
      const repository = resolveRepository(effectiveDeps)
      const commercialAgreement =
        repository.getById(result.aggregateId)
        ?? repository.findByApplicationId(applicationId)
        ?? repository.findByNegotiationId(negotiationId)
        ?? null
      return { result, commercialAgreement }
    },
    createCommercialAgreementFromNegotiation(
      negotiationId: string,
      serviceDeps?: CommercialAgreementCommandServiceDeps,
    ): { result: CommandResult; commercialAgreement: CommercialAgreement | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'CreateCommercialAgreementFromNegotiation',
        aggregateId: negotiationId,
        negotiationId,
        clientRequestId: createClientRequestId('CreateCommercialAgreementFromNegotiation'),
      } as const
      const result = executeCommand(command, effectiveDeps)
      if (!result.success) return { result, commercialAgreement: null }
      const repository = resolveRepository(effectiveDeps)
      const commercialAgreement =
        repository.getById(result.aggregateId)
        ?? repository.findByNegotiationId(negotiationId)
        ?? null
      return { result, commercialAgreement }
    },
    transitionCommercialAgreementStatus(
      commercialAgreementId: string,
      targetStatus: string,
      serviceDeps?: CommercialAgreementCommandServiceDeps,
    ): { result: CommandResult; commercialAgreement: CommercialAgreement | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'TransitionCommercialAgreementStatus',
        aggregateId: commercialAgreementId,
        targetStatus,
        clientRequestId: createClientRequestId('TransitionCommercialAgreementStatus'),
      } as const
      const result = executeCommand(command, effectiveDeps)
      if (!result.success) return { result, commercialAgreement: null }
      const commercialAgreement = resolveRepository(effectiveDeps).getById(commercialAgreementId) ?? null
      return { result, commercialAgreement }
    },
    awardCommercialAgreement(
      commercialAgreementId: string,
      actorUserId?: string,
      createContract = true,
      serviceDeps?: CommercialAgreementCommandServiceDeps,
    ): { result: CommandResult; commercialAgreement: CommercialAgreement | null } {
      const effectiveDeps = serviceDeps ?? deps
      const command = {
        commandType: 'AwardCommercialAgreement',
        aggregateId: commercialAgreementId,
        commercialAgreementId,
        actorUserId,
        createContract,
        clientRequestId: createClientRequestId('AwardCommercialAgreement'),
      } as const
      const result = executeCommand(command, effectiveDeps)
      if (!result.success) return { result, commercialAgreement: null }
      const commercialAgreement = resolveRepository(effectiveDeps).getById(commercialAgreementId) ?? null
      return { result, commercialAgreement }
    },
  }
}

export const commercialAgreementCommandService = createCommercialAgreementCommandService()
