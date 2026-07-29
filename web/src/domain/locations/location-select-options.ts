/**
 * Build PmMultiSelect options from canonical location scopes.
 */
import {
  listLocationScopes,
  type LocationScope,
} from '@/domain/locations'
import type { PmMultiSelectOption } from '@/components/ui/pm-multi-select'

function groupLabel(scope: LocationScope): string {
  if (scope.kind === 'preset') return 'Quick presets'
  if (scope.kind === 'country') {
    return scope.countryId === 'sa'
      ? 'Saudi Arabia'
      : scope.label
  }
  // region / city — group under country name
  const countryId = scope.countryId ?? scope.id.split('/')[0]
  const country = listLocationScopes().find(
    (s) => s.id === countryId && s.kind === 'country',
  )
  return country?.label ?? countryId?.toUpperCase() ?? 'Other'
}

function description(scope: LocationScope): string | undefined {
  if (scope.kind === 'city') return 'City'
  if (scope.kind === 'region') return 'Region'
  if (scope.kind === 'country') return 'Nationwide / country'
  if (scope.id === 'gcc') return 'All six GCC countries'
  if (scope.id === 'remote') return 'Remote / work from home'
  return undefined
}

/** Options for Coverage Areas multi-select (includes presets + full tree). */
export function coverageAreaSelectOptions(): PmMultiSelectOption[] {
  return listLocationScopes().map((scope) => ({
    id: scope.id,
    label: scope.id === 'sa' ? 'Nationwide — Saudi Arabia' : scope.label,
    group: groupLabel(scope),
    description: description(scope),
  }))
}

/**
 * Options for Primary Location / Asset location single-select.
 * Prefers cities and regions; includes countries and Remote (excludes bare GCC preset).
 */
export function primaryLocationSelectOptions(): PmMultiSelectOption[] {
  return listLocationScopes()
    .filter((scope) => scope.id !== 'gcc')
    .map((scope) => ({
      id: scope.id,
      label: scope.label,
      group: groupLabel(scope),
      description: description(scope),
    }))
}
