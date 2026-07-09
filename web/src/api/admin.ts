import {
  auditRepository,
} from '@/repositories/index.ts'
import { loadSiteContent } from '@/infrastructure/seed/seed-loader.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { vettingService, type RequestVettingChangesInput } from '@/lib/vetting-service.ts'
import type { PlatformUser } from '@/types/domain.ts'

export const adminApi = {
  getAuditLog: () => auditRepository.getAll(),
  getPendingUsers: () => vettingService.listQueue(),
  getSiteContent: () => loadSiteContent(),
  listOpportunities: () => opportunitiesApi.list(),
  listUsers: () => peopleApi.listAll(),
  listMatches: () => matchesApi.list(),
  listNegotiations: () => negotiationsApi.list(),
  listDeals: () => dealsApi.list(),
  approveVetting: (userId: string, partyId: string, reviewerId: string): PlatformUser | undefined =>
    vettingService.approve(userId, partyId, reviewerId),
  rejectVetting: (
    userId: string,
    partyId: string,
    reviewerId: string,
    reason?: string,
  ): PlatformUser | undefined =>
    vettingService.reject(userId, partyId, reviewerId, reason),
  requestVettingChanges: (
    input: RequestVettingChangesInput,
  ): PlatformUser | undefined =>
    vettingService.requestChanges(input),
}
