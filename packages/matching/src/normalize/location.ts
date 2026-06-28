import type { LocationCanonicalMap } from '../types/canonical.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

export function normalizeLocation(
  opportunity: OpportunityPost,
  locationCanonical: LocationCanonicalMap = {},
): string {
  const attributes = opportunity.attributes ?? {}
  const locReq = attributes.locationRequirement ?? attributes.workMode
  if (locReq) {
    const key = String(locReq).toLowerCase().replace(/\s+/g, '-')
    if (locationCanonical[key]) return locationCanonical[key]
    const altKey = String(locReq).toLowerCase()
    if (locationCanonical[altKey]) return locationCanonical[altKey]
    if (/remote/i.test(String(locReq))) return 'Remote'
    if (/hybrid/i.test(String(locReq))) return 'Hybrid'
    if (/on-site|onsite/i.test(String(locReq))) return 'On-Site'
  }

  const region = (opportunity.locationRegion ?? '').toLowerCase().replace(/\s+/g, '-')
  const city = (opportunity.locationCity ?? '').toLowerCase().replace(/\s+/g, '-')
  const country = (opportunity.locationCountry ?? '').toLowerCase()
  if (region && locationCanonical[region]) return locationCanonical[region]
  if (city && locationCanonical[city]) return locationCanonical[city]
  if (country && locationCanonical[country]) return locationCanonical[country]
  if (opportunity.location && /remote/i.test(opportunity.location)) return 'Remote'
  if (region) {
    return region.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  }
  if (country === 'sa' || country === 'sau') return 'KSA'
  return opportunity.location ?? 'KSA'
}
