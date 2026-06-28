import type { CanonicalData, MatchingConfig } from '@pm-twin/matching'
import { EMPTY_CANONICAL_DATA, withMatchingDefaults } from '@pm-twin/matching'
import skillCanonicalJson from '@seed-data/skill-canonical.json'

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
  if (!configOverride && cachedContext) {
    return cachedContext
  }

  const context: MatchingEngineContext = {
    canonical: loadMatchingCanonicalData(),
    config: withMatchingDefaults(configOverride),
  }

  if (!configOverride) {
    cachedContext = context
  }

  return context
}

/** Test hook — reset cached canonical/config singleton. */
export function resetMatchingEngineContextCacheForTests(): void {
  cachedContext = null
}
