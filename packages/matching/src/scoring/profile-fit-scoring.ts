import {
  PROFILE_FIT_SNAPSHOT_KIND,
  type ProfileFitAvailability,
  type ProfileFitCounterpartPreference,
  type ProfileFitFactorExplanation,
  type ProfileFitFactorName,
  type ProfileFitGeography,
  type ProfileFitScore,
  type ProfileFitSnapshot,
  type ProfileFitTarget,
  type ProfileFitWorkMode,
} from '../types/profile-fit.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

const FACTOR_WEIGHTS: Readonly<Record<ProfileFitFactorName, number>> = {
  capabilities: 0.20,
  services: 0.20,
  sectors: 0.12,
  geography: 0.12,
  workMode: 0.10,
  availability: 0.10,
  verifiedCredentials: 0.08,
  counterpartPreference: 0.08,
}

const SNAPSHOT_KEYS = [
  'kind',
  'capabilities',
  'services',
  'sectors',
  'geography',
  'workModes',
  'availability',
  'verifiedCredentials',
  'counterpartPreference',
] as const
const GEOGRAPHY_KEYS = ['countries', 'regions', 'cities'] as const
const PREFERENCE_KEYS = [
  'capabilities',
  'services',
  'sectors',
  'geography',
  'workModes',
  'verifiedCredentials',
] as const
const AVAILABILITY_KEYS = ['start', 'end'] as const
const WORK_MODES: readonly ProfileFitWorkMode[] = ['remote', 'hybrid', 'onsite']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

interface TargetCriteria {
  readonly capabilities: readonly string[]
  readonly services: readonly string[]
  readonly sectors: readonly string[]
  readonly geography: ProfileFitGeography
  readonly workModes: readonly ProfileFitWorkMode[]
  readonly availability: Partial<ProfileFitAvailability> | null
  readonly verifiedCredentials: readonly string[]
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && value.every((item) => typeof item === 'string' && item.trim().length > 0)
}

function isGeography(value: unknown): value is ProfileFitGeography {
  return isRecord(value)
    && hasExactKeys(value, GEOGRAPHY_KEYS)
    && isStringArray(value.countries)
    && isStringArray(value.regions)
    && isStringArray(value.cities)
}

function isWorkModes(value: unknown): value is readonly ProfileFitWorkMode[] {
  return Array.isArray(value)
    && value.every((item) => WORK_MODES.includes(item as ProfileFitWorkMode))
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isAvailability(value: unknown): value is ProfileFitAvailability | null {
  return value === null
    || (
      isRecord(value)
      && hasExactKeys(value, AVAILABILITY_KEYS)
      && isIsoDate(value.start)
      && isIsoDate(value.end)
      && value.start <= value.end
    )
}

function isCounterpartPreference(value: unknown): value is ProfileFitCounterpartPreference {
  return isRecord(value)
    && hasExactKeys(value, PREFERENCE_KEYS)
    && isStringArray(value.capabilities)
    && isStringArray(value.services)
    && isStringArray(value.sectors)
    && isGeography(value.geography)
    && isWorkModes(value.workModes)
    && isStringArray(value.verifiedCredentials)
}

/**
 * Runtime boundary guard for the closed snapshot schema. Unknown fields are
 * rejected at every object level so PII-bearing properties cannot hitchhike.
 */
export function isProfileFitSnapshot(value: unknown): value is ProfileFitSnapshot {
  return isRecord(value)
    && hasExactKeys(value, SNAPSHOT_KEYS)
    && value.kind === PROFILE_FIT_SNAPSHOT_KIND
    && isStringArray(value.capabilities)
    && isStringArray(value.services)
    && isStringArray(value.sectors)
    && isGeography(value.geography)
    && isWorkModes(value.workModes)
    && isAvailability(value.availability)
    && isStringArray(value.verifiedCredentials)
    && isCounterpartPreference(value.counterpartPreference)
}

function normalized(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLocaleLowerCase('en-US')))].sort()
}

function valuesFrom(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
}

function mergeValues(...groups: readonly (readonly string[])[]): string[] {
  return normalized(groups.flat())
}

function geographyValues(geography: ProfileFitGeography): string[] {
  return mergeValues(geography.countries, geography.regions, geography.cities)
}

function opportunityWorkModes(opportunity: OpportunityPost): ProfileFitWorkMode[] {
  const raw = [
    ...valuesFrom(opportunity.attributes?.workMode),
    ...valuesFrom(opportunity.attributes?.workModes),
  ]
  if (
    opportunity.normalized?.location?.toLocaleLowerCase('en-US') === 'remote'
    || opportunity.location?.toLocaleLowerCase('en-US') === 'remote'
  ) {
    raw.push('remote')
  }

  const modes = raw.flatMap((value): ProfileFitWorkMode[] => {
    const mode = value.trim().toLocaleLowerCase('en-US').replace(/[-_\s]/g, '')
    if (mode === 'remote') return ['remote']
    if (mode === 'hybrid') return ['hybrid']
    if (mode === 'onsite' || mode === 'office') return ['onsite']
    return []
  })
  return [...new Set(modes)].sort()
}

