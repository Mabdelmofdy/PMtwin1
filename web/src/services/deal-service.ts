import type { Deal } from '@/types/domain.ts'

import { opportunityPipelineBucket } from '@/lib/status-display.ts'

import type { DealRepository } from '@/repositories/deal-repository.ts'

import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'

import {

  dealRepository,

  negotiationRepository,

} from '@/repositories/index.ts'

import { rejectLifecycleStatusBypass } from '@/lib/lifecycle-status-guard.ts'

import {

  createDealCommandService,

  dealCommandService,

  type DealCommandServiceDeps,

} from '@/services/deal-command-service.ts'



export const DEAL_COMMAND_PATH_REQUIRED_ERROR =

  'Deal creation must use a command path.'



export type DealServiceDeps = {

  readonly negotiationRepository?: NegotiationRepository

  readonly dealRepository?: DealRepository

  readonly dealCommandService?: ReturnType<typeof createDealCommandService>

  readonly dealCommandServiceDeps?: DealCommandServiceDeps

}



function resolveNegotiationRepository(deps?: DealServiceDeps): NegotiationRepository {

  return deps?.negotiationRepository ?? negotiationRepository

}



function resolveDealRepository(deps?: DealServiceDeps): DealRepository {

  return deps?.dealRepository ?? dealRepository

}



function resolveDealCommandService(deps?: DealServiceDeps) {

  return deps?.dealCommandService ?? dealCommandService

}



export function createDealService(deps?: DealServiceDeps) {

  const commandServiceDeps = deps?.dealCommandServiceDeps



  return {

    getDeals(): Deal[] {

      return resolveDealRepository(deps).getAll()

    },



    getDealById(id: string): Deal | undefined {

      return resolveDealRepository(deps).getById(id)

    },



    createDealFromNegotiation(negotiationId: string): Deal | null {

      const negotiationRepo = resolveNegotiationRepository(deps)

      const dealRepo = resolveDealRepository(deps)

      const negotiation = negotiationRepo.getById(negotiationId)

      if (!negotiation) return null



      const existing =

        dealRepo.findByNegotiationId(negotiationId) ??

        dealRepo.getAll().find((deal) => deal.negotiationId === negotiationId)

      if (existing) return existing



      const { result, deal } = resolveDealCommandService(deps).createDealFromNegotiation(

        negotiationId,

        commandServiceDeps,

      )

      if (!result.success) {

        throw new Error(

          result.errors?.join('; ') ?? 'CreateDealFromNegotiation command failed',

        )

      }

      return deal

    },



    updateDealStatus(_id: string, _status: string): void {

      rejectLifecycleStatusBypass()

    },



    bucketOpportunitiesForPipeline(

      opportunities: Array<{

        status?: string

        creatorId?: string

        intent?: string

      }>,

      userId: string,

      intentFilter: '' | 'request' | 'offer' = '',

    ) {

      let items = opportunities.filter((o) => o.creatorId === userId)

      if (intentFilter) {

        items = items.filter(

          (o) => (o.intent || 'request') === intentFilter,

        )

      }

      return {

        draft: items.filter(

          (o) => opportunityPipelineBucket(o.status) === 'draft',

        ),

        published: items.filter(

          (o) => opportunityPipelineBucket(o.status) === 'published',

        ),

        in_progress: items.filter(

          (o) => opportunityPipelineBucket(o.status) === 'in_progress',

        ),

        closed: items.filter(

          (o) => opportunityPipelineBucket(o.status) === 'closed',

        ),

      }

    },



    updateOpportunityStatus(_id: string, _status: string): void {

      rejectLifecycleStatusBypass()

    },

  }

}



export const dealService = createDealService()

