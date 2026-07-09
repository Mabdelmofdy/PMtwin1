export const PARTY_DOCUMENT_CATEGORIES = [
  'vetting',
  'legal',
  'technical',
  'commercial',
  'financial',
  'insurance',
  'certification',
  'profile',
  'attachment',
] as const

export type PartyDocumentCategory = (typeof PARTY_DOCUMENT_CATEGORIES)[number]

export const PARTY_DOCUMENT_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
  'expired',
  'replacement_requested',
] as const

export type PartyDocumentStatus = (typeof PARTY_DOCUMENT_STATUSES)[number]

export type PartyDocument = {
  id: string
  ownerPartyId: string
  uploadedByUserId: string
  documentCategory: PartyDocumentCategory
  documentType: string
  fileName: string
  status: PartyDocumentStatus
  expiryDate?: string
  uploadedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}
