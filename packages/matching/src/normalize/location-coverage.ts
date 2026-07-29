/**
 * Location coverage hierarchy for soft locationFit scoring.
 * Primary city is a preference; nationwide / regional / coverage overlap lifts fit.
 */

export type LocationCountryCode =
  | 'SA'
  | 'AE'
  | 'QA'
  | 'KW'
  | 'BH'
  | 'OM'
  | 'EG'
  | 'REMOTE'
  | 'GCC'
  | 'MENA'
  | 'GLOBAL'
  | 'UNKNOWN'

export type LocationCoverageTier =
  | 'remote'
  | 'nationwide'
  | 'regional_gcc'
  | 'coverage_overlap'
  | 'same_city'
  | 'same_country'
  | 'different_gcc_country'
  | 'weak'

export type LocationCoverageResult = {
  readonly score: number
  readonly tier: LocationCoverageTier
  readonly label: string
}

/** Canonical city / region label → country or region marker. */
const LABEL_TO_COUNTRY: Readonly<Record<string, LocationCountryCode>> = {
  remote: 'REMOTE',
  'on-site': 'UNKNOWN',
  onsite: 'UNKNOWN',
  hybrid: 'UNKNOWN',
  // Saudi Arabia — cities / regions
  riyadh: 'SA',
  'riyadh city': 'SA',
  jeddah: 'SA',
  dammam: 'SA',
  'eastern province': 'SA',
  jubail: 'SA',
  tabuk: 'SA',
  neom: 'SA',
  'al khobar': 'SA',
  khobar: 'SA',
  dhahran: 'SA',
  makkah: 'SA',
  taif: 'SA',
  asir: 'SA',
  abha: 'SA',
  'khamis mushait': 'SA',
  diriyah: 'SA',
  'al kharj': 'SA',
  buraydah: 'SA',
  unaizah: 'SA',
  qassim: 'SA',
  hail: 'SA',
  arar: 'SA',
  jazan: 'SA',
  najran: 'SA',
  'al bahah': 'SA',
  sakaka: 'SA',
  ksa: 'SA',
  'saudi arabia': 'SA',
  sa: 'SA',
  // UAE
  uae: 'AE',
  'united arab emirates': 'AE',
  dubai: 'AE',
  'abu dhabi': 'AE',
  sharjah: 'AE',
  // Qatar / Kuwait / Bahrain / Oman
  qatar: 'QA',
  doha: 'QA',
  kuwait: 'KW',
  'kuwait city': 'KW',
  bahrain: 'BH',
  manama: 'BH',
  oman: 'OM',
  muscat: 'OM',
  // Egypt (MENA, not GCC)
  egypt: 'EG',
  eg: 'EG',
  cairo: 'EG',
  alexandria: 'EG',
  giza: 'EG',
  // Regional
  gcc: 'GCC',
  mena: 'MENA',
  global: 'GLOBAL',
}

const GCC_COUNTRIES: ReadonlySet<LocationCountryCode> = new Set([
  'SA',
  'AE',
  'QA',
  'KW',
  'BH',
  'OM',
])

const MENA_COUNTRIES: ReadonlySet<LocationCountryCode> = new Set([
  ...GCC_COUNTRIES,
  'EG',
])

const NATIONWIDE_TOKENS = new Set([
  'ksa',
  'saudi arabia',
  'saudi-arabia',
  'nationwide',
  'national',
  'all saudi arabia',
  'kingdom of saudi arabia',
  'sa',
  'countrywide',
  'entire kingdom',
])

const GCC_TOKENS = new Set(['gcc', 'gulf', 'gulf cooperation council'])
const MENA_TOKENS = new Set(['mena', 'middle east', 'middle-east'])
const GLOBAL_TOKENS = new Set(['global', 'worldwide', 'international', 'world'])
const REMOTE_TOKENS = new Set(['remote', 'work from home', 'wfh'])

const GENERIC_COVERAGE_TOKENS = new Set([
  ...NATIONWIDE_TOKENS,
  ...GCC_TOKENS,
  ...MENA_TOKENS,
  ...GLOBAL_TOKENS,
  ...REMOTE_TOKENS,
])

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ')
}

export function resolveLocationCountry(
  locationLabel: string | null | undefined,
): LocationCountryCode {
  if (!locationLabel) return 'UNKNOWN'
  const key = normalizeToken(locationLabel)
  if (!key) return 'UNKNOWN'
  if (LABEL_TO_COUNTRY[key]) return LABEL_TO_COUNTRY[key]
  const dashed = key.replace(/\s+/g, '-')
  if (LABEL_TO_COUNTRY[dashed]) return LABEL_TO_COUNTRY[dashed]
  return 'UNKNOWN'
}

