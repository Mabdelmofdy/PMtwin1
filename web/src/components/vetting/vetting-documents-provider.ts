import type { PartyDocument } from '@/types/party-document.ts'
import {
  REQUIRED_VETTING_DOCUMENT_TYPES,
  resolveDocumentLabel,
  resolveLatestDocumentsByType,
} from '@/domain/vetting-readiness/vetting-readiness-rules.ts'

export type VettingDocumentPresentation = {
  readonly id: string
  readonly label: string
  readonly category: 'required' | 'optional'
}

/** Presentation seed — future swap point for Collaboration Knowledge Registry. */
const OPTIONAL_VETTING_DOCUMENT_SEED: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'certification', label: 'Certification' },
  { id: 'bank_letter', label: 'Bank Letter' },
  { id: 'authorization_letter', label: 'Authorization Letter' },
  { id: 'company_profile', label: 'Company Profile' },
  { id: 'trade_license', label: 'Trade License' },
] as const

export function getRequiredDocuments(): readonly VettingDocumentPresentation[] {
  return REQUIRED_VETTING_DOCUMENT_TYPES.map((id) => ({
    id,
    label: resolveDocumentLabel(id),
    category: 'required' as const,
  }))
}

export function getOptionalDocuments(): readonly VettingDocumentPresentation[] {
  return OPTIONAL_VETTING_DOCUMENT_SEED.map((entry) => ({
    id: entry.id,
    label: entry.label,
    category: 'optional' as const,
  }))
}

function normalizeDocumentType(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

function isDocumentComplete(document: PartyDocument | undefined): boolean {
  if (!document) return false
  return document.status === 'approved' || document.status === 'pending_review'
}

export function resolveDocumentsProgress(documents: readonly PartyDocument[]): {
  readonly required: { readonly completed: number; readonly total: number }
  readonly optional: { readonly completed: number; readonly total: number }
} {
  const vettingDocuments = documents.filter((document) => document.documentCategory === 'vetting')
  const documentMap = resolveLatestDocumentsByType(vettingDocuments)
  const required = getRequiredDocuments()
  const optional = getOptionalDocuments()

  let requiredCompleted = 0
  for (const entry of required) {
    const document = documentMap.get(entry.id)
    if (document?.status === 'approved') {
      requiredCompleted += 1
    }
  }

  let optionalCompleted = 0
  for (const entry of optional) {
    const document = documentMap.get(normalizeDocumentType(entry.id))
    if (isDocumentComplete(document)) {
      optionalCompleted += 1
    }
  }

  return {
    required: { completed: requiredCompleted, total: required.length },
    optional: { completed: optionalCompleted, total: optional.length },
  }
}
