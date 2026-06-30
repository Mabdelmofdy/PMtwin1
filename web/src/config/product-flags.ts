/**
 * Product feature flags — UI presentation only.
 * Domain, repositories, commands, and tests remain regardless of flag state.
 */
export const productFlags = {
  /** When false, legacy direct-application workflow is hidden from normal UI. */
  showLegacyApplications: false,
} as const
