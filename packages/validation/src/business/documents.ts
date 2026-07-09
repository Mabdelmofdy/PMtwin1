import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import {
  complianceIncludes,
  hasAttachmentNamed,
  parseIsoDate,
  todayIso,
} from '../validators/primitives.ts'

const PUBLISH_ONLY = ['publish'] as const

function docIssue(code: string, fieldPaths: readonly string[]): ValidationIssue {
  return {
    code,
    source: 'document',
    severity: 'blocker',
    scope: PUBLISH_ONLY,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'documents',
  }
}

function requiresDoc(
  requirements: readonly string[] | undefined,
  needles: readonly string[],
): boolean {
  return needles.some((n) => complianceIncludes(requirements, n))
}

export const docCrRequired: ValidationRule = {
  id: 'doc-cr-required',
  code: VAL_CODES.DOC_CR_REQUIRED,
  layer: 'business',
  source: 'document',
  severity: 'blocker',
  scope: PUBLISH_ONLY,
  fieldPaths: ['attachments', 'complianceRequirements'],
  group: 'documents',
  execute(input) {
    if (!requiresDoc(input.complianceRequirements, ['cr', 'commercial registration'])) {
      return null
    }
    if (hasAttachmentNamed(input.attachments, 'cr')) return null
    if (hasAttachmentNamed(input.attachments, 'commercial registration')) return null
    return docIssue(VAL_CODES.DOC_CR_REQUIRED, ['attachments'])
  },
}

export const docInsuranceRequired: ValidationRule = {
  id: 'doc-insurance-required',
  code: VAL_CODES.DOC_INSURANCE_REQUIRED,
  layer: 'business',
  source: 'document',
  severity: 'blocker',
  scope: PUBLISH_ONLY,
  fieldPaths: ['attachments'],
  group: 'documents',
  execute(input) {
    if (!requiresDoc(input.complianceRequirements, ['insurance'])) return null
    if (hasAttachmentNamed(input.attachments, 'insurance')) return null
    return docIssue(VAL_CODES.DOC_INSURANCE_REQUIRED, ['attachments'])
  },
}

export const docPerformanceBondRequired: ValidationRule = {
  id: 'doc-performance-bond-required',
  code: VAL_CODES.DOC_PERFORMANCE_BOND_REQUIRED,
  layer: 'business',
  source: 'document',
  severity: 'blocker',
  scope: PUBLISH_ONLY,
  fieldPaths: ['attachments'],
  group: 'documents',
  execute(input) {
    if (
      !requiresDoc(input.complianceRequirements, [
        'performance bond',
        'performance_bond',
      ])
    ) {
      return null
    }
    if (
      hasAttachmentNamed(input.attachments, 'performance bond') ||
      hasAttachmentNamed(input.attachments, 'performance_bond')
    ) {
      return null
    }
    return docIssue(VAL_CODES.DOC_PERFORMANCE_BOND_REQUIRED, ['attachments'])
  },
}

export const docExpired: ValidationRule = {
  id: 'doc-expired',
  code: VAL_CODES.DOC_EXPIRED,
  layer: 'business',
  source: 'document',
  severity: 'blocker',
  scope: PUBLISH_ONLY,
  fieldPaths: ['attributes.documentExpiresAt'],
  group: 'documents',
  execute(input, context) {
    const expiresRaw = input.attributes?.documentExpiresAt
    const expires = parseIsoDate(expiresRaw)
    if (!expires) return null
    const today = parseIsoDate(context.today ?? todayIso(context.now))
    if (!today) return null
    if (expires.getTime() >= today.getTime()) return null
    return docIssue(VAL_CODES.DOC_EXPIRED, ['attributes.documentExpiresAt'])
  },
}

export const DOCUMENT_RULES: readonly ValidationRule[] = [
  docCrRequired,
  docInsuranceRequired,
  docPerformanceBondRequired,
  docExpired,
]