function opportunityGeography(opportunity: OpportunityPost): ProfileFitGeography {
  return {
    countries: mergeValues(
      valuesFrom(opportunity.locationCountry),
      valuesFrom(opportunity.attributes?.locationCountry),
      valuesFrom(opportunity.attributes?.country),
    ),
    regions: mergeValues(
      valuesFrom(opportunity.locationRegion),
      valuesFrom(opportunity.attributes?.locationRegion),
      valuesFrom(opportunity.attributes?.region),
    ),
    cities: mergeValues(
      valuesFrom(opportunity.locationCity),
      valuesFrom(opportunity.location),
      valuesFrom(opportunity.normalized?.location),
      valuesFrom(opportunity.attributes?.locationRequirement),
      valuesFrom(opportunity.attributes?.city),
    ).filter((value) => value !== 'remote'),
  }
}

function opportunityCriteria(opportunity: OpportunityPost): TargetCriteria {
  const scope = opportunity.scope ?? {}
  const attributes = opportunity.attributes ?? {}
  const normalizedPost = opportunity.normalized ?? {}
  const availability = normalizedPost.timeline ?? normalizedPost.availability

  return {
    capabilities: mergeValues(
      normalizedPost.coreSkills ?? [],
      valuesFrom(scope.requiredCapabilities),
      valuesFrom(attributes.requiredCapabilities),
      valuesFrom(attributes.coreSkills),
    ),
    services: mergeValues(
      normalizedPost.requiredServices ?? [],
      valuesFrom(scope.requiredSkills),
      valuesFrom(scope.requiredServices),
      valuesFrom(attributes.requiredSkills),
      valuesFrom(attributes.requiredServices),
    ),
    sectors: mergeValues(
      normalizedPost.categories ?? [],
      valuesFrom(scope.sectors),
      valuesFrom(attributes.sectors),
      valuesFrom(attributes.sector),
    ),
    geography: opportunityGeography(opportunity),
    workModes: opportunityWorkModes(opportunity),
    availability: availability
      ? { start: availability.start, end: availability.end }
      : null,
    verifiedCredentials: mergeValues(
      valuesFrom(scope.requiredCredentials),
      valuesFrom(attributes.requiredCredentials),
      valuesFrom(attributes.verifiedCredentials),
    ),
  }
}

function profileCriteria(profile: ProfileFitSnapshot): TargetCriteria {
  const preference = profile.counterpartPreference
  const preferredGeography = geographyValues(preference.geography).length
    ? preference.geography
    : profile.geography

  return {
    capabilities: preference.capabilities.length ? preference.capabilities : profile.capabilities,
    services: preference.services.length ? preference.services : profile.services,
    sectors: preference.sectors.length ? preference.sectors : profile.sectors,
    geography: preferredGeography,
    workModes: preference.workModes.length ? preference.workModes : profile.workModes,
    availability: profile.availability,
    verifiedCredentials: preference.verifiedCredentials.length
      ? preference.verifiedCredentials
      : profile.verifiedCredentials,
  }
}

function profileTraits(profile: ProfileFitSnapshot): TargetCriteria {
  return {
    capabilities: profile.capabilities,
    services: profile.services,
    sectors: profile.sectors,
    geography: profile.geography,
    workModes: profile.workModes,
    availability: profile.availability,
    verifiedCredentials: profile.verifiedCredentials,
  }
}

function coverage(
  factor: ProfileFitFactorName,
  offered: readonly string[],
  required: readonly string[],
  explanation: string,
): ProfileFitFactorExplanation {
  const offeredSet = new Set(normalized(offered))
  const requiredValues = normalized(required)
  const matched = requiredValues.filter((value) => offeredSet.has(value))
  const missing = requiredValues.filter((value) => !offeredSet.has(value))
  const applicable = requiredValues.length > 0
  return {
    factor,
    score: applicable ? matched.length / requiredValues.length : 1,
    weight: FACTOR_WEIGHTS[factor],
    applicable,
    matched,
    missing,
    explanation: applicable
      ? `${explanation}: ${matched.length} of ${requiredValues.length} criteria matched.`
      : `${explanation}: no target criterion supplied; excluded from the total.`,
  }
}

