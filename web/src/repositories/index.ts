import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { ensureEnvironmentBootstrap } from '@/infrastructure/environment/environment-bootstrap-service.ts'
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
import { AdminSettingsRepository } from './admin-settings-repository.ts'
import { adminSettingsRepository } from './admin-settings-repository.ts'
import { PartyRepository } from './party-repository.ts'
import { PartyMembershipRepository } from './party-membership-repository.ts'
import { formatMembershipId } from './party-membership-repository.ts'

import { PartyDocumentRepository } from './party-document-repository.ts'

const runtimeMode = environmentContext.runtimeMode
const storageAdapter = environmentContext.storageAdapter ?? localStorageAdapter

if (runtimeMode === 'demo' || runtimeMode === 'uat') {
  ensureEnvironmentBootstrap(storageAdapter, runtimeMode)
}

export const userRepository = new UserRepository(
  storageAdapter,
  loadUsers,
)

export const companyRepository = new CompanyRepository(
  storageAdapter,
  loadCompanies,
)

export const opportunityRepository = new OpportunityRepository(
  storageAdapter,
  loadOpportunities,
)

export const applicationRepository = new ApplicationRepository(
  storageAdapter,
  loadApplications,
)

export const commercialAgreementRepository = new CommercialAgreementRepository(
  storageAdapter,
  loadCommercialAgreements,
)
/** @deprecated Use commercialAgreementRepository */
export const dealRepository = commercialAgreementRepository

export const postMatchRepository = new PostMatchRepository(
  storageAdapter,
  loadPostMatches,
)

export const negotiationRepository = new NegotiationRepository(
  storageAdapter,
  loadNegotiations,
)

export const negotiationMessageRepository = new NegotiationMessageRepository(
  storageAdapter,
  loadNegotiationMessages,
)

export const negotiationOfferRepository = new NegotiationOfferRepository(
  storageAdapter,
  loadNegotiationOffers,
)

export const negotiationTranscriptRepository = new NegotiationTranscriptRepository(
  storageAdapter,
  loadNegotiationTranscriptEvents,
)

export const contractRepository = new ContractRepository(
  storageAdapter,
  loadContracts,
)

export const notificationRepository = new NotificationRepository(
  storageAdapter,
  loadNotifications,
)

export const auditRepository = new AuditRepository(
  storageAdapter,
  loadAuditLog,
)

export const productLanguageSettingsRepository = new ProductLanguageSettingsRepository(
  storageAdapter,
)

export { adminSettingsRepository }

export const partyRepository = new PartyRepository(
  storageAdapter,
  loadUsers,
  loadCompanies,
)

export const partyMembershipRepository = new PartyMembershipRepository(
  storageAdapter,
  loadUsers,
  loadCompanies,
)

export const partyDocumentRepository = new PartyDocumentRepository(storageAdapter)

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
  AdminSettingsRepository,
  PartyRepository,
  PartyMembershipRepository,
  PartyDocumentRepository,
  formatMembershipId,
}

export { loadPendingUsers, loadAuditLog, loadContracts }
