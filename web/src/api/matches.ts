import { matchingService } from '@/services/matching-service.ts'
import { postMatchRepository } from '@/repositories/index.ts'

export const matchesApi = {
  list: () => postMatchRepository.getAll(),
  get: (id: string) => postMatchRepository.getById(id),
  getByOpportunity: (opportunityId: string) =>
    postMatchRepository.getByOpportunity(opportunityId),
  getHighMatches: (threshold?: number) => matchingService.getHighMatches(threshold),
  getForUser: (userId: string) => matchingService.getMatchesForUser(userId),
  getBreakdown: (matchId: string) => matchingService.getMatchBreakdown(matchId),
}