function availabilityFactor(
  offered: ProfileFitAvailability | null,
  required: Partial<ProfileFitAvailability> | null,
): ProfileFitFactorExplanation {
  const applicable = Boolean(required?.start || required?.end)
  if (!applicable) {
    return {
      factor: 'availability',
      score: 1,
      weight: FACTOR_WEIGHTS.availability,
      applicable: false,
      matched: [],
      missing: [],
      explanation: 'Availability: no target date criterion supplied; excluded from the total.',
    }
  }
  if (!offered) {
    return {
      factor: 'availability',
      score: 0,
      weight: FACTOR_WEIGHTS.availability,
      applicable: true,
      matched: [],
      missing: ['availability'],
      explanation: 'Availability: the profile supplied no availability window.',
    }
  }

  const offeredStart = Date.parse(`${offered.start}T00:00:00.000Z`)
  const offeredEnd = Date.parse(`${offered.end}T00:00:00.000Z`)
  const requiredStart = required?.start
    ? Date.parse(`${required.start}T00:00:00.000Z`)
    : Number.NEGATIVE_INFINITY
  const requiredEnd = required?.end
    ? Date.parse(`${required.end}T00:00:00.000Z`)
    : Number.POSITIVE_INFINITY
  const overlaps = offeredStart <= requiredEnd && offeredEnd >= requiredStart
  let score = overlaps ? 1 : 0

  if (
    overlaps
    && Number.isFinite(requiredStart)
    && Number.isFinite(requiredEnd)
    && requiredEnd > requiredStart
  ) {
    const overlap = Math.max(
      0,
      Math.min(offeredEnd, requiredEnd) - Math.max(offeredStart, requiredStart),
    )
    score = overlap / (requiredEnd - requiredStart)
  }

  return {
    factor: 'availability',
    score,
    weight: FACTOR_WEIGHTS.availability,
    applicable: true,
    matched: overlaps ? ['availability'] : [],
    missing: overlaps ? [] : ['availability'],
    explanation: overlaps
      ? `Availability: windows overlap with ${Math.round(score * 100)}% target coverage.`
      : 'Availability: windows do not overlap.',
  }
}

function preferenceFactor(
  preference: ProfileFitCounterpartPreference,
  target: TargetCriteria,
): ProfileFitFactorExplanation {
  const comparisons = [
    [preference.capabilities, target.capabilities],
    [preference.services, target.services],
    [preference.sectors, target.sectors],
    [geographyValues(preference.geography), geographyValues(target.geography)],
    [preference.workModes, target.workModes],
    [preference.verifiedCredentials, target.verifiedCredentials],
  ] as const
  const requirements = comparisons.flatMap(([required]) => normalized(required))
  const matched: string[] = []
  const missing: string[] = []

  for (const [required, offered] of comparisons) {
    const offeredSet = new Set(normalized(offered))
    for (const value of normalized(required)) {
      if (offeredSet.has(value)) matched.push(value)
      else missing.push(value)
    }
  }

  const applicable = requirements.length > 0
  return {
    factor: 'counterpartPreference',
    score: applicable ? matched.length / requirements.length : 1,
    weight: FACTOR_WEIGHTS.counterpartPreference,
    applicable,
    matched: [...new Set(matched)].sort(),
    missing: [...new Set(missing)].sort(),
    explanation: applicable
      ? `Counterpart preference: ${matched.length} of ${requirements.length} preferences matched.`
      : 'Counterpart preference: no preference supplied; excluded from the total.',
  }
}

/**
 * Scores a non-PII profile projection against an opportunity or another
 * projection. The operation is deterministic, directional, and has no I/O.
 */
export function scoreProfileFit(
  profile: ProfileFitSnapshot,
  target: ProfileFitTarget,
): ProfileFitScore {
  if (!isProfileFitSnapshot(profile)) {
    throw new TypeError('Invalid ProfileFitSnapshot: exact non-PII schema required')
  }

  const hasSnapshotKind = isRecord(target) && target.kind === PROFILE_FIT_SNAPSHOT_KIND
  if (hasSnapshotKind && !isProfileFitSnapshot(target)) {
    throw new TypeError('Invalid target ProfileFitSnapshot: exact non-PII schema required')
  }
  const targetProfile = isProfileFitSnapshot(target) ? target : null

  const criteria = targetProfile
    ? profileCriteria(targetProfile)
    : opportunityCriteria(target as OpportunityPost)
  const counterpartTraits = targetProfile ? profileTraits(targetProfile) : criteria
  const factors: ProfileFitFactorExplanation[] = [
    coverage('capabilities', profile.capabilities, criteria.capabilities, 'Capabilities'),
    coverage('services', profile.services, criteria.services, 'Services'),
    coverage('sectors', profile.sectors, criteria.sectors, 'Sectors'),
    coverage(
      'geography',
      geographyValues(profile.geography),
      geographyValues(criteria.geography),
      'Geography',
    ),
    coverage('workMode', profile.workModes, criteria.workModes, 'Work mode'),
    availabilityFactor(profile.availability, criteria.availability),
    coverage(
      'verifiedCredentials',
      profile.verifiedCredentials,
      criteria.verifiedCredentials,
      'Verified credentials',
    ),
    preferenceFactor(profile.counterpartPreference, counterpartTraits),
  ]

  const applicable = factors.filter((factor) => factor.applicable)
  const denominator = applicable.reduce((sum, factor) => sum + factor.weight, 0)
  const rawScore = denominator === 0
    ? 0
    : applicable.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / denominator
  const score = Math.max(0, Math.min(1, Math.round(rawScore * 1000) / 1000))

  return {
    score,
    targetType: targetProfile ? 'profile' : 'opportunity',
    factors,
  }
}
