import type { Deal } from '@/types/domain.ts'
import { opportunityPipelineBucket } from '@/lib/status-display.ts'
import {
  COMMERCIAL_AGREEMENT_COMMAND_PATH_REQUIRED_ERROR,
  commercialAgreementService,
  createCommercialAgreementService,
  type CommercialAgreementServiceDeps,
} from '@/services/commercial-agreement-service.ts'
import { rejectLifecycleStatusBypass } from '@/lib/lifecycle-status-guard.ts'

export const DEAL_COMMAND_PATH_REQUIRED_ERROR =
  COMMERCIAL_AGREEMENT_COMMAND_PATH_REQUIRED_ERROR

export type DealServiceDeps = CommercialAgreementServiceDeps

export function createDealService(deps?: DealServiceDeps) {
  const service = createCommercialAgreementService(deps)
  return {
    getDeals(): Deal[] {
      return service.getCommercialAgreements()
    },
    getDealById(id: string): Deal | undefined {
      return service.getCommercialAgreementById(id)
    },
    createDealFromNegotiation(negotiationId: string): Deal | null {
      return service.createCommercialAgreementFromNegotiation(negotiationId)
    },
    updateDealStatus(id: string, status: string): void {
      service.updateCommercialAgreementStatus(id, status)
    },
    /** @deprecated Pipeline must not bypass command gateway for opportunity status */
    updateOpportunityStatus(_id: string, _status: string): void {
      rejectLifecycleStatusBypass()
    },
    bucketOpportunitiesForPipeline(
      opportunities: Array<{ status?: string; creatorId?: string; intent?: string }>,
      userId: string,
      intentFilter: '' | 'request' | 'offer' = '',
    ) {
      let items = opportunities.filter((o) => o.creatorId === userId)
      if (intentFilter) {
        items = items.filter((o) => (o.intent || 'request') === intentFilter)
      }
      return {
        draft: items.filter((o) => opportunityPipelineBucket(o.status) === 'draft'),
        published: items.filter((o) => opportunityPipelineBucket(o.status) === 'published'),
        in_progress: items.filter((o) => opportunityPipelineBucket(o.status) === 'in_progress'),
        closed: items.filter((o) => opportunityPipelineBucket(o.status) === 'closed'),
      }
    },
  }
}

export const dealService = createDealService()
export { commercialAgreementService }