function pushUnique(target: string[], value: string): void {
  const normalized = normalizeToken(value)
  if (normalized && !target.includes(normalized)) target.push(normalized)
}

function collectRawCoverageTokens(
  primaryLocation: string | undefined,
  coverageScopes: readonly string[] | undefined,
  attributes: Readonly<Record<string, unknown>> | undefined,
): string[] {
  const tokens: string[] = []
  if (primaryLocation) pushUnique(tokens, primaryLocation)
  for (const scope of coverageScopes ?? []) {
    pushUnique(tokens, scope)
  }
  if (!attributes) return tokens

  const stringKeys = [
    'serviceArea',
    'geographicScope',
    'locationRequirement',
    'workMode',
    'coverageArea',
  ] as const
  for (const key of stringKeys) {
    const value = attributes[key]
    if (typeof value === 'string') pushUnique(tokens, value)
  }

  const arrayKeys = [
    'serviceAreas',
    'coverageAreas',
    'geographicScopes',
    'operatingRegions',
  ] as const
  for (const key of arrayKeys) {
    const value = attributes[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') pushUnique(tokens, item)
      }
    }
  }
  return tokens
}

export type ResolvedCoverage = {
  readonly primaryLocation: string
  readonly country: LocationCountryCode
  readonly isRemote: boolean
  readonly hasNationwide: boolean
  readonly hasGccRegional: boolean
  readonly hasMena: boolean
  readonly hasGlobal: boolean
  readonly coverageScopes: readonly string[]
}

export function resolveCoverage(
  primaryLocation: string | undefined,
  coverageScopes: readonly string[] | undefined,
  attributes?: Readonly<Record<string, unknown>>,
): ResolvedCoverage {
  const tokens = collectRawCoverageTokens(primaryLocation, coverageScopes, attributes)
  const primary = (primaryLocation ?? '').trim()
  const country = resolveLocationCountry(primary)

  let isRemote = country === 'REMOTE'
  let hasNationwide = country === 'SA' && normalizeToken(primary) === 'ksa'
  let hasGccRegional = country === 'GCC'
  let hasMena = country === 'MENA'
  let hasGlobal = country === 'GLOBAL'

  for (const token of tokens) {
    if (REMOTE_TOKENS.has(token) || token.includes('remote')) isRemote = true
    if (NATIONWIDE_TOKENS.has(token)) hasNationwide = true
    if (GCC_TOKENS.has(token)) hasGccRegional = true
    if (MENA_TOKENS.has(token)) hasMena = true
    if (GLOBAL_TOKENS.has(token)) hasGlobal = true
    if (token.includes('saudi') && (token.includes('all') || token.includes('nation'))) {
      hasNationwide = true
    }
  }

  return {
    primaryLocation: primary,
    country,
    isRemote,
    hasNationwide,
    hasGccRegional,
    hasMena,
    hasGlobal,
    coverageScopes: tokens,
  }
}

function isGccCountry(code: LocationCountryCode): boolean {
  return GCC_COUNTRIES.has(code)
}

function isMenaCountry(code: LocationCountryCode): boolean {
  return MENA_COUNTRIES.has(code)
}

function countriesCompatibleViaNationwide(
  coverage: ResolvedCoverage,
  counterpartCountry: LocationCountryCode,
): boolean {
  if (!coverage.hasNationwide) return false
  return counterpartCountry === 'SA' || counterpartCountry === 'UNKNOWN'
}

function countriesCompatibleViaRegional(
  coverage: ResolvedCoverage,
  counterpartCountry: LocationCountryCode,
): boolean {
  if (coverage.hasGlobal) return true
  if (coverage.hasMena) {
    return (
      isMenaCountry(counterpartCountry)
      || counterpartCountry === 'GCC'
      || counterpartCountry === 'MENA'
      || counterpartCountry === 'UNKNOWN'
    )
  }
  if (coverage.hasGccRegional) {
    return (
      isGccCountry(counterpartCountry)
      || counterpartCountry === 'GCC'
      || counterpartCountry === 'UNKNOWN'
    )
  }
  return false
}

/** Specific (non-generic) coverage tokens for intersection scoring. */
function specificCoverageTokens(coverage: ResolvedCoverage): string[] {
  return coverage.coverageScopes.filter((token) => !GENERIC_COVERAGE_TOKENS.has(token))
}

