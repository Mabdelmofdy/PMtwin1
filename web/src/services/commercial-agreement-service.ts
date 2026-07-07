import type { CommercialAgreement } from '@/types/domain.ts'
import type { CommercialAgreementRepository } from '@/repositories/commercial-agreement-repository.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import {
  commercialAgreementRepository,
  negotiationRepository,
} from '@/repositories/index.ts'
import { rejectLifecycleStatusBypass } from '@/lib/lifecycle-status-guard.ts'
import {
  commercialAgreementCommandService,
  createCommercialAgreementCommandService,
  type CommercialAgreementCommandServiceDeps,
} from '@/services/commercial-agreement-command-service.ts'

export const COMMERCIAL_AGREEMENT_COMMAND_PATH_REQUIRED_ERROR =
  'Commercial agreement creation must use a command path.'

export type CommercialAgreementServiceDeps = {
  readonly negotiationRepository?: NegotiationRepository
  readonly commercialAgreementRepository?: CommercialAgreementRepository
  /** @deprecated Use commercialAgreementRepository */
  readonly dealRepository?: CommercialAgreementRepository
  readonly commercialAgreementCommandService?: ReturnType<typeof createCommercialAgreementCommandService>
  readonly commercialAgreementCommandServiceDeps?: CommercialAgreementCommandServiceDeps
}

function resolveNegotiationRepository(deps?: CommercialAgreementServiceDeps): NegotiationRepository {
  return deps?.negotiationRepository ?? negotiationRepository
}

function resolveCommercialAgreementRepository(
  deps?: CommercialAgreementServiceDeps,
): CommercialAgreementRepository {
  return deps?.commercialAgreementRepository ?? deps?.dealRepository ?? commercialAgreementRepository
}

function resolveService(deps?: CommercialAgreementServiceDeps) {
  return deps?.commercialAgreementCommandService ?? commercialAgreementCommandService
}

export function createCommercialAgreementService(deps?: CommercialAgreementServiceDeps) {
  const commandServiceDeps = deps?.commercialAgreementCommandServiceDeps
  return {
    getCommercialAgreements(): CommercialAgreement[] {
      return resolveCommercialAgreementRepository(deps).getAll()
    },
    getCommercialAgreementById(id: string): CommercialAgreement | undefined {
      return resolveCommercialAgreementRepository(deps).getById(id)
    },
    createCommercialAgreementFromNegotiation(negotiationId: string): CommercialAgreement | null {
      const negotiation = resolveNegotiationRepository(deps).getById(negotiationId)
      if (!negotiation) return null
      const existing = resolveCommercialAgreementRepository(deps).findByNegotiationId(negotiationId)
      if (existing) return existing
      const { result, commercialAgreement } =
        resolveService(deps).createCommercialAgreementFromNegotiation(
          negotiationId,
          commandServiceDeps,
        )
      if (!result.success) {
        throw new Error(
          result.errors?.join('; ') ??
            'CreateCommercialAgreementFromNegotiation command failed',
        )
      }
      return commercialAgreement
    },
    updateCommercialAgreementStatus(_id: string, _status: string): void {
      rejectLifecycleStatusBypass()
    },
  }
}

export const commercialAgreementService = createCommercialAgreementService()
