import { LEGACY_FIELD_MAP } from '@/domain/normalized/legacy-field-map.ts'
import type { NormalizedCommercialTerms, NormalizedParticipant } from '@/domain/normalized/types.ts'
import {
  commercialTermsFromApplicationValue,
  commercialTermsFromLegacyTerms,
  commercialTermsFromValueTerms,
} from '@/types/commercial-terms.ts'

/** Accept any legacy POC/seed object without mutating it. */
export type LegacyRaw = Record<string, unknown>

export function asLegacyRaw(raw: unknown): LegacyRaw {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as LegacyRaw
  }
  return {}
}

export function pickFirst<T>(
  raw: LegacyRaw,
  keys: readonly string[],
): T | undefined {
  for (const key of keys) {
    const value = raw[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

export function pickString(raw: LegacyRaw, keys: readonly string[]): string {
  const value = pickFirst<unknown>(raw, keys)
  return value != null ? String(value) : ''
}

export function pickOptionalString(
  raw: LegacyRaw,
  keys: readonly string[],
): string | undefined {
  const value = pickFirst<unknown>(raw, keys)
  if (value == null || value === '') return undefined
  return String(value)
}

export function pickTimestamp(
  raw: LegacyRaw,
  kind: 'createdAt' | 'updatedAt' | 'auditCreatedAt',
): string {
  const keys =
    kind === 'auditCreatedAt'
      ? LEGACY_FIELD_MAP.timestamps.auditCreatedAt
      : kind === 'createdAt'
        ? LEGACY_FIELD_MAP.timestamps.createdAt
        : LEGACY_FIELD_MAP.timestamps.updatedAt
  return pickString(raw, keys)
}

export function pickTenantFields(raw: LegacyRaw): {
  tenantId?: string
  organizationId?: string
} {
  return {
    tenantId: pickOptionalString(raw, LEGACY_FIELD_MAP.tenantId),
    organizationId: pickOptionalString(raw, LEGACY_FIELD_MAP.organizationId),
  }
}

export function pickMatchId(raw: LegacyRaw): string | undefined {
  return pickOptionalString(raw, LEGACY_FIELD_MAP.matchId)
}

export function pickParticipants(raw: LegacyRaw): NormalizedParticipant[] {
  const list = pickFirst<unknown>(raw, LEGACY_FIELD_MAP.participants)
  if (!Array.isArray(list)) return []
  return list
    .filter(
      (item): item is LegacyRaw =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    )
    .map((p) => ({
      userId: pickString(p, ['userId']),
      role: pickString(p, ['role']) || 'participant',
      opportunityId: pickOptionalString(p, ['opportunityId']),
      participantStatus: pickOptionalString(p, ['participantStatus']),
      approvalStatus: pickOptionalString(p, ['approvalStatus']),
      respondedAt:
        (pickFirst<string | null>(p, ['respondedAt']) as string | null | undefined) ??
        undefined,
      signedAt:
        (pickFirst<string | null>(p, ['signedAt']) as string | null | undefined) ??
        undefined,
    }))
    .filter((p) => p.userId.length > 0)
}

export function resolveCommercialTerms(
  raw: LegacyRaw,
): NormalizedCommercialTerms | undefined {
  const direct = pickFirst<NormalizedCommercialTerms>(raw, ['commercialTerms'])
  if (direct && typeof direct === 'object') {
    return { ...direct }
  }

  for (const key of LEGACY_FIELD_MAP.commercialTerms) {
    if (key === 'commercialTerms') continue
    const legacy = raw[key]
    if (legacy == null) continue

    if (key === 'application_value') {
      const fromApp = commercialTermsFromApplicationValue(
        legacy as Parameters<typeof commercialTermsFromApplicationValue>[0],
      )
      if (fromApp) return fromApp
      continue
    }

    if (key === 'valueTerms') {
      const fromValue = commercialTermsFromValueTerms(
        legacy as Record<string, unknown>,
      )
      if (fromValue) return fromValue
      continue
    }

    if (typeof legacy === 'object') {
      const fromLegacy = commercialTermsFromLegacyTerms(
        legacy as Parameters<typeof commercialTermsFromLegacyTerms>[0],
      )
      if (fromLegacy) return fromLegacy
    }
  }

  const agreedValue = raw.agreedValue
  if (agreedValue != null || raw.paymentSchedule || raw.duration) {
    return {
      amount:
        agreedValue != null ? Number(agreedValue) : undefined,
      currency: pickOptionalString(raw, ['currency']) ?? 'SAR',
      duration: pickOptionalString(raw, ['duration']),
      paymentSchedule: pickOptionalString(raw, ['paymentSchedule']),
      profitSplit: pickFirst<string | number>(raw, ['profitShare', 'profitSplit']),
    }
  }

  return undefined
}

export function canonicalizeNegotiationStatus(status: string): string {
  const lower = (status || '').toLowerCase()
  const map = LEGACY_FIELD_MAP.statusCanonical.negotiation as Record<
    string,
    string
  >
  if (map[lower]) return map[lower]
  if (lower === 'countered' || lower === 'counter_offered') {
    return 'counter_offered'
  }
  return status || 'active'
}

export function canonicalizeEntityType(entityType?: string): string | undefined {
  if (!entityType) return undefined
  const lower = entityType.toLowerCase()
  if (
    (LEGACY_FIELD_MAP.matchEntityType as readonly string[]).includes(lower) ||
    lower === 'postmatch'
  ) {
    return 'match'
  }
  return entityType
}