function coverageTokenCountries(coverage: ResolvedCoverage): Set<LocationCountryCode> {
  const countries = new Set<LocationCountryCode>()
  for (const token of coverage.coverageScopes) {
    const code = resolveLocationCountry(token)
    if (code !== 'UNKNOWN' && code !== 'REMOTE') countries.add(code)
  }
  if (coverage.country !== 'UNKNOWN' && coverage.country !== 'REMOTE') {
    countries.add(coverage.country)
  }
  return countries
}

/**
 * Soft location fit — never hard-rejects. City is a preference under coverage.
 */
export function evaluateLocationCoverage(
  need: ResolvedCoverage,
  offer: ResolvedCoverage,
): LocationCoverageResult {
  if (need.isRemote || offer.isRemote) {
    return { score: 1, tier: 'remote', label: 'Remote' }
  }

  const needCountry = need.country === 'UNKNOWN' && need.hasNationwide ? 'SA' : need.country
  const offerCountry = offer.country === 'UNKNOWN' && offer.hasNationwide ? 'SA' : offer.country

  if (
    countriesCompatibleViaNationwide(need, offerCountry)
    || countriesCompatibleViaNationwide(offer, needCountry)
  ) {
    return { score: 1, tier: 'nationwide', label: 'Nationwide' }
  }

  if (
    countriesCompatibleViaRegional(need, offerCountry)
    || countriesCompatibleViaRegional(offer, needCountry)
  ) {
    return { score: 0.85, tier: 'regional_gcc', label: 'Regional GCC' }
  }

  // Same primary city — prefer this tier for diagnostics when HQ cities match
  const needCity = normalizeToken(need.primaryLocation)
  const offerCity = normalizeToken(offer.primaryLocation)
  if (needCity && offerCity && needCity === offerCity) {
    return { score: 1, tier: 'same_city', label: 'Same City' }
  }

  // Specific coverage intersection (primary + coverage areas), excluding generics
  const needSpecific = specificCoverageTokens(need)
  const offerSpecific = new Set(specificCoverageTokens(offer))
  const overlap = needSpecific.filter((token) => offerSpecific.has(token))
  if (overlap.length > 0) {
    return { score: 1, tier: 'coverage_overlap', label: 'Coverage Overlap' }
  }

  if (
    (needCountry === 'SA' && offerCountry === 'SA')
    || (normalizeToken(need.primaryLocation) === 'ksa' && offerCountry === 'SA')
    || (normalizeToken(offer.primaryLocation) === 'ksa' && needCountry === 'SA')
  ) {
    return { score: 0.75, tier: 'same_country', label: 'Same Country' }
  }

  if (
    needCountry !== 'UNKNOWN'
    && offerCountry !== 'UNKNOWN'
    && needCountry === offerCountry
    && needCountry !== 'REMOTE'
  ) {
    return { score: 0.75, tier: 'same_country', label: 'Same Country' }
  }

  // Same country via coverage tokens (e.g. Dubai HQ covering Riyadh vs Riyadh need
  // already handled by overlap; this catches country-level soft fit)
  const needCountries = coverageTokenCountries(need)
  const offerCountries = coverageTokenCountries(offer)
  for (const code of needCountries) {
    if (offerCountries.has(code) && code !== 'GCC' && code !== 'MENA' && code !== 'GLOBAL') {
      return { score: 0.75, tier: 'same_country', label: 'Same Country' }
    }
  }

  if (isGccCountry(needCountry) && isGccCountry(offerCountry) && needCountry !== offerCountry) {
    return { score: 0.5, tier: 'different_gcc_country', label: 'Different GCC Country' }
  }

  if (
    (needCountry === 'GCC' && isGccCountry(offerCountry))
    || (offerCountry === 'GCC' && isGccCountry(needCountry))
  ) {
    return { score: 0.5, tier: 'different_gcc_country', label: 'Different GCC Country' }
  }

  return { score: 0.25, tier: 'weak', label: 'Weak Location Fit' }
}

/** Extract coverage scope strings from opportunity attributes for NormalizedPost. */
export function extractCoverageScopes(
  attributes: Readonly<Record<string, unknown>> | undefined,
): string[] {
  if (!attributes) return []
  const scopes: string[] = []
  const push = (value: unknown): void => {
    if (typeof value === 'string' && value.trim()) pushUnique(scopes, value)
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) pushUnique(scopes, item)
      }
    }
  }
  push(attributes.serviceArea)
  push(attributes.serviceAreas)
  push(attributes.coverageAreas)
  push(attributes.coverageArea)
  push(attributes.geographicScope)
  push(attributes.geographicScopes)
  push(attributes.operatingRegions)
  return scopes
}
