import {
  PROFILE_FIT_SNAPSHOT_KIND,
  scoreProfileFit,
  type ProfileFitScore,
  type ProfileFitSnapshot,
  type ProfileFitWorkMode,
} from '@pm-twin/matching'
import {
  normalizeLegacyProfile,
  toMatchingProfileSnapshot,
} from '@pm-twin/profile'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'
import type { UserSettingsDocument } from '@/domain/user-settings/types.ts'

/** Shadow score is visible for explainability but does not reorder automatic PostMatch runs. */
export const ENABLE_PROFILE_FIT_MATCH_WEIGHTING = false
export const ENABLE_PROFILE_FIT_RECOMMENDATIONS = true

export type ProfileOpportunityRecommendation = {
  readonly opportunity: Opportunity
  readonly score: number
  readonly explanation: ProfileFitScore
}

function workModes(
  values: readonly string[],
): readonly ProfileFitWorkMode[] {
  return values.flatMap((value): ProfileFitWorkMode[] => {
    const normalized = value.toLowerCase().replace(/[-_\s]/g, '')
    if (normalized === 'remote') return ['remote']
    if (normalized === 'hybrid') return ['hybrid']
    if (normalized === 'onsite' || normalized === 'office') return ['onsite']
    return []
  })
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort()
}

export function buildProfileFitSnapshot(
  account: PlatformUser,
): ProfileFitSnapshot {
  const canonical =
    account.profile?.canonical ??
    normalizeLegacyProfile({ ...account, profile: account.profile }).profile
  const snapshot = toMatchingProfileSnapshot(canonical)
  const legacy = account.profile
  const preferredGeography = snapshot.matchingPreferences.preferredLocations
  const location = preferredGeography[0]
  const availableFrom = canonical.availability.availableFrom
  return {
    kind: PROFILE_FIT_SNAPSHOT_KIND,
    capabilities: unique([
      ...snapshot.skillTags,
      ...(legacy?.skills ?? []),
    ]),
    services: unique([
      ...snapshot.serviceCategories,
      ...(legacy?.services ?? []),
    ]),
    sectors: unique([
      ...snapshot.sectors,
      ...(legacy?.sectors ?? []),
    ]),
    geography: {
      countries: [
        ...new Set(
          preferredGeography
            .map((entry) => entry.countryCode)
            .concat(snapshot.locationCountryCode ?? [])
            .filter(Boolean),
        ),
      ],
      regions: [
        ...new Set(
          preferredGeography
            .flatMap((entry) => entry.region ? [entry.region] : [])
            .concat(snapshot.locationRegion ?? []),
        ),
      ],
      cities: location?.city ? [location.city] : [],
    },
    workModes: workModes([
      ...snapshot.engagementModes,
      ...snapshot.matchingPreferences.engagementModes,
      ...(legacy?.preferredWorkMode ? [legacy.preferredWorkMode] : []),
    ]),
    availability:
      canonical.availability.status === 'unavailable' || !availableFrom
        ? null
        : { start: availableFrom, end: '2099-12-31' },
    verifiedCredentials: unique([
      ...snapshot.credentialTypes,
      ...(legacy?.certifications ?? []),
    ]),
    counterpartPreference: {
      capabilities: snapshot.matchingPreferences.skillTags,
      services: snapshot.matchingPreferences.serviceCategories,
      sectors: snapshot.matchingPreferences.sectors,
      geography: {
        countries: preferredGeography.map((entry) => entry.countryCode),
        regions: preferredGeography.flatMap((entry) =>
          entry.region ? [entry.region] : [],
        ),
        cities: preferredGeography.flatMap((entry) =>
          entry.city ? [entry.city] : [],
        ),
      },
      workModes: workModes(snapshot.matchingPreferences.engagementModes),
      verifiedCredentials: [],
    },
  }
}

export function scoreProfileOpportunityFit(
  account: PlatformUser,
  opportunity: Opportunity,
): ProfileFitScore {
  return scoreProfileFit(
    buildProfileFitSnapshot(account),
    opportunityToPost(opportunity),
  )
}

export function listProfileOpportunityRecommendations(input: {
  readonly account: PlatformUser
  readonly opportunities: readonly Opportunity[]
  readonly settings: UserSettingsDocument
  readonly limit?: number
}): readonly ProfileOpportunityRecommendation[] {
  if (
    !ENABLE_PROFILE_FIT_RECOMMENDATIONS ||
    !input.settings.matching.participateInMatching ||
    !input.settings.matching.receiveRecommendations
  ) {
    return []
  }
  return input.opportunities
    .filter((opportunity) => opportunity.status === 'published')
    .map((opportunity) => {
      const explanation = scoreProfileOpportunityFit(input.account, opportunity)
      return { opportunity, score: explanation.score, explanation }
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.opportunity.id.localeCompare(right.opportunity.id),
    )
    .slice(0, input.limit ?? 5)
}
