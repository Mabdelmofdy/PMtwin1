/**
 * Canonical location scopes from @seed-data/locations.json.
 * Stored values are slash-path scope IDs; labels and match tokens are derived at read time.
 */
import locationsSeed from '@seed-data/locations.json'

export type LocationScopeKind = 'preset' | 'country' | 'region' | 'city'

export type LocationScope = {
  readonly id: string
  readonly label: string
  readonly kind: LocationScopeKind
  readonly parentId?: string
  readonly countryId?: string
  readonly lat?: number
  readonly lng?: number
}

export type GeoCoordinate = {
  readonly lat: number
  readonly lng: number
}

type SeedCity = {
  readonly id?: string
  readonly name?: string
  readonly lat?: number
  readonly lng?: number
}

type SeedRegion = {
  readonly id?: string
  readonly name?: string
  readonly lat?: number
  readonly lng?: number
  readonly cities?: ReadonlyArray<SeedCity>
}

type SeedCountry = {
  readonly id?: string
  readonly name?: string
  readonly lat?: number
  readonly lng?: number
  readonly regions?: ReadonlyArray<SeedRegion>
}

const PRESETS: readonly LocationScope[] = [
  { id: 'remote', label: 'Remote', kind: 'preset' },
  { id: 'gcc', label: 'GCC', kind: 'preset' },
  {
    id: 'sa',
    label: 'Nationwide — Saudi Arabia',
    kind: 'preset',
    countryId: 'sa',
  },
]

const MAX_EXPANDED_TOKENS = 200

let scopesById: Map<string, LocationScope> | null = null
let childrenByParent: Map<string, string[]> | null = null
let labelToId: Map<string, string> | null = null
let orderedScopes: LocationScope[] | null = null

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ')
}

function pushUnique(target: string[], value: string): void {
  const key = normalizeKey(value)
  if (!key) return
  if (target.some((item) => normalizeKey(item) === key)) return
  target.push(value)
}

function ensureIndex(): void {
  if (scopesById) return

  scopesById = new Map()
  childrenByParent = new Map()
  labelToId = new Map()
  orderedScopes = []

  const register = (scope: LocationScope): void => {
    if (scopesById!.has(scope.id)) return
    scopesById!.set(scope.id, scope)
    orderedScopes!.push(scope)
    const labelKey = normalizeKey(scope.label)
    if (labelKey && !labelToId!.has(labelKey)) {
      labelToId!.set(labelKey, scope.id)
    }
    // Index bare id segments for cities and countries only — region leaf
    // "riyadh" must not steal the city alias "Riyadh".
    if (scope.kind === 'city' || scope.kind === 'country' || scope.kind === 'preset') {
      const leaf = scope.id.split('/').pop()
      if (leaf) {
        const leafKey = normalizeKey(leaf.replace(/-/g, ' '))
        if (leafKey && !labelToId!.has(leafKey)) {
          labelToId!.set(leafKey, scope.id)
        }
      }
    }
    if (scope.parentId) {
      const siblings = childrenByParent!.get(scope.parentId) ?? []
      siblings.push(scope.id)
      childrenByParent!.set(scope.parentId, siblings)
    }
  }

  // Presets first (sa country node is registered from seed below; preset sa
  // is an alias display label for the same id — register country from seed).
  for (const preset of PRESETS) {
    if (preset.id === 'sa') continue // country node from seed owns this id
    register(preset)
  }

  const countries =
    (locationsSeed as { countries?: ReadonlyArray<SeedCountry> }).countries ?? []

  for (const country of countries) {
    const countryId = (country.id ?? '').trim().toLowerCase()
    if (!countryId) continue

    if (countryId === 'remote') {
      register({
        id: 'remote',
        label: country.name?.trim() || 'Remote',
        kind: 'preset',
        lat: country.lat,
        lng: country.lng,
      })
      continue
    }

    const countryLabel =
      countryId === 'sa'
        ? 'Saudi Arabia'
        : country.name?.trim() || countryId.toUpperCase()

    register({
      id: countryId,
      label: countryLabel,
      kind: 'country',
      countryId,
      lat: country.lat,
      lng: country.lng,
    })

    for (const region of country.regions ?? []) {
      const regionId = (region.id ?? '').trim().toLowerCase()
      if (!regionId) continue
      const regionScopeId = `${countryId}/${regionId}`
      register({
        id: regionScopeId,
        label: region.name?.trim() || regionId,
        kind: 'region',
        parentId: countryId,
        countryId,
        lat: region.lat,
        lng: region.lng,
      })

      for (const city of region.cities ?? []) {
        const cityId = (city.id ?? '').trim().toLowerCase()
        if (!cityId) continue
        const cityScopeId = `${regionScopeId}/${cityId}`
        register({
          id: cityScopeId,
          label: city.name?.trim() || cityId,
          kind: 'city',
          parentId: regionScopeId,
          countryId,
          lat: city.lat,
          lng: city.lng,
        })
      }
    }
  }

  // Re-register nationwide preset display alias for SA (same id as country)
  const sa = scopesById.get('sa')
  if (sa) {
    labelToId.set(normalizeKey('Nationwide — Saudi Arabia'), 'sa')
    labelToId.set(normalizeKey('nationwide'), 'sa')
    labelToId.set(normalizeKey('ksa'), 'sa')
    labelToId.set(normalizeKey('saudi arabia'), 'sa')
  }

  labelToId.set(normalizeKey('gcc'), 'gcc')
  labelToId.set(normalizeKey('gulf'), 'gcc')
  labelToId.set(normalizeKey('remote'), 'remote')
  labelToId.set(normalizeKey('work from home'), 'remote')
  labelToId.set(normalizeKey('wfh'), 'remote')

  // Common free-text aliases used in seed / legacy opportunities
  const aliases: ReadonlyArray<[string, string]> = [
    ['riyadh', 'sa/riyadh/riyadh-city'],
    ['riyadh, saudi arabia', 'sa/riyadh/riyadh-city'],
    ['jeddah', 'sa/makkah/jeddah'],
    ['jeddah, saudi arabia', 'sa/makkah/jeddah'],
    ['dammam', 'sa/eastern-province/dammam'],
    ['dammam, saudi arabia', 'sa/eastern-province/dammam'],
    ['makkah', 'sa/makkah/makkah-city'],
    ['mecca', 'sa/makkah/makkah-city'],
    ['dubai', 'uae/dubai-emirate/dubai'],
    ['abu dhabi', 'uae/abu-dhabi-emirate/abu-dhabi'],
    ['doha', 'qa/doha-region/doha'],
    ['kuwait city', 'kw/kuwait-region/kuwait-city'],
    ['manama', 'bh/bahrain-region/manama'],
    ['muscat', 'om/muscat-region/muscat'],
    ['cairo', 'eg/cairo-governorate/cairo'],
    ['eastern province', 'sa/eastern-province'],
  ]
  for (const [alias, id] of aliases) {
    if (scopesById.has(id)) {
      // Aliases win over region leaf collisions (e.g. "riyadh" → city)
      labelToId.set(normalizeKey(alias), id)
    }
  }
}

