import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AdminEntityDetailShell,
  AdminStatusSummaryRow,
} from '@/components/admin/entity/admin-entity-detail-shell.tsx'
import { AdminQuickActions } from '@/components/admin/quick-actions/admin-quick-actions.tsx'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { quickActionsForEntity } from '@/domain/admin/actions/quick-action-catalogue.ts'
import { relatedObjectsForOpportunity } from '@/domain/admin/read-models/related-objects-adapter.ts'
import { buildOpportunityTimeline } from '@/domain/admin/read-models/timeline-adapter.ts'
import { opportunityRepository } from '@/repositories/index.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatOpportunityPresentation } from '@/lib/enterprise-display.ts'
import { formatDate } from '@/lib/format'
import { runRerunMatchingUiAction } from '@/lib/run-rerun-matching-ui-action.ts'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmEmptyState, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { toast } from 'sonner'

/** Read-only admin opportunity inspector — no lifecycle mutations invented here. */
export function AdminOpportunityDetailPage() {
  const { id } = useParams()
  const { user: actor } = useAuth()
  const version = useDataStoreVersion()

  const opportunity = useMemo(
    () => (id ? opportunityRepository.getById(id) : undefined),
    [id, version],
  )
  const related = useMemo(() => (id ? relatedObjectsForOpportunity(id) : []), [id, version])
  const timeline = useMemo(() => (id ? buildOpportunityTimeline(id) : []), [id, version])
  const actions = quickActionsForEntity('opportunity')

  function handleAction(actionId: string): void {
    switch (actionId) {
      case 'opportunity.moderate':
        toast.message('Open Moderation queue to moderate this opportunity')
        window.location.assign('/admin/moderation')
        break
      case 'opportunity.unpublish':
        toast.message('Use Moderation / Matching surfaces for publish controls')
        break
      case 'opportunity.rerun_matching': {
        if (!id) break
        const result = runRerunMatchingUiAction(id, {
          userId: actor?.id,
          userRole: actor?.role,
        })
        if (!result.success) {
          toast.error(result.message)
          break
        }
        const discovered =
          result.discoveredMatchesCount + result.circularDiscoveredMatchesCount
        const skipped =
          result.skippedDuplicatesCount + result.circularSkippedDuplicatesCount
        const errors = [
          ...result.matchingErrors,
          ...result.circularMatchingErrors,
        ]
        if (discovered > 0) {
          toast.success(
            `Matching re-run: ${discovered} new match${discovered === 1 ? '' : 'es'} discovered` +
              (skipped > 0 ? ` (${skipped} skipped)` : ''),
          )
        } else if (skipped > 0) {
          toast.message(`Matching re-run: no new matches (${skipped} duplicates skipped)`)
        } else {
          toast.message('Matching re-run: no matches discovered')
        }
        if (errors.length > 0) {
          toast.warning(`${errors.length} matching error(s) during re-run`)
        }
        break
      }
      case 'opportunity.open_timeline':
      case 'opportunity.open_audit':
        window.location.assign('/admin/audit')
        break
      case 'opportunity.open_related':
        break
      case 'opportunity.open_post_matches':
        window.location.assign('/admin/post-matches')
        break
      default:
        toast.message('Action not wired in Demo/UAT yet')
    }
  }

  if (!opportunity) {
    return (
      <PmPage header={<PmPageHeader title="Opportunity detail" />}>
        <PmEmptyState title="Opportunity not found" size="compact" />
      </PmPage>
    )
  }

  const presentation = formatOpportunityPresentation(opportunity)
  const title = presentation.name

  return (
    <AdminEntityDetailShell
      label="Marketplace"
      title={title}
      description={presentation.reference}
      statusBadge={<AdminStatusBadge status={String(opportunity.status ?? 'unknown')} />}
      statusSummary={
        <AdminStatusSummaryRow
          items={[
            {
              label: 'Status',
              value: <AdminStatusBadge status={String(opportunity.status ?? 'unknown')} />,
            },
            {
              label: 'Reference Number',
              value: presentation.reference,
            },
            {
              label: 'Visibility',
              value: String(opportunity.visibilityStatus ?? '—'),
            },
            {
              label: 'Updated',
              value: opportunity.updatedAt ? formatDate(opportunity.updatedAt) : '—',
            },
            {
              label: 'Creator',
              value: opportunity.creatorId ? (
                <Link
                  to={`/admin/users/${opportunity.creatorId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Open creator
                </Link>
              ) : (
                '—'
              ),
            },
          ]}
        />
      }
      primaryActions={
        <AdminQuickActions
          actions={actions}
          onAction={handleAction}
          hasPermission={(cap) => hasAdminCapability(actor?.role, cap as never)}
        />
      }
      overview={
        <PmFormReadonly>
          <PmFormReadonlySection title="Overview" description="Admin opportunity inspector">
            <PmFormReadonlyField label="Opportunity Name" value={title} />
            <PmFormReadonlyField label="Reference Number" value={presentation.reference} />
            <PmFormReadonlyField
              label="Collaboration model"
              value={String(opportunity.mainCollaborationModel ?? opportunity.modelType ?? '—')}
            />
            <PmFormReadonlyField
              label="Exchange mode"
              value={String(opportunity.exchangeMode ?? '—')}
            />
            <PmFormReadonlyField
              label="Location"
              value={String(opportunity.location ?? opportunity.city ?? opportunity.country ?? '—')}
            />
            <PmFormReadonlyField
              label="Created"
              value={opportunity.createdAt ? formatDate(opportunity.createdAt) : null}
            />
          </PmFormReadonlySection>
        </PmFormReadonly>
      }
      timeline={<AdminUniversalTimeline events={timeline} title="Timeline" />}
      related={<AdminRelatedObjects groups={related} title="Related objects" />}
      audit={
        <PmFormReadonly>
          <PmFormReadonlySection title="Audit">
            <PmFormReadonlyField label="Open audit">
              <Link to="/admin/audit" className="text-primary underline-offset-4 hover:underline">
                Platform audit log
              </Link>
            </PmFormReadonlyField>
          </PmFormReadonlySection>
        </PmFormReadonly>
      }
    />
  )
}
