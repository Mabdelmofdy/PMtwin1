import type { Opportunity } from '@/types/domain.ts'
import { assertNoLifecycleStatusInPatch } from '@/lib/lifecycle-status-guard.ts'
import type { OpportunityCollaborationPayload } from '@pm-twin/commands'
import { opportunityRepository } from '@/repositories/index.ts'
import { opportunityCommandService } from '@/services/opportunity-command-service.ts'

export const opportunitiesApi = {
  list: () => opportunityRepository.getAll(),
  listMarketplace: () => opportunityRepository.listPublishedForMarketplace(),
  get: (id: string) => opportunityRepository.getById(id),
  create: (payload: OpportunityCollaborationPayload) => {
    const result = opportunityCommandService.createOpportunity(payload)
    if (!result.success) {
      throw new Error(result.errors?.join('\n') ?? 'CreateOpportunity failed')
    }
    return opportunityRepository.getById(result.aggregateId)
  },
  update: (id: string, patch: Partial<Opportunity>) => {
    assertNoLifecycleStatusInPatch(patch)
    opportunityRepository.update(id, patch)
  },
  updateViaCommand: (
    id: string,
    payload: Partial<OpportunityCollaborationPayload>,
  ) => {
    const result = opportunityCommandService.updateOpportunity(id, payload)
    if (!result.success) {
      throw new Error(result.errors?.join('\n') ?? 'UpdateOpportunity failed')
    }
    return opportunityRepository.getById(id)
  },
}
