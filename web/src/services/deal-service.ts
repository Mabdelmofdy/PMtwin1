import type { Deal } from '@/types/domain.ts'
import { opportunityPipelineBucket } from '@/lib/status-display.ts'
import {
  COMMERCIAL_AGREEMENT_COMMAND_PATH_REQUIRED_ERROR,
  commercialAgreementService,
  createCommercialAgreementService,
  type CommercialAgreementServiceDeps,
} from '@/services/commercial-agreement-service.ts'
import { rejectLifecycleStatusBypass } from '@/lib/lifecycle-status-guard.ts'
import type { Opportunity } from '@/types/domain.ts'
import { isOpportunityOwnedByContext } from '@/domain/identity/ownership-adapters.ts'

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
      opportunities: Array<
        Pick<
          Opportunity,
          'status' | 'creatorId' | 'workspaceId' | 'ownerPartyId' | 'intent'
        >
      >,
      userId: string,
      intentFilter: '' | 'request' | 'offer' = '',
      activeContext?: {
        readonly activeWorkspaceId?: string
        readonly activePartyId?: string
      },
    ) {
      let items = opportunities.filter((opportunity) =>
        isOpportunityOwnedByContext(opportunity, {
          ...activeContext,
          userId,
        }) ||
          // Pipeline boards historically scoped by creatorId; keep dual-read when
          // the caller has not supplied an active Workspace/Party context.
          (!activeContext?.activeWorkspaceId &&
            !activeContext?.activePartyId &&
            opportunity.creatorId === userId),
      )
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

