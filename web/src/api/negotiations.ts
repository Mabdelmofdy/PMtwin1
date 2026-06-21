import type { Negotiation } from '@/types/domain.ts'
import { negotiationRepository } from '@/repositories/index.ts'

export const negotiationsApi = {
  list: () => negotiationRepository.getAll(),
  get: (id: string) => negotiationRepository.getById(id),
  getByOpportunity: (opportunityId: string) =>
    negotiationRepository.getByOpportunity(opportunityId),
  getByParty: (userId: string) => negotiationRepository.getByParty(userId),
  update: (id: string, patch: Partial<Negotiation>) =>
    negotiationRepository.update(id, patch),
}
