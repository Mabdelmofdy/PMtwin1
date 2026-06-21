import type { Contract } from '@/types/domain.ts'
import { contractRepository } from '@/repositories/index.ts'

export const contractService = {
  getContracts(): Contract[] {
    return contractRepository.getAll()
  },

  getContractById(id: string): Contract | undefined {
    return contractRepository.getById(id)
  },
}
