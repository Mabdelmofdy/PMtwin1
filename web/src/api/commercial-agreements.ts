import type { CommercialAgreement } from '@/types/domain.ts'
import {
  assertNoLifecycleStatusInPatch,
  rejectLifecycleStatusBypass,
} from '@/lib/lifecycle-status-guard.ts'
import { commercialAgreementService } from '@/services/commercial-agreement-service.ts'

export const commercialAgreementsApi = {
  list: () => commercialAgreementService.getCommercialAgreements(),
  get: (id: string) => commercialAgreementService.getCommercialAgreementById(id),
  createFromNegotiation: (negotiationId: string) =>
    commercialAgreementService.createCommercialAgreementFromNegotiation(negotiationId),
  updateStatus: (_id: string, _status: string) => {
    rejectLifecycleStatusBypass()
  },
  update: (id: string, patch: Partial<CommercialAgreement>) => {
    assertNoLifecycleStatusInPatch(patch)
    void id
    void patch
  },
}
