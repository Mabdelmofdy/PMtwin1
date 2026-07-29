export {
  collapseRedundantScopes,
  expandScopeTokens,
  formatLocation,
  getLocationScope,
  isAssetOutsideCoverage,
  isScopeId,
  listLocationScopes,
  normalizeStoredLocation,
  resolveOpportunityCoverageAreas,
  resolveScopeCoordinates,
  resolveScopeIdFromText,
  resolveScopeLabel,
  resolveScopeLabels,
  type GeoCoordinate,
  type LocationScope,
  type LocationScopeKind,
} from './canonical-locations.ts'

export {
  coverageAreaSelectOptions,
  primaryLocationSelectOptions,
} from './location-select-options.ts'

export {
  opportunityLocationSearchText,
  opportunityMatchesLocationQuery,
  opportunityMatchesLocationScopes,
} from './opportunity-location-match.ts'