/** All selectable scopes: presets (remote, gcc) + countries/regions/cities. */
export function listLocationScopes(): readonly LocationScope[] {
  ensureIndex()
  const scopes = orderedScopes!
  // Put remote + gcc first for picker UX, then countries tree
  const remote = scopes.filter((s) => s.id === 'remote')
  const gcc = scopes.filter((s) => s.id === 'gcc')
  const rest = scopes.filter((s) => s.id !== 'remote' && s.id !== 'gcc')
  return [...remote, ...gcc, ...rest]
}

export function getLocationScope(id: string): LocationScope | undefined {
  ensureIndex()
  return scopesById!.get(id.trim())
}

export function isScopeId(value: string | null | undefined): boolean {
  if (!value?.trim()) return false
  ensureIndex()
  return scopesById!.has(value.trim())
}

/**
 * Tolerant label resolver: known scope ID → canonical label;
 * anything else returns the input unchanged (legacy free-text passthrough).
 */
export function resolveScopeLabel(value: string | null | undefined): string {
  if (!value?.trim()) return ''
  ensureIndex()
  const scope = scopesById!.get(value.trim())
  if (scope) return scope.label
  return value.trim()
}

/** Display helper — same as resolveScopeLabel; preferred name at UI call sites. */
export function formatLocation(value: string | null | undefined): string {
  return resolveScopeLabel(value)
}

export function resolveScopeLabels(
  ids: readonly string[] | null | undefined,
): string[] {
  if (!ids?.length) return []
  return ids.map((id) => resolveScopeLabel(id)).filter(Boolean)
}

/**
 * Map free-text / legacy label to a canonical scope ID when possible.
 */
export function resolveScopeIdFromText(
  text: string | null | undefined,
): string | null {
  if (!text?.trim()) return null
  ensureIndex()
  const trimmed = text.trim()
  if (scopesById!.has(trimmed)) return trimmed

  const whole = labelToId!.get(normalizeKey(trimmed))
  if (whole && scopesById!.has(whole)) return whole

  // Try comma-separated parts ("Riyadh, Saudi Arabia")
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean)
  for (const part of parts) {
    const hit = labelToId!.get(normalizeKey(part))
    if (hit && scopesById!.has(hit)) return hit
  }
  return null
}

function collectDescendantLabels(scopeId: string, out: string[]): void {
  ensureIndex()
  const scope = scopesById!.get(scopeId)
  if (!scope) return
  pushUnique(out, scope.label)
  const children = childrenByParent!.get(scopeId) ?? []
  for (const childId of children) {
    if (out.length >= MAX_EXPANDED_TOKENS) return
    collectDescendantLabels(childId, out)
  }
}

