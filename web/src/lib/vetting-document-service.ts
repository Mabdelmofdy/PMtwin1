import type { PartyDocumentCategory, PartyDocumentStatus } from '@/types/party-document.ts'
import { partyDocumentRepository } from '@/repositories/index.ts'

export type UpsertVettingDocumentInput = {
  readonly ownerPartyId: string
  readonly uploadedByUserId: string
  readonly documentType: string
  readonly fileName: string
  readonly status?: PartyDocumentStatus
  readonly expiryDate?: string
  readonly documentCategory?: PartyDocumentCategory
  readonly replaceDocumentId?: string
}

export function upsertVettingDocument(input: UpsertVettingDocumentInput) {
  if (input.replaceDocumentId) {
    partyDocumentRepository.update(input.replaceDocumentId, {
      status: 'replacement_requested',
    })
  }

  return partyDocumentRepository.create({
    ownerPartyId: input.ownerPartyId,
    uploadedByUserId: input.uploadedByUserId,
    documentCategory: input.documentCategory ?? 'vetting',
    documentType: input.documentType,
    fileName: input.fileName,
    status: input.status ?? 'pending_review',
    expiryDate: input.expiryDate,
  })
}

