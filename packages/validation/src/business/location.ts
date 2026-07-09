import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { hasText } from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

/** Best-effort inconsistent pairs until richer location master data exists. */
const INCONSISTENT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['saudi', 'cairo'],
  ['saudi arabia', 'cairo'],
  ['ksa', 'cairo'],
  ['egypt', 'riyadh'],
  ['uae', 'riyadh'],
]

function locationIssue(
  code: string,
  fieldPaths: readonly string[],
): ValidationIssue {
  return {
    code,
    source: 'business',
    severity: 'error',
    scope: DRAFT_UPDATE_PUBLISH,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'location',
  }
}

function normalizePlace(value?: string): string {
  return (value ?? '').toLowerCase().trim()
}

export const locationInconsistent: ValidationRule = {
  id: 'location-inconsistent',
  code: VAL_CODES.LOCATION_INCONSISTENT,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['country', 'city', 'location'],
  group: 'location',
  execute(input) {
    const country = normalizePlace(input.country ?? input.location)
    const city = normalizePlace(input.city)
    if (!country || !city) return null
    for (const [c, cityName] of INCONSISTENT_PAIRS) {
      if (country.includes(c) && city.includes(cityName)) {
        return locationIssue(VAL_CODES.LOCATION_INCONSISTENT, ['city'])
      }
    }
    return null
  },
}

export const locationOnsiteRequired: ValidationRule = {
  id: 'location-onsite-required',
  code: VAL_CODES.LOCATION_ONSITE_REQUIRED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['location', 'workMode'],
  group: 'location',
  execute(input) {
    const mode = normalizePlace(input.workMode)
    if (!mode.includes('on-site') && !mode.includes('onsite') && mode !== 'on site') {
      return null
    }
    if (hasText(input.location) || hasText(input.country)) return null
    return locationIssue(VAL_CODES.LOCATION_ONSITE_REQUIRED, ['location'])
  },
}

export const LOCATION_RULES: readonly ValidationRule[] = [
  locationInconsistent,
  locationOnsiteRequired,
]
