/**
 * Real activity timeline for Opportunity Details.
 * Sources: opportunity metadata, audit entries, matches, related lifecycle objects.
 * Never fabricates business events.
 */

import type { AuditEntry, Opportunity } from '@/types/domain.ts'
import { formatDate } from '@/lib/format.ts'

export type OpportunityHistoryEvent = {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly timestamp?: string
  readonly timestampLabel?: string
  readonly kind:
    | 'created'
    | 'updated'
    | 'published'
    | 'archived'
    | 'deleted'
    | 'status_changed'
    | 'match'
    | 'negotiation'
    | 'agreement'
    | 'contract'
    | 'audit'
    | 'visibility'
}

function sortKey(event: OpportunityHistoryEvent): number {
  if (!event.timestamp) return 0
  const ms = Date.parse(event.timestamp)
  return Number.isNaN(ms) ? 0 : ms
}

function dedupeKey(event: OpportunityHistoryEvent): string {
  return `${event.kind}:${event.label}:${event.timestamp ?? ''}:${event.description ?? ''}`
}

export function buildOpportunityDetailsHistory(input: {
  readonly opportunity: Opportunity
  readonly auditEntries?: readonly AuditEntry[]
  readonly matchCount?: number
  readonly negotiationCount?: number
  readonly agreementCount?: number
  readonly contractCount?: number
  readonly includeAuditorMetadata?: boolean
}): readonly OpportunityHistoryEvent[] {
  const { opportunity } = input
  const events: OpportunityHistoryEvent[] = []

  if (opportunity.createdAt) {
    events.push({
      id: 'meta-created',
      label: 'Opportunity created',
      timestamp: opportunity.createdAt,
      timestampLabel: formatDate(opportunity.createdAt),
      kind: 'created',
    })
  }

  if (
    opportunity.updatedAt
    && opportunity.updatedAt !== opportunity.createdAt
  ) {
    events.push({
      id: 'meta-updated',
      label: 'Opportunity updated',
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'updated',
    })
  }

  const status = (opportunity.status ?? '').toLowerCase()
  if (status === 'published' || [
    'matched',
    'negotiating',
    'contracted',
    'executing',
    'completed',
  ].includes(status)) {
    events.push({
      id: 'meta-published',
      label: 'Published',
      description: 'Opportunity is visible according to its visibility rules.',
      timestamp: opportunity.updatedAt ?? opportunity.createdAt,
      timestampLabel: formatDate(opportunity.updatedAt ?? opportunity.createdAt),
      kind: 'published',
    })
  }

  const visibility = (opportunity.visibilityStatus ?? '').toLowerCase()
  if (visibility === 'archived') {
    events.push({
      id: 'meta-archived',
      label: 'Archived',
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'archived',
    })
  } else if (visibility === 'closed' || visibility === 'withdrawn') {
    events.push({
      id: 'meta-visibility',
      label: visibility === 'withdrawn' ? 'Withdrawn' : 'Visibility closed',
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'visibility',
    })
  }

  for (const entry of input.auditEntries ?? []) {
    if (entry.entityId !== opportunity.id) continue
    const action = (entry.action ?? '').toLowerCase()
    let label = entry.action ?? 'Audit event'
    let kind: OpportunityHistoryEvent['kind'] = 'audit'
    if (action.includes('created')) {
      label = 'Opportunity created'
      kind = 'created'
    } else if (action.includes('updated')) {
      label = 'Opportunity updated'
      kind = 'updated'
    } else if (action.includes('archived')) {
      label = 'Archived'
      kind = 'archived'
    } else if (action.includes('deleted')) {
      label = 'Deleted'
      kind = 'deleted'
    } else if (action.includes('status')) {
      label = 'Status changed'
      kind = 'status_changed'
    }

    events.push({
      id: `audit-${entry.id}`,
      label,
      description: input.includeAuditorMetadata
        ? [
            entry.userId ? `Actor: ${entry.userId}` : null,
            entry.requestId ? `Request: ${entry.requestId}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        : undefined,
      timestamp: entry.timestamp,
      timestampLabel: formatDate(entry.timestamp),
      kind,
    })
  }

  if ((input.matchCount ?? 0) > 0) {
    events.push({
      id: 'related-matches',
      label: 'Matches discovered',
      description: `${input.matchCount} related match${input.matchCount === 1 ? '' : 'es'}`,
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'match',
    })
  }

  if ((input.negotiationCount ?? 0) > 0) {
    events.push({
      id: 'related-negotiations',
      label: 'Negotiation started',
      description: `${input.negotiationCount} negotiation${input.negotiationCount === 1 ? '' : 's'}`,
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'negotiation',
    })
  }

  if ((input.agreementCount ?? 0) > 0) {
    events.push({
      id: 'related-agreements',
      label: 'Commercial Agreement created',
      description: `${input.agreementCount} agreement${input.agreementCount === 1 ? '' : 's'}`,
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'agreement',
    })
  }

  if ((input.contractCount ?? 0) > 0) {
    events.push({
      id: 'related-contracts',
      label: 'Contract created',
      description: `${input.contractCount} contract${input.contractCount === 1 ? '' : 's'}`,
      timestamp: opportunity.updatedAt,
      timestampLabel: formatDate(opportunity.updatedAt),
      kind: 'contract',
    })
  }

  const seen = new Set<string>()
  const deduped: OpportunityHistoryEvent[] = []
  for (const event of events.sort((a, b) => sortKey(b) - sortKey(a))) {
    const key = dedupeKey(event)
    if (seen.has(key)) continue
    // Prefer audit/meta created/updated once
    if (
      (event.kind === 'created' || event.kind === 'updated')
      && [...seen].some((k) => k.startsWith(`${event.kind}:`))
    ) {
      continue
    }
    seen.add(key)
    deduped.push(event)
  }

  return deduped
}
