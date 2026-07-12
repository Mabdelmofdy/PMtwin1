/**
 * Admin design system barrel — EOX shared primitives.
 */

export { AdminWorkspaceShell } from '@/components/admin/workspace/admin-workspace-shell'
export { AdminWorkspaceHeader } from '@/components/admin/workspace/admin-workspace-header'
export { AdminKpiStrip } from '@/components/admin/workspace/admin-kpi-strip'
export { AdminFilterBar } from '@/components/admin/workspace/admin-filter-bar'
export { AdminDataView } from '@/components/admin/workspace/admin-data-view'
export { AdminSavedViews } from '@/components/admin/workspace/admin-saved-views'
export { AdminActionQueue } from '@/components/admin/workspace/admin-action-queue'
export { AdminDomainNavTiles } from '@/components/admin/workspace/admin-domain-nav-tiles'

export { AdminOpsActionCard } from '@/components/admin/command-center/admin-ops-action-card'
export { AdminRequiresActionPanel } from '@/components/admin/command-center/admin-requires-action-panel'
export { AdminPlatformHealthPanel } from '@/components/admin/command-center/admin-platform-health-panel'
export { AdminPipelinePanel } from '@/components/admin/command-center/admin-pipeline-panel'
export { AdminRiskSeverityPanel } from '@/components/admin/command-center/admin-risk-severity-panel'
export { AdminRecentOperations } from '@/components/admin/command-center/admin-recent-operations'

export {
  AdminEntityDetailShell,
  AdminStatusSummaryRow,
  AdminEntitySectionCard,
} from '@/components/admin/entity/admin-entity-detail-shell'

export {
  AdminDistributionChart,
  AdminTrendChart,
  AdminConversionFunnel,
  AdminMetricTile,
} from '@/components/admin/analytics/admin-analytics-charts'

export {
  severityToBadgeTone,
  slaToBadgeTone,
  healthToneToBadgeTone,
  severityCardClass,
  healthToneCardClass,
} from '@/components/admin/severity/admin-severity'
export type { AdminHealthTone } from '@/components/admin/severity/admin-severity'

export { AdminQuickActions } from '@/components/admin/quick-actions/admin-quick-actions'
export { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline'
export { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects'
export { AdminInboxList } from '@/components/admin/inbox/admin-inbox-list'

export { AdminPermissionDenied } from '@/components/admin/states/admin-permission-denied'
export { AdminSkeletonBlock } from '@/components/admin/states/admin-skeleton-block'
