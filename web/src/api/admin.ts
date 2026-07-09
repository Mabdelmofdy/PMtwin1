import {
  companyRepository,
  auditRepository,
  loadPendingUsers,
  userRepository,
} from '@/repositories/index.ts'
import { loadSiteContent } from '@/infrastructure/seed/seed-loader.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { vettingService, type RequestVettingChangesInput } from '@/lib/vetting-service.ts'
import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument } from '@/types/party-document.ts'

export const adminApi = {
  getAuditLog: () => auditRepository.getAll(),
  getPendingUsers: () => {
    const seeded = loadPendingUsers().map((user) => ({
      user,
      activeParty: null,
      partyLabel: user.profile?.type === 'company' ? 'Company Party' : 'Individual Party',
    }))
    const repoPending = [...userRepository.getAll(), ...companyRepository.getAll()]
      .filter(
        (user) =>
          user.status === 'pending_vetting' ||
          user.status === 'pending' ||
          user.status === 'clarification_requested',
      )
      .map((user) => ({
        user,
        activeParty: null,
        partyLabel: user.profile?.type === 'company' ? 'Company Party' : 'Individual Party',
      }))

    const queue = [...seeded, ...repoPending, ...vettingService.listQueue()]
    const seen = new Set<string>()
    return queue.filter((entry) => {
      if (seen.has(entry.user.id)) return false
      seen.add(entry.user.id)
      return true
    })
  },
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
  listPartyDocuments: (ownerPartyId: string): PartyDocument[] =>
    vettingService.listPartyDocuments(ownerPartyId),
  reviewPartyDocument: (
    documentId: string,
    input: { status: 'approved' | 'rejected'; reviewedBy: string; reviewNotes?: string },
  ): PartyDocument | undefined =>
    vettingService.reviewPartyDocument(documentId, input),
}
