import type { Deal, Opportunity } from '@/types/domain.ts'
import {
  dealRepository,
  negotiationRepository,
  opportunityRepository,
} from '@/repositories/index.ts'

export const dealService = {
  getDeals(): Deal[] {
    return dealRepository.getAll()
  },

  getDealById(id: string): Deal | undefined {
    return dealRepository.getById(id)
  },

  createDealFromNegotiation(negotiationId: string): Deal | null {
    const negotiation = negotiationRepository.getById(negotiationId)
    if (!negotiation) return null

    const existing = dealRepository
      .getAll()
      .find((d) => d.negotiationId === negotiationId)
    if (existing) return existing

    const deal = dealRepository.create({
      negotiationId,
      opportunityId: negotiation.opportunityId ?? '',
      title: `Deal from ${negotiationId}`,
      status: 'active',
      parties: negotiation.parties ?? [],
      terms: negotiation.agreedTerms ?? negotiation.initialTerms,
    })
    return deal
  },

  updateDealStatus(id: string, status: string): void {
    dealRepository.update(id, { status })
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
      draft: items.filter((o) => o.status === 'draft'),
      published: items.filter((o) => o.status === 'published'),
      in_progress: items.filter((o) =>
        ['in_negotiation', 'contracted', 'in_execution'].includes(
          o.status || '',
        ),
      ),
      closed: items.filter((o) =>
        ['closed', 'cancelled', 'completed'].includes(o.status || ''),
      ),
    }
  },

  updateOpportunityStatus(id: string, status: string): void {
    opportunityRepository.update(id, { status } as Partial<Opportunity>)
  },
}
