import { contractService } from '@/services/contract-service.ts'

export const contractsApi = {
  list: () => contractService.getContracts(),
  get: (id: string) => contractService.getContractById(id),
  getByDealId: (dealId: string) => contractService.getContractsByDealId(dealId),
}