/**
 * Downward-only expansion to engine label tokens.
 * City → city label only (never nationwide).
 * Region → region + cities. Country → country label (nationwide for SA).
 */
export function expandScopeTokens(
  ids: readonly string[] | null | undefined,
): string[] {
  if (!ids?.length) return []
  ensureIndex()
  const out: string[] = []
  for (const raw of ids) {
    if (out.length >= MAX_EXPANDED_TOKENS) break
    const id = raw.trim()
    if (!id) continue

    if (id === 'gcc') {
      pushUnique(out, 'GCC')
      continue
    }
    if (id === 'remote') {
      pushUnique(out, 'Remote')
      continue
    }

    const scope = scopesById!.get(id)
    if (!scope) {
      // Passthrough unknown tokens (legacy free-text)
      pushUnique(out, id)
      continue
    }

    if (scope.kind === 'city') {
      pushUnique(out, scope.label)
      continue
    }
    if (scope.kind === 'country') {
      // Country selection = nationwide for that country (SA → "Saudi Arabia")
      pushUnique(out, scope.label)
      continue
    }
    // Region: self + descendant cities
    collectDescendantLabels(id, out)
  }
  return out.slice(0, MAX_EXPANDED_TOKENS)
}

export function resolveScopeCoordinates(
  id: string | null | undefined,
): GeoCoordinate | null {
  if (!id?.trim()) return null
  ensureIndex()
  const scope = scopesById!.get(id.trim())
  if (!scope || scope.lat == null || scope.lng == null) return null
  return { lat: scope.lat, lng: scope.lng }
}

/**
 * Collapse redundant descendants when an ancestor is also selected
 * (e.g. `sa` + `sa/riyadh` → `sa`).
 */
export function collapseRedundantScopes(
  ids: readonly string[],
): { collapsed: string[]; removed: string[] } {
  ensureIndex()
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  const removed: string[] = []
  const collapsed = unique.filter((id) => {
    const hasAncestor = unique.some(
      (other) => other !== id && id.startsWith(`${other}/`),
    )
    if (hasAncestor) {
      removed.push(id)
      return false
    }
    return true
  })
  return { collapsed, removed }
}

/**
 * Resolve opportunity coverageAreas with legacy serviceArea fallback.
 */
export function resolveOpportunityCoverageAreas(opportunity: {
  readonly coverageAreas?: readonly string[] | null
  readonly collaborationAttributes?: Readonly<Record<string, unknown>> | null
  readonly attributes?: Readonly<Record<string, unknown>> | null
}): string[] {
  if (opportunity.coverageAreas?.length) {
    return [...opportunity.coverageAreas]
  }
  const attrs = {
    ...(opportunity.collaborationAttributes ?? {}),
    ...(opportunity.attributes ?? {}),
  }
  const serviceArea = attrs.serviceArea
  if (typeof serviceArea === 'string' && serviceArea.trim()) {
    const id = resolveScopeIdFromText(serviceArea)
    return id ? [id] : []
  }
  if (Array.isArray(attrs.serviceAreas)) {
    return attrs.serviceAreas
      .map((item) =>
        typeof item === 'string' ? resolveScopeIdFromText(item) : null,
      )
      .filter((id): id is string => Boolean(id))
  }
  return []
}

/**
 * Normalize a stored location value to a scope ID when possible;
 * otherwise return the original string (legacy passthrough).
 */
export function normalizeStoredLocation(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return ''
  const trimmed = value.trim()
  if (isScopeId(trimmed)) return trimmed
  return resolveScopeIdFromText(trimmed) ?? trimmed
}

/** True when asset location is outside declared coverage + primary. */
export function isAssetOutsideCoverage(
  assetLocationId: string | null | undefined,
  primaryLocationId: string | null | undefined,
  coverageAreaIds: readonly string[],
): boolean {
  if (!assetLocationId?.trim()) return false
  const allowed = new Set<string>()
  if (primaryLocationId?.trim()) allowed.add(primaryLocationId.trim())
  for (const id of coverageAreaIds) {
    if (id.trim()) allowed.add(id.trim())
  }
  // Also allow if asset is a descendant of any allowed scope, or ancestor covers it
  const asset = assetLocationId.trim()
  if (allowed.has(asset)) return false
  for (const allowedId of allowed) {
    if (asset.startsWith(`${allowedId}/`) || allowedId.startsWith(`${asset}/`)) {
      return false
    }
    // Nationwide country covers all cities in that country
    const assetScope = getLocationScope(asset)
    const allowedScope = getLocationScope(allowedId)
    if (
      assetScope?.countryId &&
      allowedScope?.kind === 'country' &&
      assetScope.countryId === allowedScope.id
    ) {
      return false
    }
  }
  return true
}
