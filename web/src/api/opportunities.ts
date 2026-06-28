import type { Opportunity } from '@/types/domain.ts'
import { assertNoLifecycleStatusInPatch } from '@/lib/lifecycle-status-guard.ts'
import { opportunityRepository } from '@/repositories/index.ts'

export const opportunitiesApi = {
  list: () => opportunityRepository.getAll(),
  get: (id: string) => opportunityRepository.getById(id),
  update: (id: string, patch: Partial<Opportunity>) => {
    assertNoLifecycleStatusInPatch(patch)
    opportunityRepository.update(id, patch)
  },
}
