import {
  DOCUMENT_REASON_CODES,
  type DocumentReasonCode,
} from '../reason-codes/document.ts'
import {
  VETTING_REASON_CODES,
  type VettingReasonCode,
} from '../reason-codes/vetting.ts'
import type {
  VettingDocumentEntry,
  VettingReviewProgress,
} from './vetting-types.ts'

/** Human labels from vetting-readiness-rules.ts → canonical DOCUMENT_* reason codes. */
export const VETTING_DOCUMENT_LABEL_TO_REASON_CODE: Readonly<
  Record<string, DocumentReasonCode>
> = {
  'Document: Commercial Registration': DOCUMENT_REASON_CODES.CR_MISSING,
  'Document: VAT Certificate': DOCUMENT_REASON_CODES.VAT_MISSING,
  'Document: Insurance Certificate': DOCUMENT_REASON_CODES.INSURANCE_MISSING,
  'Document: License': DOCUMENT_REASON_CODES.LICENSE_MISSING,
  'Document: National ID': DOCUMENT_REASON_CODES.NATIONAL_ID_MISSING,
}

const VETTING_DOCUMENT_TYPE_TO_REASON_CODE: Readonly<
  Record<string, DocumentReasonCode>
> = {
  commercial_registration: DOCUMENT_REASON_CODES.CR_MISSING,
  vat_certificate: DOCUMENT_REASON_CODES.VAT_MISSING,
  insurance_certificate: DOCUMENT_REASON_CODES.INSURANCE_MISSING,
  license: DOCUMENT_REASON_CODES.LICENSE_MISSING,
  national_id: DOCUMENT_REASON_CODES.NATIONAL_ID_MISSING,
}

const VETTING_DOCUMENT_TYPE_HREF_SLUG: Readonly<Record<string, string>> = {
  commercial_registration: 'commercial_registration',
  vat_certificate: 'vat_certificate',
  insurance_certificate: 'insurance_certificate',
  license: 'license',
  national_id: 'national_id',
}

/** Review gap labels from vetting-readiness-evaluator.ts → VETTING_* reason codes. */
export const VETTING_REVIEW_GAP_LABEL_TO_REASON_CODE: Readonly<
  Record<string, VettingReasonCode>
> = {
  'Start admin review': VETTING_REASON_CODES.REVIEW_NOT_STARTED,
  'Resolve requested changes and resubmit':
    VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
}

export const VETTING_REVIEW_PROGRESS_TO_REASON_CODE: Readonly<
  Record<VettingReviewProgress, VettingReasonCode>
> = {
  not_started: VETTING_REASON_CODES.REVIEW_NOT_STARTED,
  in_review: VETTING_REASON_CODES.REVIEW_IN_PROGRESS,
  changes_requested: VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
  approved: VETTING_REASON_CODES.REVIEW_APPROVED,
}

function toParameterizedDocumentCode(label: string): DocumentReasonCode {
  const slug = label
    .replace(/^Document:\s*/i, '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return `DOCUMENT_${slug}_MISSING` as DocumentReasonCode
}

export function vettingDocumentLabelToReasonCode(label: string): DocumentReasonCode {
  return (
    VETTING_DOCUMENT_LABEL_TO_REASON_CODE[label] ?? toParameterizedDocumentCode(label)
  )
}

export function vettingDocumentTypeToReasonCode(type: string): DocumentReasonCode {
  const normalized = type.trim().toLowerCase().replace(/\s+/g, '_')
  return (
    VETTING_DOCUMENT_TYPE_TO_REASON_CODE[normalized] ??
    (`DOCUMENT_${normalized.toUpperCase()}_MISSING` as DocumentReasonCode)
  )
}

export function vettingReviewGapLabelToReasonCode(label: string): VettingReasonCode {
  return (
    VETTING_REVIEW_GAP_LABEL_TO_REASON_CODE[label] ??
    VETTING_REASON_CODES.REVIEW_PENDING
  )
}

export function vettingReviewProgressToReasonCode(
  progress: VettingReviewProgress,
): VettingReasonCode {
  return VETTING_REVIEW_PROGRESS_TO_REASON_CODE[progress]
}

export function vettingDocumentLabelToHref(label: string): string {
  for (const [documentLabel, code] of Object.entries(
    VETTING_DOCUMENT_LABEL_TO_REASON_CODE,
  )) {
    if (documentLabel === label) {
      const type = Object.entries(VETTING_DOCUMENT_TYPE_TO_REASON_CODE).find(
        ([, reasonCode]) => reasonCode === code,
      )?.[0]
      if (type) {
        return `/vetting/documents#${VETTING_DOCUMENT_TYPE_HREF_SLUG[type] ?? type}`
      }
    }
  }

  const slug = label
    .replace(/^Document:\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

  return `/vetting/documents#${slug}`
}

export function vettingDocumentTypeToHref(type: string): string {
  const normalized = type.trim().toLowerCase().replace(/\s+/g, '_')
  return `/vetting/documents#${VETTING_DOCUMENT_TYPE_HREF_SLUG[normalized] ?? normalized}`
}

export function vettingReviewGapLabelToHref(label: string): string {
  if (label === 'Resolve requested changes and resubmit') {
    return '/vetting/review#resubmit'
  }
  return '/vetting/review#start'
}

export function isVettingDocumentGapLabel(label: string): boolean {
  return label.startsWith('Document: ')
}

export function resolveDocumentEntry(
  documents: readonly VettingDocumentEntry[] | undefined,
  type: string,
): VettingDocumentEntry | undefined {
  const normalized = type.trim().toLowerCase().replace(/\s+/g, '_')
  return documents?.find(
    (entry) => entry.type.trim().toLowerCase().replace(/\s+/g, '_') === normalized,
  )
}
