import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { partiesApi } from '@/api/parties.ts'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { relatedObjectsForParty } from '@/domain/admin/read-models/related-objects-adapter.ts'
import { auditRepository } from '@/repositories/index.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmPage, PmPageHeader, PmEmptyState } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import type { AdminTimelineEvent } from '@/domain/admin/read-models/types.ts'

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
      if (entry.entityId !== id) continue
      events.push({
        id: `audit-${entry.id}`,
        kind: 'audit',
        timestamp: entry.timestamp ?? new Date(0).toISOString(),
        sequence: seq++,
        title: entry.action,
        actorId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        href: '/admin/audit',
      })
    }
    return [...events].sort(
      (a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0),
    )
  }, [id, party, version])

  if (!party) {
    return (
      <PmPage header={<PmPageHeader title="Party detail" />}>
        <PmEmptyState title="Party not found" size="compact" />
      </PmPage>
    )
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          title={party.displayName}
          description={`${party.partyType} · ${party.id}`}
        />
      }
    >
      <PmFormReadonly>
        <PmFormReadonlySection title="Overview">
          <PmFormReadonlyField label="Party ID" value={party.id} />
          <PmFormReadonlyField label="Type" value={party.partyType} />
          <PmFormReadonlyField label="Status">
            <AdminStatusBadge status={party.status} />
          </PmFormReadonlyField>
          <PmFormReadonlyField
            label="Updated"
            value={party.updatedAt ? formatDate(party.updatedAt) : null}
          />
        </PmFormReadonlySection>
      </PmFormReadonly>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminRelatedObjects groups={related} />
        <AdminUniversalTimeline events={timeline} />
      </div>
    </PmPage>
  )
}
