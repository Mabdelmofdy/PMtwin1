import type { PartyDocument } from '@/types/party-document.ts'

export const REQUIRED_VETTING_DOCUMENT_TYPES = [
  'commercial_registration',
  'vat_certificate',
  'insurance_certificate',
  'license',
  'national_id',
] as const

export type RequiredVettingDocumentType = (typeof REQUIRED_VETTING_DOCUMENT_TYPES)[number]

function normalizeDocumentType(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

export function resolveLatestDocumentsByType(
  documents: readonly PartyDocument[],
): ReadonlyMap<string, PartyDocument> {
  const map = new Map<string, PartyDocument>()
  for (const document of documents) {
    const key = normalizeDocumentType(document.documentType)
    const existing = map.get(key)
    if (!existing || (existing.uploadedAt ?? '') < (document.uploadedAt ?? '')) {
      map.set(key, document)
    }
  }
  return map
}

export function resolveDocumentLabel(type: RequiredVettingDocumentType): string {
  const labels: Record<RequiredVettingDocumentType, string> = {
    commercial_registration: 'Commercial Registration',
    vat_certificate: 'VAT Certificate',
    insurance_certificate: 'Insurance Certificate',
    license: 'License',
    national_id: 'National ID',
  }
  return labels[type]
}

export function buildDocRequirementKey(type: RequiredVettingDocumentType): string {
  return `Document: ${resolveDocumentLabel(type)}`
}

