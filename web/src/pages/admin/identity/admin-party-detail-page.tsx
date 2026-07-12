import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { partiesApi } from '@/api/parties.ts'
import {
  AdminEntityDetailShell,
  AdminStatusSummaryRow,
} from '@/components/admin/entity/admin-entity-detail-shell.tsx'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { relatedObjectsForParty } from '@/domain/admin/read-models/related-objects-adapter.ts'
import { auditRepository } from '@/repositories/index.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatPartyPresentation } from '@/lib/enterprise-display.ts'
import { formatDate } from '@/lib/format'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmPage, PmPageHeader, PmEmptyState } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import type { AdminTimelineEvent } from '@/domain/admin/read-models/types.ts'
import { Link } from 'react-router-dom'

export function AdminPartyDetailPage() {
  const { id } = useParams()
  const version = useDataStoreVersion()
  const party = id ? partiesApi.getParty(id) : undefined
  const related = useMemo(
    () => (id ? relatedObjectsForParty(id) : []),
    [id, version],
  )
  const timeline = useMemo((): readonly AdminTimelineEvent[] => {
    if (!id) return []
    const events: AdminTimelineEvent[] = []
    let seq = 0
    if (party?.createdAt) {
      events.push({
        id: `party-created-${id}`,
        kind: 'domain',
        timestamp: party.createdAt,
        sequence: seq++,
        title: 'Party created',
        entityType: 'party',
        entityId: id,
      })
    }
    for (const entry of auditRepository.getAll()) {
      if (entry.entityId !== id && entry.entityType !== 'party') continue
      if (entry.entityId && entry.entityId !== id) continue
      events.push({
        id: entry.id,
        kind: 'audit',
        timestamp: entry.timestamp ?? new Date().toISOString(),
        sequence: seq++,
        title: entry.action,
        entityType: String(entry.entityType ?? 'party'),
        entityId: id,
      })
    }
    return events.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  }, [id, party, version])

  if (!party) {
    return (
      <PmPage header={<PmPageHeader title="Party detail" />}>
        <PmEmptyState title="Party not found" size="compact" />
      </PmPage>
    )
  }

  const presentation = formatPartyPresentation(party)

  return (
    <AdminEntityDetailShell
      label="Identity"
      title={presentation.companyName}
      description={presentation.companyCode}
      statusBadge={<AdminStatusBadge status={party.status} />}
      statusSummary={
        <AdminStatusSummaryRow
          items={[
            { label: 'Status', value: <AdminStatusBadge status={party.status} /> },
            { label: 'Company Code', value: presentation.companyCode },
            { label: 'Type', value: party.partyType },
            {
              label: 'Created',
              value: party.createdAt ? formatDate(party.createdAt) : '—',
            },
            {
              label: 'Memberships',
              value: (
                <Link to="/admin/memberships" className="text-primary underline-offset-4 hover:underline">
                  Open
                </Link>
              ),
            },
          ]}
        />
      }
      overview={
        <PmFormReadonly>
          <PmFormReadonlySection title="Overview">
            <PmFormReadonlyField label="Company Name" value={presentation.companyName} />
            <PmFormReadonlyField label="Company Code" value={presentation.companyCode} />
            <PmFormReadonlyField label="Type" value={party.partyType} />
            <PmFormReadonlyField label="Status">
              <AdminStatusBadge status={party.status} />
            </PmFormReadonlyField>
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
