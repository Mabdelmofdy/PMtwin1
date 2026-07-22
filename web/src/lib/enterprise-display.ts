/**
 * Enterprise presentation labels and reference numbers for Admin UI.
 * Presentation only — does not persist, migrate, or alter repository IDs.
 *
 * Repository IDs remain the system of record for routing, commands, and audit.
 * They must never be shown as primary user-facing labels.
 */

import type {
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PlatformUser,
  PostMatch,
} from '@/types/domain.ts'
import type { Party } from '@pm-twin/party'
import {
  formatContractDisplayTitle,
  formatDealDisplayTitle,
  formatNegotiationDisplayTitle,
  formatOpportunityDisplayTitle,
  type OpportunityLookup,
} from '@/lib/entity-display-titles.ts'
import { formatMatchDisplayTitle } from '@/lib/match-display.ts'
import { resolvePersonDisplayName } from '@/components/user/user-display.ts'

export type EnterpriseEntityKind =
  | 'opportunity'
  | 'post_match'
  | 'negotiation'
  | 'commercial_agreement'
  | 'contract'
  | 'user'
  | 'party'

const PREFIX: Record<EnterpriseEntityKind, string> = {
  opportunity: 'OPP',
  post_match: 'PM',
  negotiation: 'NEG',
  commercial_agreement: 'CA',
  contract: 'CTR',
  user: 'USR',
  party: 'CO',
}

