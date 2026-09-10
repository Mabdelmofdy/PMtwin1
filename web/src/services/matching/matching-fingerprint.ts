import {
  detectMatchingModel,
  estimateValueSar,
  parseRoleDefinitions,
  resolveNormalized,
  withMatchingDefaults,
  type CanonicalData,
  type MatchingConfig,
} from '@pm-twin/matching'
import type { Opportunity } from '@/types/domain.ts'
import { getMatchingEngineContext } from '@/infrastructure/matching/matching-engine-context.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'

export type MatchingFingerprintContext = {
  readonly canonical?: CanonicalData
  readonly config?: MatchingConfig
}

function sortStrings(values: readonly unknown[] | undefined): string[] {
  return [...(values ?? [])]
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)
    .sort((left, right) => left.localeCompare(right))
}

function asFiniteNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    const mapped = value.map(canonicalize)
    const asStrings = mapped.every(
      (entry) => entry == null || ['string', 'number', 'boolean'].includes(typeof entry),
    )
    if (asStrings) {
      return [...mapped]
        .map((entry) => (entry == null ? '' : String(entry)))
        .filter((entry) => entry.length > 0)
        .sort((left, right) => left.localeCompare(right))
    }
    return [...mapped].sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    )
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(record).sort()) {
      const entry = record[key]
      if (entry === undefined) continue
      out[key] = canonicalize(entry)
    }
    return out
  }
  return value ?? null
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function attributeString(
  attributes: Readonly<Record<string, unknown>> | undefined,
  key: string,
): string | undefined {
  const value = attributes?.[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Effective matching inputs the engine consumes after opportunityToPost +
 * resolveNormalized. Unordered skill/service/coverage arrays are canonicalized.
 */
export function collectMatchingFingerprintInputs(
  opportunity: Opportunity,
  context: MatchingFingerprintContext = {},
): Record<string, unknown> {
  const { canonical, config } = context.canonical || context.config
    ? {
        canonical: context.canonical ?? {},
        config: withMatchingDefaults(context.config),
      }
    : getMatchingEngineContext()

  const post = opportunityToPost(opportunity)
  const normalized = resolveNormalized(post, canonical, config)
  const attributes = post.attributes ?? {}
  const exchangeData = post.exchangeData ?? {}
  const roles = parseRoleDefinitions(attributes).map((role) => ({
    role: role.role,
    scope: role.scope ?? '',
  }))

  return {
    intent: post.intent ?? normalized.intent,
    role: normalized.role,
    requiredServices: sortStrings(normalized.requiredServices),
    offeredServices: sortStrings(normalized.offeredServices),
    coreSkills: sortStrings(normalized.coreSkills),
    skills: sortStrings(normalized.skills),
    categories: sortStrings(normalized.categories),
    modelType: post.modelType ?? normalized.modelType,
    subModelType: post.subModelType ?? normalized.subModelType,
    mainCollaborationModel: post.mainCollaborationModel,
    preferredMatchingTopology: post.preferredMatchingTopology,
    topologies: sortStrings(detectMatchingModel(post)),
    exchangeMode: post.exchangeMode ?? post.value_exchange?.mode,
    acceptedExchangeModes: sortStrings(
      post.value_exchange?.accepted_modes
        ?? (post.exchangeMode ? [post.exchangeMode] : []),
    ),
    estimatedValue: asFiniteNumber(post.value_exchange?.estimated_value),
    valueEstimate: estimateValueSar(post),
    barterValue: asFiniteNumber(exchangeData.barterValue),
    budget: {
      min: normalized.budget?.min,
      max: normalized.budget?.max,
      currency: normalized.budget?.currency,
    },
    timeline: {
      start: normalized.timeline?.start,
      end: normalized.timeline?.end,
      durationDays: normalized.timeline?.durationDays,
    },
    deadline: normalized.deadline,
    availability: {
      start: normalized.availability?.start,
      end: normalized.availability?.end,
    },
    location: normalized.location,
    locationCountry: normalized.locationCountry,
    coverageScopes: sortStrings(normalized.coverageScopes),
    locationRequirement: attributeString(attributes, 'locationRequirement'),
    workMode: attributeString(attributes, 'workMode'),
    memberRoles: roles,
  }
}

export function buildMatchingFingerprint(
  opportunity: Opportunity,
  context: MatchingFingerprintContext = {},
): string {
  return stableStringify(collectMatchingFingerprintInputs(opportunity, context))
}

export function hasMatchingInputChanged(
  before: Opportunity,
  after: Opportunity,
  context: MatchingFingerprintContext = {},
): boolean {
  return (
    buildMatchingFingerprint(before, context)
    !== buildMatchingFingerprint(after, context)
  )
}
