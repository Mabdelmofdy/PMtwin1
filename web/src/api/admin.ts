import {
  auditRepository,
  loadPendingUsers,
} from '@/repositories/index.ts'
import { loadSiteContent } from '@/infrastructure/seed/seed-loader.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'

export const adminApi = {
  getAuditLog: () => auditRepository.getAll(),
  getPendingUsers: () => loadPendingUsers(),
  getSiteContent: () => loadSiteContent(),
  listOpportunities: () => opportunitiesApi.list(),
  listUsers: () => peopleApi.listAll(),
  listMatches: () => matchesApi.list(),
  listNegotiations: () => negotiationsApi.list(),
  listDeals: () => dealsApi.list(),
}
