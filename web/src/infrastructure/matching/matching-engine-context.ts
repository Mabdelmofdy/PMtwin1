import type { CanonicalData, MatchingConfig } from '@pm-twin/matching'
import { EMPTY_CANONICAL_DATA, withMatchingDefaults } from '@pm-twin/matching'
import skillCanonicalJson from '@seed-data/skill-canonical.json'
import { getMatchingConfigFromSettings } from '@/domain/admin/settings/effective-settings.ts'

type SkillCanonicalJson = {
  readonly skillSynonyms?: CanonicalData['skillSynonyms']
  readonly locationCanonical?: CanonicalData['locationCanonical']
  readonly categoryExpansion?: CanonicalData['categoryExpansion']
  readonly semanticTerms?: CanonicalData['semanticTerms']
}

const skillCanonical = skillCanonicalJson as SkillCanonicalJson

export type MatchingEngineContext = {
  readonly canonical: CanonicalData
  readonly config: MatchingConfig
}

let cachedContext: MatchingEngineContext | null = null

export function loadMatchingCanonicalData(): CanonicalData {
  return {
    skillSynonyms: skillCanonical.skillSynonyms ?? EMPTY_CANONICAL_DATA.skillSynonyms,
    locationCanonical:
      skillCanonical.locationCanonical ?? EMPTY_CANONICAL_DATA.locationCanonical,
    categoryExpansion:
      skillCanonical.categoryExpansion ?? EMPTY_CANONICAL_DATA.categoryExpansion,
    semanticTerms: skillCanonical.semanticTerms ?? EMPTY_CANONICAL_DATA.semanticTerms,
  }
}

export function getMatchingEngineContext(
  configOverride?: Partial<MatchingConfig>,
): MatchingEngineContext {
  const settingsConfig = getMatchingConfigFromSettings()
  const mergedOverride: Partial<MatchingConfig> = {
    ...settingsConfig,
    ...configOverride,
  }

  if (!configOverride && cachedContext) {
    return cachedContext
  }

  const context: MatchingEngineContext = {
    canonical: loadMatchingCanonicalData(),
    config: withMatchingDefaults(mergedOverride),
  }

  if (!configOverride) {
    cachedContext = context
  }

  return context
}

/** Reset cached canonical/config singleton (tests + settings mutations). */
export function resetMatchingEngineContextCacheForTests(): void {
  cachedContext = null
}
