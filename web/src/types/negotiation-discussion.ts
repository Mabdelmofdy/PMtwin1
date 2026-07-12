import type { CommercialTerms } from '@/types/commercial-terms.ts'

export type NegotiationMessageVisibility = 'participants' | 'auditor'

export type NegotiationAttachment = {
  readonly id: string
  readonly fileName: string
  readonly mimeType?: string
  readonly sizeBytes?: number
  readonly url?: string
}

export type NegotiationMessage = {
  readonly id: string
  readonly negotiationId: string
  readonly senderId: string
  readonly senderRole: string
  readonly senderCompanyId?: string
  /** Canonical party the sender represented. */
  readonly partyId?: string
  readonly workspaceId?: string
  readonly actorUserId?: string
  readonly body: string
  readonly visibility: NegotiationMessageVisibility
  readonly createdAt: string
  readonly editedAt?: string
  readonly deletedAt?: string
  readonly attachments?: readonly NegotiationAttachment[]
  readonly originalBody?: string
}

export type NegotiationOfferStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'superseded'

export type NegotiationOffer = {
  readonly id: string
  readonly negotiationId: string
  readonly submittedBy: string
  readonly partyId?: string
  readonly workspaceId?: string
  readonly actorUserId?: string
  readonly version: number
  readonly terms: CommercialTerms
  readonly changeSummary?: string
  readonly status: NegotiationOfferStatus
  readonly createdAt: string
}

export type NegotiationTranscriptEventType =
  | 'message.sent'
  | 'message.edited'
  | 'offer.submitted'
  | 'offer.countered'
  | 'terms.changed'
  | 'negotiation.agreed'
  | 'negotiation.cancelled'
  | 'negotiation.expired'
  | 'attachment.added'
  | 'transcript.locked'

export type NegotiationTranscriptEvent = {
  readonly id: string
  readonly negotiationId: string
  readonly eventType: NegotiationTranscriptEventType
  readonly actorId: string
  readonly actorRole: string
  readonly actorType?: 'marketplace_user' | 'platform_operator' | 'system'
  readonly partyId?: string
  readonly workspaceId?: string
  readonly actorUserId?: string
  readonly timestamp: string
  readonly summary: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

export const NEGOTIATION_MESSAGES_STORAGE_KEY = 'pmtwin_negotiation_messages'
export const NEGOTIATION_OFFERS_STORAGE_KEY = 'pmtwin_negotiation_offers'
export const NEGOTIATION_TRANSCRIPT_STORAGE_KEY = 'pmtwin_negotiation_transcript_events'
