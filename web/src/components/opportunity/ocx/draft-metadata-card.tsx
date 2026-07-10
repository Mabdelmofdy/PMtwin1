import { OcxSummaryCard } from '@/components/opportunity/ocx/ocx-summary-card.tsx'
import { formatDate } from '@/lib/format'

export type DraftMetadataCardProps = {
  readonly status?: string
  readonly createdAt?: string
  readonly updatedAt?: string
  readonly ownerLabel?: string
  readonly lastValidationLabel?: string
  readonly lastReadinessLabel?: string
  readonly versionLabel?: string
  readonly state?: 'loading' | 'empty' | 'normal' | 'error'
}

/** Display-only draft metadata for Opportunity Detail. */
export function DraftMetadataCard({
  status,
  createdAt,
  updatedAt,
  ownerLabel,
  lastValidationLabel,
  lastReadinessLabel,
  versionLabel,
  state = 'normal',
}: DraftMetadataCardProps) {
  return (
    <OcxSummaryCard
      title="Draft metadata"
      why="Owners need timestamps and ownership context without opening system tooling."
      state={state}
      testId="draft-metadata-card"
    >
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{status || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Owner party</dt>
          <dd className="font-medium">{ownerLabel || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created at</dt>
          <dd className="font-medium">{createdAt ? formatDate(createdAt) : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated at</dt>
          <dd className="font-medium">{updatedAt ? formatDate(updatedAt) : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last validation</dt>
          <dd className="font-medium">{lastValidationLabel || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last readiness</dt>
          <dd className="font-medium">{lastReadinessLabel || '—'}</dd>
        </div>
        {versionLabel ? (
          <div>
            <dt className="text-muted-foreground">Draft / copy</dt>
            <dd className="font-medium">{versionLabel}</dd>
          </div>
        ) : null}
      </dl>
    </OcxSummaryCard>
  )
}
