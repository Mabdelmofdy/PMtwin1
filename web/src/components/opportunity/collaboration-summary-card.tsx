import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { OcxSummaryCard } from '@/components/opportunity/ocx/ocx-summary-card.tsx'

export type CollaborationSummaryCardProps = {
  readonly intent?: string
  readonly mainModelLabel?: string
  readonly subModelLabel?: string
  readonly exchangeModeLabel?: string
  readonly topologyLabel?: string
  readonly relationshipLabel?: string
  readonly readyToPublish?: boolean
  readonly compact?: boolean
  readonly state?: 'loading' | 'empty' | 'normal' | 'error'
}

/**
 * Fixed collaboration chain — visual reference for wizard Review, Smart Panel, and Detail.
 * Display only; no matching or commercial mutations.
 */
export function CollaborationSummaryCard({
  intent,
  mainModelLabel,
  subModelLabel,
  exchangeModeLabel,
  topologyLabel,
  relationshipLabel,
  readyToPublish,
  compact = false,
  state,
}: CollaborationSummaryCardProps) {
  const chain = [
    intent || 'Need / Offer',
    mainModelLabel || 'Main model',
    subModelLabel || 'Sub-model',
    exchangeModeLabel || 'Exchange',
    topologyLabel || 'Match type',
    relationshipLabel || 'Party relationship',
    readyToPublish ? 'Ready to Publish' : 'Drafting',
  ]

  const resolvedState =
    state ??
    (mainModelLabel || subModelLabel || intent ? 'normal' : 'empty')

  return (
    <OcxSummaryCard
      title="Collaboration summary"
      description={compact ? undefined : 'Your collaboration model at a glance.'}
      why="Matching and commercial teams use this chain to understand the intended deal shape."
      state={resolvedState}
      emptyTitle="Select a collaboration model"
      emptyDescription="Choose Need/Offer, main model, sub-model, and exchange to build this chain."
      testId="collaboration-summary-card"
    >
      <ol
        className={cn(
          'flex flex-col',
          compact ? 'gap-1' : 'gap-2',
        )}
        aria-label="Collaboration chain"
      >
        {chain.map((item, index) => (
          <li key={`${item}-${index}`} className="flex flex-col items-start">
            <span
              className={cn(
                'rounded-md border border-border/70 bg-surface-muted px-2 py-1 font-medium',
                compact ? pmTypography.caption : pmTypography.bodySm,
              )}
            >
              {item}
            </span>
            {index < chain.length - 1 ? (
              <span
                className="px-2 py-0.5 text-muted-foreground"
                aria-hidden
              >
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </OcxSummaryCard>
  )
}
