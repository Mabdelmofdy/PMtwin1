export {
  setCommercialAgreementCommandGatewayForTests as setDealCommandGatewayForTests,
} from '@/services/commercial-agreement-command-service.ts'
import type { CommandResult } from '@pm-twin/commands'
import type { Deal } from '@/types/domain.ts'
import {
  createCommercialAgreementCommandService,
  type CommercialAgreementCommandServiceDeps,
} from '@/services/commercial-agreement-command-service.ts'
import type { CommercialAgreementRepository } from '@/repositories/commercial-agreement-repository.ts'

export type DealCommandServiceDeps = CommercialAgreementCommandServiceDeps & {
  /** @deprecated Use commercialAgreementRepository */
  readonly dealRepository?: CommercialAgreementRepository
}

function resolveCommercialAgreementDeps(
  deps?: DealCommandServiceDeps,
): CommercialAgreementCommandServiceDeps | undefined {
  if (!deps) return undefined
  return {
    gateway: deps.gateway,
    commercialAgreementRepository:
      deps.commercialAgreementRepository ?? deps.dealRepository,
  }
}

export function createDealCommandService(deps?: DealCommandServiceDeps) {
  const service = createCommercialAgreementCommandService(
    resolveCommercialAgreementDeps(deps),
  )
  return {
    createDealFromPostMatch(
      postMatchId: string,
      negotiationId: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const { result, commercialAgreement } =
        service.createCommercialAgreementFromPostMatch(
          postMatchId,
          negotiationId,
          resolveCommercialAgreementDeps(serviceDeps),
        )
      return { result, deal: commercialAgreement }
    },
    createDealFromApplication(
      applicationId: string,
      negotiationId: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const { result, commercialAgreement } =
        service.createCommercialAgreementFromApplication(
          applicationId,
          negotiationId,
          resolveCommercialAgreementDeps(serviceDeps),
        )
      return { result, deal: commercialAgreement }
    },
    createDealFromNegotiation(
      negotiationId: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const { result, commercialAgreement } =
        service.createCommercialAgreementFromNegotiation(
          negotiationId,
          resolveCommercialAgreementDeps(serviceDeps),
        )
      return { result, deal: commercialAgreement }
    },
    transitionDealStatus(
      dealId: string,
      targetStatus: string,
      serviceDeps?: DealCommandServiceDeps,
    ): { result: CommandResult; deal: Deal | null } {
      const { result, commercialAgreement } =
        service.transitionCommercialAgreementStatus(
          dealId,
          targetStatus,
          resolveCommercialAgreementDeps(serviceDeps),
        )
      return { result, deal: commercialAgreement }
    },
  }
}

export const dealCommandService = createDealCommandService()
