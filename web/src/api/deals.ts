import type { Deal } from '@/types/domain.ts'
import { dealService } from '@/services/deal-service.ts'

export const dealsApi = {
  list: () => dealService.getDeals(),
  get: (id: string) => dealService.getDealById(id),
  createFromNegotiation: (negotiationId: string) =>
    dealService.createDealFromNegotiation(negotiationId),
  updateStatus: (id: string, status: string) =>
    dealService.updateDealStatus(id, status),
  update: (id: string, patch: Partial<Deal>) => {
    if (patch.status) {
      dealService.updateDealStatus(id, patch.status)
    }
  },
}
