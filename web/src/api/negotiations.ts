import type { Negotiation } from '@/types/domain.ts'
import { assertNoLifecycleStatusInPatch } from '@/lib/lifecycle-status-guard.ts'
import { negotiationRepository } from '@/repositories/index.ts'

export const negotiationsApi = {
  list: () => negotiationRepository.getAll(),
  get: (id: string) => negotiationRepository.getById(id),
  getByOpportunity: (opportunityId: string) =>
    negotiationRepository.getByOpportunity(opportunityId),
  getByParty: (userId: string) => negotiationRepository.getByParty(userId),
  getByPostMatchId: (postMatchId: string) =>
    negotiationRepository.getByPostMatchId(postMatchId),
  update: (id: string, patch: Partial<Negotiation>) => {
    assertNoLifecycleStatusInPatch(patch)
    negotiationRepository.update(id, patch)
  },
}
