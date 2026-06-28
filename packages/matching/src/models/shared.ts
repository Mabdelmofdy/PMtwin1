import { withMatchingDefaults } from '../config/defaults.ts'
import { passesPair } from '../constraints/hard-constraints.ts'
import { extractAndNormalize } from '../normalize/extract.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'

export function resolveThreshold(config: MatchingConfig): number {
  return config.POST_TO_POST_THRESHOLD ?? 0.50
}

export function resolveMaxCandidates(config: MatchingConfig, override?: number): number {
  return override ?? config.CANDIDATE_MAX ?? 200
}

export function resolveNormalized(
  opportunity: OpportunityPost,
  canonical: CanonicalData,
  config: MatchingConfig,
): NormalizedPost {
  return opportunity.normalized ?? extractAndNormalize(opportunity, canonical, { config })
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
  const role = roleDef.role
  const scopeWords = (roleDef.scope ?? '')
    .split(/[\s,/|&+-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
  return [role, ...scopeWords]
    .filter((value, index, array) => value && array.indexOf(value) === index)
    .slice(0, 10)
}

export function buildSyntheticNeedForRole(
  leadNeed: OpportunityPost,
  leadNorm: NormalizedPost,
  roleDef: RoleDefinition,
): OpportunityPost {
  const role = roleDef.role
  const roleServices = buildRoleServices(roleDef)
  return {
    ...leadNeed,
    id: `${leadNeed.id ?? 'need'}-role-${role.replace(/\s/g, '_')}`,
    attributes: { ...(leadNeed.attributes ?? {}), targetRole: role },
    scope: { ...(leadNeed.scope ?? {}), requiredSkills: roleServices },
    normalized: {
      ...leadNorm,
      role,
      requiredServices: roleServices,
      skills: roleServices,
    },
  }
}
