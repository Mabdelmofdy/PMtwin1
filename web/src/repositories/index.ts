import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import {
  loadOpportunities,
  loadUsers,
  loadCompanies,
  loadApplications,
  loadPostMatches,
  loadNegotiations,
  loadNotifications,
  loadDeals,
  loadPendingUsers,
  loadAuditLog,
} from '@/infrastructure/seed/seed-loader.ts'

import { UserRepository } from './user-repository.ts'
import { CompanyRepository } from './company-repository.ts'
import { OpportunityRepository } from './opportunity-repository.ts'
import { ApplicationRepository } from './application-repository.ts'
import { DealRepository } from './deal-repository.ts'
import { PostMatchRepository } from './post-match-repository.ts'
import { NegotiationRepository } from './negotiation-repository.ts'
import { ContractRepository } from './contract-repository.ts'
import { NotificationRepository } from './notification-repository.ts'
import { AuditRepository } from './audit-repository.ts'

export const userRepository = new UserRepository(
  localStorageAdapter,
  loadUsers,
)

export const companyRepository = new CompanyRepository(
  localStorageAdapter,
  loadCompanies,
)

export const opportunityRepository = new OpportunityRepository(
  localStorageAdapter,
  loadOpportunities,
)

export const applicationRepository = new ApplicationRepository(
  localStorageAdapter,
  loadApplications,
)

export const dealRepository = new DealRepository(
  localStorageAdapter,
  loadDeals,
)

export const postMatchRepository = new PostMatchRepository(
  localStorageAdapter,
  loadPostMatches,
)

export const negotiationRepository = new NegotiationRepository(
  localStorageAdapter,
  loadNegotiations,
)

export const contractRepository = new ContractRepository(
  localStorageAdapter,
  () => [],
)

export const notificationRepository = new NotificationRepository(
  localStorageAdapter,
  loadNotifications,
)

export const auditRepository = new AuditRepository(
  localStorageAdapter,
  loadAuditLog,
)

export {
  UserRepository,
  CompanyRepository,
  OpportunityRepository,
  ApplicationRepository,
  DealRepository,
  PostMatchRepository,
  NegotiationRepository,
  ContractRepository,
  NotificationRepository,
  AuditRepository,
}

export { loadPendingUsers, loadAuditLog }
