/** Canonical + legacy seed values — screens must accept both until data migration. */

/** Canonical opportunity intent (ADR-002). */
export type OpportunityIntent = 'need' | 'offer' | 'hybrid'

/** Stored intent during migration — legacy `request` maps to canonical `need`. */
export type OpportunityIntentStored = OpportunityIntent | 'request'

export type OpportunityStatus =
  | 'draft'
  | 'published'
  | 'matched'
  | 'negotiation'
  | 'in_negotiation'
  | 'contracted'
  | 'execution'
  | 'in_execution'
  | 'completed'
  | 'cancelled'
  | 'closed'

export type OpportunityVisibilityStatus =
  | 'published'
  | 'closed'
  | 'archived'

export type ApplicationStatus =
  | 'submitted'
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'negotiation'
  | 'in_negotiation'
  | 'contracted'

export type NegotiationStatus =
  | 'active'
  | 'countered'
  | 'counter_offered'
  | 'agreed'
  | 'expired'
  | 'cancelled'

export type CommercialAgreementStatus =
  | 'draft'
  | 'active'
  | 'execution'
  | 'completed'
  | 'cancelled'
  | 'negotiating'
  | 'signing'
/** @deprecated Use CommercialAgreementStatus */
export type DealStatus = CommercialAgreementStatus

export type ContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending'
  | 'active'
  | 'completed'
  | 'terminated'

export type UserRole =
  | 'professional'
  | 'company_owner'
  | 'admin'
  | 'moderator'
  | 'auditor'

export type MatchType =
  | 'one_way'
  | 'two_way'
  | 'consortium'
  | 'circular'
  | 'replacement'

export type NotificationType =
  | 'new_match_found'
  | 'application_status_changed'
  | 'application_updated'
  | 'deal_created_from_application'
  | 'deal_created_from_match'
  | 'deal_activated'
  | 'contract_fully_signed'
  | 'negotiation_started'
  | 'match_confirmed'
  | 'review_received'
  | 'commercial_agreement_awarded'
  | 'commercial_agreement_accepted'
  | 'commercial_agreement_rejected'
  | 'contract_ready'

export type AuditActorType = 'user' | 'system' | 'admin' | 'service'

export type EntityType =
  | 'user'
  | 'company'
  | 'opportunity'
  | 'application'
  | 'post_match'
  | 'negotiation'
  | 'deal'
  | 'contract'
  | 'notification'
  | 'audit'
