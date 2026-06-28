import type { CommandGatewayTestStack } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import type { ContractDetailReadModelDeps } from '@/lib/contract-detail-read-model.ts'
import type { DealDetailReadModelDeps } from '@/lib/deal-detail-read-model.ts'
import type { OpportunityMatchesReadModelDeps } from '@/lib/opportunity-matches-read-model.ts'

export type ReadModelRepositoryDepsOptions = {
  readonly getPersonName?: (userId: string) => string | undefined
}

export function createDealDetailReadModelDepsFromStack(
  stack: CommandGatewayTestStack,
  options: ReadModelRepositoryDepsOptions = {},
): DealDetailReadModelDeps {
  return {
    getDeal: (id) => stack.dealRepository.getById(id),
    getNegotiation: (id) => stack.negotiationRepository.getById(id),
    getPostMatch: (id) => stack.postMatchRepository.getById(id),
    getOpportunity: (id) => stack.opportunityRepository.getById(id),
    getContractsForDeal: (id) => stack.contractRepository.findByDealId(id),
    getPersonName: options.getPersonName,
  }
}

export function createContractDetailReadModelDepsFromStack(
  stack: CommandGatewayTestStack,
  options: ReadModelRepositoryDepsOptions = {},
): ContractDetailReadModelDeps {
  return {
    getContract: (id) => stack.contractRepository.getById(id),
    getDeal: (id) => stack.dealRepository.getById(id),
    getNegotiation: (id) => stack.negotiationRepository.getById(id),
    getOpportunity: (id) => stack.opportunityRepository.getById(id),
    getPersonName: options.getPersonName,
  }
}

export function createOpportunityMatchesReadModelDepsFromStack(
  stack: CommandGatewayTestStack,
  options: ReadModelRepositoryDepsOptions & {
    readonly currentUserId?: string | null
  } = {},
): OpportunityMatchesReadModelDeps {
  return {
    getPostMatchesByOpportunity: (opportunityId) =>
      stack.postMatchRepository.getByOpportunity(opportunityId),
    getOpportunity: (id) => stack.opportunityRepository.getById(id),
    getNegotiationsForPostMatch: (postMatchId) =>
      stack.negotiationRepository.getByPostMatchId(postMatchId),
    getDealForPostMatch: (postMatchId) =>
      stack.dealRepository.findByPostMatchId(postMatchId),
    getPersonName: options.getPersonName,
    currentUserId: options.currentUserId ?? null,
  }
}
