import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import {
  loadOpportunities,
  loadUsers,
  loadCompanies,
  loadApplications,
  loadPostMatches,
  loadNegotiations,
  loadNegotiationMessages,
  loadNegotiationOffers,
  loadNegotiationTranscriptEvents,
  loadNotifications,
  loadCommercialAgreements,
  loadContracts,
  loadPendingUsers,
  loadAuditLog,
} from '@/infrastructure/seed/seed-loader.ts'

import { UserRepository } from './user-repository.ts'
import { CompanyRepository } from './company-repository.ts'
import { OpportunityRepository } from './opportunity-repository.ts'
import { ApplicationRepository } from './application-repository.ts'
import { DealRepository } from './deal-repository.ts'
import { CommercialAgreementRepository } from './commercial-agreement-repository.ts'
import { PostMatchRepository } from './post-match-repository.ts'
import { NegotiationRepository } from './negotiation-repository.ts'
import { NegotiationMessageRepository } from './negotiation-message-repository.ts'
import { NegotiationOfferRepository } from './negotiation-offer-repository.ts'
import { NegotiationTranscriptRepository } from './negotiation-transcript-repository.ts'
import { ContractRepository } from './contract-repository.ts'
import { NotificationRepository } from './notification-repository.ts'
import { AuditRepository } from './audit-repository.ts'
import { ProductLanguageSettingsRepository } from './product-language-settings-repository.ts'

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

export const commercialAgreementRepository = new CommercialAgreementRepository(
  localStorageAdapter,
  loadCommercialAgreements,
)
/** @deprecated Use commercialAgreementRepository */
export const dealRepository = commercialAgreementRepository

export const postMatchRepository = new PostMatchRepository(
  localStorageAdapter,
  loadPostMatches,
)

export const negotiationRepository = new NegotiationRepository(
  localStorageAdapter,
  loadNegotiations,
)

export const negotiationMessageRepository = new NegotiationMessageRepository(
  localStorageAdapter,
  loadNegotiationMessages,
)

export const negotiationOfferRepository = new NegotiationOfferRepository(
  localStorageAdapter,
  loadNegotiationOffers,
)

export const negotiationTranscriptRepository = new NegotiationTranscriptRepository(
  localStorageAdapter,
  loadNegotiationTranscriptEvents,
)

export const contractRepository = new ContractRepository(
  localStorageAdapter,
  loadContracts,
)

export const notificationRepository = new NotificationRepository(
  localStorageAdapter,
  loadNotifications,
)

export const auditRepository = new AuditRepository(
  localStorageAdapter,
  loadAuditLog,
)

export const productLanguageSettingsRepository = new ProductLanguageSettingsRepository(
  localStorageAdapter,
)

export {
  UserRepository,
  CompanyRepository,
  OpportunityRepository,
  ApplicationRepository,
  CommercialAgreementRepository,
  DealRepository,
  PostMatchRepository,
  NegotiationRepository,
  NegotiationMessageRepository,
  NegotiationOfferRepository,
  NegotiationTranscriptRepository,
  ContractRepository,
  NotificationRepository,
  AuditRepository,
  ProductLanguageSettingsRepository,
}

export { loadPendingUsers, loadAuditLog, loadContracts }
