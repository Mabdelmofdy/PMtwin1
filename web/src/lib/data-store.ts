/**
 * @deprecated Use `@/api/*` modules or `@/repositories` instead.
 * Backward-compatibility facade delegating to the repository layer.
 */
import type {
  Application,
  AppNotification,
  AuditEntry,
  Company,
  Negotiation,
  Opportunity,
  PendingUser,
  PersonProfile,
  PlatformUser,
  PostMatch,
} from '@/types/domain.ts'
import {
  applicationRepository,
  auditRepository,
  companyRepository,
  negotiationRepository,
  notificationRepository,
  opportunityRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import { dealsApi } from '@/api/deals.ts'
import { loadPendingUsers, loadSiteContent } from '@/infrastructure/seed/seed-loader.ts'
import { negotiationService } from '@/services/negotiation-service.ts'

export type {
  Application,
  AppNotification,
  AuditEntry,
  Company,
  Negotiation,
  Opportunity,
  PendingUser,
  PersonProfile,
  PlatformUser,
  PostMatch,
}

export const dataStore = {
  /** @deprecated Use opportunitiesApi.list() */
  getOpportunities(): Opportunity[] {
    return opportunityRepository.getAll()
  },

  /** @deprecated Use opportunitiesApi.get() */
  getOpportunityById(id: string) {
    return opportunityRepository.getById(id)
  },

  /** @deprecated Use opportunitiesApi.update() */
  updateOpportunity(id: string, patch: Partial<Opportunity>) {
    opportunityRepository.update(id, patch)
  },

  /** @deprecated Use matchesApi.list() */
  getPostMatches(): PostMatch[] {
    return postMatchRepository.getAll()
  },

  /** @deprecated Use matchesApi.get() */
  getPostMatchById(id: string) {
    return postMatchRepository.getById(id)
  },

  /** @deprecated Use notificationsApi.list() */
  getNotifications(userId?: string): AppNotification[] {
    const uid = userId ?? 'seed-user-001'
    return notificationRepository.getByUserId(uid)
  },

  /** @deprecated Use applicationRepository.getAll() */
  getApplications(): Application[] {
    return applicationRepository.getAll()
  },

  /** @deprecated Use negotiationService.transitionApplicationStatus() */
  updateApplication(id: string, patch: Partial<Application>) {
    applicationRepository.update(id, patch)
  },

  /** @deprecated Use negotiationService.submitApplication() */
  createApplication(
    data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    return negotiationService.submitApplication(data)
  },

  /** @deprecated Use negotiationsApi.list() */
  getNegotiations(): Negotiation[] {
    return negotiationRepository.getAll()
  },

  /** @deprecated Use negotiationsApi.get() */
  getNegotiationById(id: string) {
    return negotiationRepository.getById(id)
  },

  /** @deprecated Use peopleApi.listUsers() */
  getUsers(): PlatformUser[] {
    return userRepository.getAll()
  },

  /** @deprecated Use peopleApi.get() */
  getUserById(id: string) {
    return userRepository.getById(id)
  },

  /** @deprecated Use peopleApi.listCompanies() */
  getCompanies(): Company[] {
    return companyRepository.getAll()
  },

  /** @deprecated Use peopleApi.get() */
  getCompanyById(id: string) {
    return companyRepository.getById(id)
  },

  /** @deprecated Use peopleApi.listAll() */
  getPeople(): PlatformUser[] {
    return [...userRepository.getAll(), ...companyRepository.getAll()]
  },

  /** @deprecated Use peopleApi.get() */
  getPersonById(id: string): PlatformUser | undefined {
    return userRepository.getById(id) ?? companyRepository.getById(id)
  },

  /** @deprecated Use adminApi.getPendingUsers() */
  getPendingUsers(): PendingUser[] {
    return loadPendingUsers()
  },

  /** @deprecated Use adminApi.getAuditLog() */
  getAuditLog(): AuditEntry[] {
    return auditRepository.getAll()
  },

  /** @deprecated Use adminApi.getSiteContent() */
  getSiteContent() {
    return loadSiteContent()
  },

  /** @deprecated Use dealsApi.list() */
  getDeals() {
    return dealsApi.list()
  },
}
