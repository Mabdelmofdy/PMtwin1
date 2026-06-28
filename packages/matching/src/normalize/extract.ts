import { withMatchingDefaults } from '../config/defaults.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { CreatorProfile } from '../types/creator.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'
import { extractBudget } from './budget.ts'
import { normalizeLocation } from './location.ts'
import { normalizeSkill, toSkillString } from './skill.ts'
import { extractTimeline } from './timeline.ts'

export interface ExtractNormalizeOptions {
  readonly config?: MatchingConfig
  readonly creator?: CreatorProfile | null
}

function extractRole(
  opportunity: OpportunityPost,
  scope: Readonly<Record<string, unknown>>,
  attributes: Readonly<Record<string, unknown>>,
  synonyms: CanonicalData['skillSynonyms'],
  config: MatchingConfig,
): string {
  const explicit = attributes.targetRole ?? attributes.professionalRole
  if (explicit) return normalizeSkill(toSkillString(explicit), synonyms)

  if (config.STRICT_ROLE_REQUIRED !== false) return ''

  const primary = (opportunity.intent === 'offer')
    ? (scope.offeredSkills as unknown[] | undefined)?.[0] ?? (attributes.offeredSkills as unknown[] | undefined)?.[0]
    : (scope.requiredSkills as unknown[] | undefined)?.[0] ?? (attributes.requiredSkills as unknown[] | undefined)?.[0]
  return primary ? normalizeSkill(toSkillString(primary), synonyms) : ''
}

function extractCoreSkills(
  scope: Readonly<Record<string, unknown>>,
  attributes: Readonly<Record<string, unknown>>,
  synonyms: CanonicalData['skillSynonyms'],
): string[] {
  const raw = [
    ...((scope.coreSkills as unknown[] | undefined) ?? []),
    ...((attributes.coreSkills as unknown[] | undefined) ?? []),
  ].filter(Boolean)
  return [...new Set(raw.map((skill) => normalizeSkill(toSkillString(skill), synonyms)))]
}

function resolveReputation(creator: CreatorProfile | null | undefined): number {
  if (!creator) return 0.5
  if (creator.profile?.rating != null || creator.rating != null) {
    const rating = Number(creator.profile?.rating ?? creator.rating)
    return Number.isNaN(rating) ? 0.5 : Math.max(0, Math.min(1, rating))
  }
  if (creator.profile?.completedProjects != null) {
    const completed = Number(creator.profile.completedProjects)
    return Number.isNaN(completed) ? 0.5 : Math.min(1, 0.3 + Math.min(completed, 20) / 100)
  }
  return 0.5
}

export function extractAndNormalize(
  opportunity: OpportunityPost,
  canonical: CanonicalData = {},
  options: ExtractNormalizeOptions = {},
): NormalizedPost {
  const config = withMatchingDefaults(options.config)
  const synonyms = canonical.skillSynonyms ?? {}
  const locationCanonical = canonical.locationCanonical ?? {}
  const scope = opportunity.scope ?? {}
  const attributes = opportunity.attributes ?? {}

  const requiredRaw = [
    ...((scope.requiredSkills as unknown[] | undefined) ?? []),
    ...((attributes.requiredSkills as unknown[] | undefined) ?? []),
  ].filter(Boolean)
  const offeredRaw = [
    ...((scope.offeredSkills as unknown[] | undefined) ?? []),
    ...((attributes.offeredSkills as unknown[] | undefined) ?? []),
  ].filter(Boolean)

  const requiredServices = [...new Set(requiredRaw.map((skill) => normalizeSkill(toSkillString(skill), synonyms)))]
  const offeredServices = [...new Set(offeredRaw.map((skill) => normalizeSkill(toSkillString(skill), synonyms)))]
  const role = extractRole(opportunity, scope, attributes, synonyms, config)
  const coreSkills = extractCoreSkills(scope, attributes, synonyms)
  const skills = [...new Set([...requiredServices, ...offeredServices])]

  const categories = [
    ...(opportunity.modelType ? [opportunity.modelType] : []),
    ...(opportunity.subModelType ? [opportunity.subModelType] : []),
    ...((scope.sectors as string[] | undefined) ?? []),
  ].filter(Boolean)

  const budget = extractBudget(opportunity)
  const timeline = extractTimeline(opportunity)
  const deadline = timeline.end
    ?? (opportunity.intent === 'request'
      ? (attributes.tenderDeadline as string | undefined) ?? (attributes.applicationDeadline as string | undefined)
      : undefined)
  const availability = timeline.start && timeline.end
    ? { start: timeline.start, end: timeline.end }
    : (attributes.availability as NormalizedPost['availability'] | undefined)

  return {
    skills,
    requiredServices,
    offeredServices,
    role,
    coreSkills,
    categories,
    budget,
    timeline,
    deadline: deadline ?? undefined,
    availability: availability ?? undefined,
    location: normalizeLocation(opportunity, locationCanonical),
    reputation: resolveReputation(options.creator),
    intent: opportunity.intent ?? 'request',
    modelType: opportunity.modelType,
    subModelType: opportunity.subModelType,
  }
}
