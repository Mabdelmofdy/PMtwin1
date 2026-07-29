import { withMatchingDefaults } from '../config/defaults.ts'
import { passesPair } from '../constraints/hard-constraints.ts'
import { extractAndNormalize } from '../normalize/extract.ts'
import { extractCoverageScopes } from '../normalize/location-coverage.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'

export function resolveThreshold(config: MatchingConfig): number {
  return config.POST_TO_POST_THRESHOLD ?? 0.50
}

export function resolveMaxCandidates(config: MatchingConfig, override?: number): number {
  return override ?? config.CANDIDATE_MAX ?? 200
}

/**
 * Prefer persisted normalized, but backfill location/coverage when the wizard
 * wrote role+skills without location (top-level opportunity.location still set).
 */
export function resolveNormalized(
  opportunity: OpportunityPost,
  canonical: CanonicalData,
  config: MatchingConfig,
): NormalizedPost {
  if (!opportunity.normalized) {
    return extractAndNormalize(opportunity, canonical, { config })
  }

  const existing = opportunity.normalized
  if (existing.location) {
    if ((existing.coverageScopes?.length ?? 0) > 0) return existing
    const scopes = extractCoverageScopes(opportunity.attributes)
    return scopes.length > 0 ? { ...existing, coverageScopes: scopes } : existing
  }

  const extracted = extractAndNormalize(
    { ...opportunity, normalized: undefined },
    canonical,
    { config },
  )
  return {
    ...existing,
    location: extracted.location,
    locationCountry: existing.locationCountry || extracted.locationCountry,
    coverageScopes:
      (existing.coverageScopes?.length
        ? existing.coverageScopes
        : extracted.coverageScopes) ?? [],
  }
}

export function passHardGate(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
  config: MatchingConfig,
): boolean {
  return passesPair(needPost, offerPost, config, { needNorm, offerNorm }).ok
}

export function withRunnerConfig(config?: MatchingConfig): MatchingConfig {
  return withMatchingDefaults(config)
}

export interface RoleDefinition {
  readonly role: string
  readonly scope?: string
}

export function parseRoleDefinitions(
  attributes: Readonly<Record<string, unknown>> | undefined,
): RoleDefinition[] {
  const memberRoles = attributes?.memberRoles ?? attributes?.partnerRoles
  if (!Array.isArray(memberRoles)) return []
  return memberRoles
    .map((entry) => {
      if (typeof entry === 'string') return { role: entry }
      if (entry && typeof entry === 'object') {
        const record = entry as { role?: string; label?: string; scope?: string }
        const role = record.role ?? record.label
        return role ? { role, scope: record.scope } : null
      }
      return null
    })
    .filter((entry): entry is RoleDefinition => Boolean(entry?.role))
}

export function buildRoleServices(roleDef: RoleDefinition): string[] {
  const scope = roleDef.scope?.trim() ?? ''
  if (!scope) return []

  // Prefer comma/semicolon phrases over word-splitting prose into hard requirements.
  // Keep short skill-like phrases (≤ 3 words). Long descriptive clauses are ignored.
  const stop = new Set([
    'and',
    'the',
    'for',
    'with',
    'from',
    'into',
    'across',
    'including',
  ])
  return scope
    .split(/[,;|]/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => {
      const words = phrase.split(/\s+/).filter(Boolean)
      if (words.length === 0 || words.length > 3) return false
      return words.every((word) => !stop.has(word.toLowerCase()))
    })
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 10)
}

/**
 * Soft skill hints for consortium role scoring (not hard requiredServices).
 * Extracts technical tokens / short phrases from role scope prose.
 */
export function buildRoleSkillHints(roleDef: RoleDefinition): string[] {
  const fromPhrases = buildRoleServices(roleDef)
  const scope = roleDef.scope?.trim() ?? ''
  if (!scope) return fromPhrases

  const techTokens = scope
    .split(/[\s,/|&+;-]+/)
    .map((word) => word.trim())
    .filter((word) => {
      if (word.length < 2) return false
      // Acronyms / product codes (BIM, SAP2000) or Capitalized tokens
      return /^[A-Z]{2,}[0-9]*$/.test(word) || /^[A-Z][a-zA-Z0-9+]{2,}$/.test(word)
    })

  return [...fromPhrases, ...techTokens]
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 10)
}

export function buildSyntheticNeedForRole(
  leadNeed: OpportunityPost,
  leadNorm: NormalizedPost,
  roleDef: RoleDefinition,
): OpportunityPost {
  const role = roleDef.role
  const skillHints = buildRoleSkillHints(roleDef)
  return {
    ...leadNeed,
    id: `${leadNeed.id ?? 'need'}-role-${role.replace(/\s/g, '_')}`,
    attributes: { ...(leadNeed.attributes ?? {}), targetRole: role },
    scope: {
      ...(leadNeed.scope ?? {}),
      requiredSkills: skillHints,
      coreSkills: [],
    },
    normalized: {
      ...leadNorm,
      role,
      // Role slots must not inherit the lead Need's mandatory coreSkills
      // (e.g. BIM/Revit on an Architect+Structural consortium lead).
      coreSkills: [],
      // Do not hard-gate on tokenized scope prose; role compatibility + scoring suffice.
      requiredServices: [],
      skills: skillHints.length > 0 ? skillHints : [role],
      // Do not inherit lead JV/consortium categories — partner offers are often
      // cash/task_based and would fail categoryOverlap otherwise.
      modelType: undefined,
      subModelType: undefined,
      categories: [],
    },
  }
}
