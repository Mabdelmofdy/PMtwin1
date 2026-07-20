import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import {
  buildCommandCenterSummary,
  buildOperationsSummary,
  buildPipelineSummary,
  buildPlatformHealthSummary,
  buildRecentOperations,
  buildRiskSummary,
} from '@/domain/admin/read-models/command-center-adapter.ts'
import { AdminKpiStrip } from '@/components/admin/workspace/admin-kpi-strip.tsx'
import {
  buildReadinessAnalytics,
  createCreatorProfileResolver,
} from '@/domain/readiness-analytics/index.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
import { adminApi } from '@/api/admin.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminRequiresActionPanel } from '@/components/admin/command-center/admin-requires-action-panel.tsx'
import { AdminPlatformHealthPanel } from '@/components/admin/command-center/admin-platform-health-panel.tsx'
import { AdminPipelinePanel } from '@/components/admin/command-center/admin-pipeline-panel.tsx'
import { AdminRiskSeverityPanel } from '@/components/admin/command-center/admin-risk-severity-panel.tsx'
import { AdminRecentOperations } from '@/components/admin/command-center/admin-recent-operations.tsx'
import {
  PmContentCard,
  PmMetricGrid,
  formatPlatformHealthMetric,
} from '@/components/layout/pm-layout-index'
import {
  PmBadge,
  PmPage,
  PmPageActions,
  PmPageHeader,
  PmStatCard,
} from '@/components/ui/pm-index'
import { MATCHING_MODELS, MATCHING_MODEL_KEYS } from '@/config/need-offer-framework.ts'
import { cn } from '@/lib/utils'
import { pmTypography, resolveMatchTypeStyle } from '@/tokens'

export function AdminExecutivePage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()

  useEffect(() => {
    adminApi.syncVettingSla()
  }, [])

  const summary = useMemo(() => buildCommandCenterSummary(), [version])
  const ops = useMemo(() => buildOperationsSummary(), [version])
  const health = useMemo(() => buildPlatformHealthSummary(), [version])
  const pipeline = useMemo(() => buildPipelineSummary(), [version])
  const risk = useMemo(() => buildRiskSummary(), [version])
  const recentOps = useMemo(() => buildRecentOperations(8), [version])

  const readinessAnalytics = useMemo(() => {
    const profiles = peopleApi.listAll().map((person) => ({
      profile: person.profile,
      profileKind: person.profile?.type === 'company' ? 'company' as const : 'individual' as const,
    }))
    return buildReadinessAnalytics({
      profiles,
      opportunities: opportunitiesApi.list(),
      resolveProfileForOpportunity: createCreatorProfileResolver((id) => peopleApi.get(id)),
    })
  }, [version])

  const matchingQuality = useMemo(() => {
    const profiles = peopleApi.listAll().map((person) => ({
      profile: person.profile,
      profileKind: person.profile?.type === 'company' ? 'company' as const : 'individual' as const,
    }))
    return buildMatchingQualityAnalytics({
      profiles,
      opportunities: opportunitiesApi.list(),
      matches: matchesApi.list(),
      negotiations: negotiationsApi.list(),
      deals: dealsApi.list(),
    })
  }, [version])

  const platformHealth = formatPlatformHealthMetric(
    readinessAnalytics.profiles.averageScore,
    matchingQuality.averageMatchScore,
  )

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Command Center"
          title="Executive Command Center"
          description="What needs attention, what is at risk, and where to intervene next."
          badges={
            <>
              <PmBadge tone="success">{platformHealth}</PmBadge>
              <PmBadge tone="info">{Math.round(readinessAnalytics.profiles.averageScore)}% readiness</PmBadge>
              <PmBadge tone="info">{Math.round(matchingQuality.averageMatchScore)}% match quality</PmBadge>
              {summary.pendingVetting > 0 ? (
                <PmBadge tone="warning">{summary.pendingVetting} pending vetting</PmBadge>
              ) : null}
              <PmBadge tone="muted">{summary.environment}</PmBadge>
            </>
          }
          actions={
            <PmPageActions
              primary={{ label: 'Run matching', href: '/admin/matching' }}
              more={[
                { id: 'ops', label: 'Operations', href: '/admin/command-center/operations' },
                { id: 'risk', label: 'Risk & Compliance', href: '/admin/command-center/risk' },
                { id: 'inbox', label: 'Admin Inbox', href: '/admin/inbox' },
                { id: 'vetting', label: 'Review vetting', href: '/admin/vetting' },
                { id: 'audit', label: 'Open audit log', href: '/admin/audit' },
              ]}
            />
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <AdminRequiresActionPanel cards={ops.cards} />

        <AdminPlatformHealthPanel summary={health} />

        <div className="grid gap-4 xl:grid-cols-2">
          <AdminPipelinePanel summary={pipeline} />
          <AdminRiskSeverityPanel summary={risk} />
        </div>

        <AdminRecentOperations items={recentOps} />

        <PmContentCard
          title="Secondary KPIs"
          description="Informational counts — operational queues above take priority."
        >
          <AdminKpiStrip
            items={[
              {
                label: productLanguage.plural('opportunity'),
                value: summary.publishedOpportunities,
                href: '/admin/opportunities',
              },
              { label: 'Users', value: summary.totalUsers, href: '/admin/users' },
              {
                label: 'Active matches',
                value: summary.activeMatches,
                href: '/admin/post-matches',
              },
              {
                label: 'Pending vetting',
                value: summary.pendingVetting,
                href: '/admin/vetting',
              },
            ]}
          />
        </PmContentCard>

        <PmContentCard
          title="Matching models"
          description="Need/Offer topology breakdown from live match data."
        >
          <PmMetricGrid columns={4}>
            {MATCHING_MODEL_KEYS.map((key) => {
              const entry = matchingQuality.byMatchType[key]
              const model = MATCHING_MODELS[key]
              return (
                <Link
                  key={key}
                  to="/admin/matching/quality"
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PmStatCard
                    label={model.label}
                    value={entry.total}
                    hint={`${entry.accepted} accepted · ${entry.confirmed} confirmed`}
                    trend={
                      <span
                        className={cn(
                          pmTypography.badge,
                          'inline-flex items-center rounded-md px-1.5 py-0.5',
                          resolveMatchTypeStyle(key),
                        )}
                      >
                        {model.subtitle}
                      </span>
                    }
                    dense
                  />
                </Link>
              )
            })}
          </PmMetricGrid>
        </PmContentCard>
      </div>
    </PmPage>
  )
}

/** Compatibility alias — prefer AdminExecutivePage. */
export { AdminExecutivePage as AdminDashboardPage }