/** Stable 32-bit hash of a string (presentation-only). */
export function stableHash32(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function padDigits(value: number, width: number): string {
  const mod = 10 ** width
  return String(Math.abs(value) % mod).padStart(width, '0')
}

/**
 * Year for reference numbers — prefers createdAt, else deterministic year from id.
 * Never invents random values.
 */
export function presentationYear(createdAt?: string | null, entityId?: string): number {
  if (createdAt) {
    const y = Date.parse(createdAt)
    if (Number.isFinite(y)) {
      const year = new Date(y).getFullYear()
      if (year >= 2000 && year <= 2100) return year
    }
  }
  if (entityId) {
    // Map hash into a stable 2020–2029 band when no timestamp exists
    return 2020 + (stableHash32(entityId) % 10)
  }
  return 2024
}

/** PREFIX-YYYY-NNNNN (or CO-XXXXX for party company codes). */
export function formatEnterpriseReference(
  kind: EnterpriseEntityKind,
  entityId: string,
  createdAt?: string | null,
): string {
  const year = presentationYear(createdAt, entityId)
  const prefix = PREFIX[kind]
  if (kind === 'party') {
    // Company Code: CO-XXXXX (5 alphanumeric from hash)
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const h = stableHash32(`party:${entityId}`)
    let code = ''
    let x = h
    for (let i = 0; i < 5; i += 1) {
      code += alphabet[x % alphabet.length]
      x = Math.floor(x / alphabet.length)
    }
    return `${prefix}-${code}`
  }
  const seq = padDigits(stableHash32(`${kind}:${entityId}`), 5)
  return `${prefix}-${year}-${seq}`
}

export function formatUserEmployeeNumber(
  userId: string,
  createdAt?: string | null,
): string {
  return formatEnterpriseReference('user', userId, createdAt)
}

export function formatPartyCompanyCode(partyId: string): string {
  return formatEnterpriseReference('party', partyId)
}

export function formatOpportunityPresentation(opportunity: Pick<Opportunity, 'id' | 'title' | 'createdAt'>): {
  readonly name: string
  readonly reference: string
} {
  return {
    name: formatOpportunityDisplayTitle(opportunity),
    reference: formatEnterpriseReference('opportunity', opportunity.id, opportunity.createdAt),
  }
}

export function formatPostMatchPresentation(
  match: PostMatch,
  getOpportunity: OpportunityLookup,
): {
  readonly title: string
  readonly reference: string
} {
  return {
    title: formatMatchDisplayTitle(match, getOpportunity),
    reference: formatEnterpriseReference('post_match', match.id, match.createdAt),
  }
}

export function formatNegotiationPresentation(
  negotiation: Negotiation,
  getOpportunity?: OpportunityLookup,
): {
  readonly title: string
  readonly reference: string
} {
  return {
    title: formatNegotiationDisplayTitle(negotiation, getOpportunity),
    reference: formatEnterpriseReference('negotiation', negotiation.id, negotiation.createdAt),
  }
}

export function formatCommercialAgreementPresentation(
  agreement: Pick<
    Deal,
    'id' | 'title' | 'createdAt' | 'needOpportunityId' | 'offerOpportunityId'
  >,
  getOpportunity?: OpportunityLookup,
): {
  readonly name: string
  readonly reference: string
} {
  return {
    name: formatDealDisplayTitle(agreement, {
      needTitle: agreement.needOpportunityId
        ? getOpportunity?.(agreement.needOpportunityId)?.title
        : null,
      offerTitle: agreement.offerOpportunityId
        ? getOpportunity?.(agreement.offerOpportunityId)?.title
        : null,
    }),
    reference: formatEnterpriseReference(
      'commercial_agreement',
      agreement.id,
      agreement.createdAt,
    ),
  }
}

export function formatContractPresentation(
  contract: Pick<Contract, 'id' | 'createdAt'> & {
    readonly dealTitle?: string | null
    readonly needTitle?: string | null
    readonly offerTitle?: string | null
    readonly title?: string | null
  },
): {
  readonly name: string
  readonly reference: string
} {
  const named = contract.title?.trim()
  return {
    name: named
      ? named
      : formatContractDisplayTitle({
          dealTitle: contract.dealTitle,
          needTitle: contract.needTitle,
          offerTitle: contract.offerTitle,
        }),
    reference: formatEnterpriseReference('contract', contract.id, contract.createdAt),
  }
}

export function formatUserPresentation(user: PlatformUser): {
  readonly fullName: string
  readonly employeeNumber: string
} {
  const fullName =
    resolvePersonDisplayName(user).trim() ||
    user.email?.trim() ||
    'Unnamed User'
  return {
    fullName,
    employeeNumber: formatUserEmployeeNumber(user.id, user.createdAt),
  }
}

export function formatPartyPresentation(party: Party): {
  readonly companyName: string
  readonly companyCode: string
} {
  return {
    companyName: party.displayName?.trim() || 'Unnamed Party',
    companyCode: formatPartyCompanyCode(party.id),
  }
}

/**
 * True when a string looks like an internal/demo repository id that should not be shown.
 */
export function looksLikeInternalId(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (!v) return false
  // Enterprise presentation refs are never internal ids
  if (/^(OPP|PM|NEG|CA|CTR|USR|CO|OFF|REC)-\d{4}-\d{5}$/i.test(v)) return false
  if (/^CO-[A-Z0-9]{5}$/i.test(v)) return false
  if (/^(demo|seed|mock|test|sample|fake)[-_]/i.test(v)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) {
    return true
  }
  // Compact internal ids like seed-opp-001, demo-user-12, neg-abc123
  // Do not match OPP-2024-01234 style references (already excluded above).
  if (
    /^(opp|neg|ca|ctr|pm|user|party|match|deal|contract|audit)[-_][a-z0-9]/i.test(v) &&
    !/^(opp|neg|ca|ctr|pm)-\d{4}-\d{5}$/i.test(v) &&
    /[-_]\d+$|[-_][a-z0-9]{4,}$/i.test(v)
  ) {
    return true
  }
  return false
}

/** Prefer enterprise label; never fall back to raw internal id in UI. */
export function safeEnterpriseLabel(
  preferred: string | null | undefined,
  fallbackLabel: string,
): string {
  const p = preferred?.trim()
  if (p && !looksLikeInternalId(p)) return p
  return fallbackLabel
}
