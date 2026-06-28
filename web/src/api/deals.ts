import type { Deal } from '@/types/domain.ts'
import {
  assertNoLifecycleStatusInPatch,
  rejectLifecycleStatusBypass,
} from '@/lib/lifecycle-status-guard.ts'
import { dealService } from '@/services/deal-service.ts'

export const dealsApi = {
  list: () => dealService.getDeals(),
  get: (id: string) => dealService.getDealById(id),
  createFromNegotiation: (negotiationId: string) =>
    dealService.createDealFromNegotiation(negotiationId),
  updateStatus: (_id: string, _status: string) => {
    rejectLifecycleStatusBypass()
  },
  update: (id: string, patch: Partial<Deal>) => {
    assertNoLifecycleStatusInPatch(patch)
    void id
    void patch
  },
}
