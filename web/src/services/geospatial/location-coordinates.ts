import locationsSeed from '@seed-data/locations.json'
import type { Opportunity } from '@/types/domain.ts'
import { resolveScopeCoordinates } from '@/domain/locations'

export type GeoCoordinate = {
  readonly lat: number
  readonly lng: number
}

type LocationSeedCountry = {
  readonly id?: string
  readonly lat?: number
  readonly lng?: number
  readonly regions?: ReadonlyArray<{
    readonly id?: string
    readonly name?: string
    readonly lat?: number
    readonly lng?: number
    readonly cities?: ReadonlyArray<{
      readonly id?: string
      readonly name?: string
      readonly lat?: number
      readonly lng?: number
    }>
  }>
}

type OpportunityGeoSource = Opportunity & {
  readonly locationCountry?: string
  readonly locationRegion?: string
  readonly locationCity?: string
  readonly latitude?: number | null
  readonly longitude?: number | null
}

export const DEFAULT_MAP_CENTER: GeoCoordinate = { lat: 24.7136, lng: 46.6753 }
export const DEFAULT_MAP_ZOOM = 6

const cityById = new Map<string, GeoCoordinate>()
const regionByKey = new Map<string, GeoCoordinate>()
const countryById = new Map<string, GeoCoordinate>()
const nameToCoords = new Map<string, GeoCoordinate>()

function registerName(name: string | undefined, coords: GeoCoordinate): void {
  if (!name) return
  const key = name.trim().toLowerCase()
  if (!key || nameToCoords.has(key)) return
  nameToCoords.set(key, coords)
}

function buildLocationIndex(): void {
  if (cityById.size > 0) return

  for (const country of (locationsSeed as { countries?: LocationSeedCountry[] }).countries ?? []) {
    const countryId = (country.id ?? '').toLowerCase()
    if (countryId && country.lat != null && country.lng != null) {
      const coords = { lat: country.lat, lng: country.lng }
      countryById.set(countryId, coords)
      registerName(countryId, coords)
    }

    for (const region of country.regions ?? []) {
      const regionId = (region.id ?? '').toLowerCase()
      if (region.lat != null && region.lng != null) {
        const coords = { lat: region.lat, lng: region.lng }
        if (countryId && regionId) {
          regionByKey.set(`${countryId}:${regionId}`, coords)
        }
        registerName(region.name, coords)
        registerName(regionId, coords)
      }

      for (const city of region.cities ?? []) {
        if (city.lat == null || city.lng == null) continue
        const coords = { lat: city.lat, lng: city.lng }
        if (city.id) cityById.set(city.id, coords)
        registerName(city.name, coords)
        if (city.id) registerName(city.id, coords)
      }
    }
  }
}

function normalizeRegionId(regionId: string | undefined): string {
  if (!regionId) return ''
  const normalized = regionId.toLowerCase()
  return normalized === 'eastern' ? 'eastern-province' : normalized
}

function resolveFromLocationText(location: string | undefined): GeoCoordinate | null {
  if (!location) return null
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean)
  for (const part of parts) {
    const hit = nameToCoords.get(part.toLowerCase())
    if (hit) return hit
  }
  const whole = nameToCoords.get(location.trim().toLowerCase())
  return whole ?? null
}

export function resolveOpportunityCoordinates(
  opportunity: Opportunity,
): GeoCoordinate | null {
  buildLocationIndex()

  const source = opportunity as OpportunityGeoSource
  if (source.latitude != null && source.longitude != null) {
    return { lat: source.latitude, lng: source.longitude }
  }

  // Canonical scope ID (e.g. sa/riyadh/riyadh-city)
  const fromScope = resolveScopeCoordinates(source.location)
  if (fromScope) return fromScope

  if (source.locationCity) {
    const city = cityById.get(source.locationCity)
    if (city) return city
    const byName = nameToCoords.get(source.locationCity.toLowerCase())
    if (byName) return byName
  }

  if (source.locationCountry && source.locationRegion) {
    const countryId = source.locationCountry.toLowerCase()
    const regionId = normalizeRegionId(source.locationRegion)
    const region = regionByKey.get(`${countryId}:${regionId}`)
    if (region) return region
  }

  const fromText = resolveFromLocationText(source.location ?? source.city)
  if (fromText) return fromText

  if (source.locationCountry) {
    const country = countryById.get(source.locationCountry.toLowerCase())
    if (country) return country
  }

  return null
}

export function resolvePublishedOpportunityMapPoints(
  opportunities: readonly Opportunity[],
): Array<{ opportunity: Opportunity; coordinates: GeoCoordinate }> {
  return opportunities.flatMap((opportunity) => {
    const coordinates = resolveOpportunityCoordinates(opportunity)
    return coordinates ? [{ opportunity, coordinates }] : []
  })
}
