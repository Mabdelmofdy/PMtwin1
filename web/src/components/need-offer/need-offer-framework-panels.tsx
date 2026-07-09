import {
  MATCHING_MODELS,
  MATCHING_MODEL_KEYS,
  SEMANTIC_MIRROR_PAIRS,
  USER_JOURNEY_STEPS,
  VALUE_EXCHANGE_MODES,
  formatFrameworkMatchTypeLabel,
  formatFrameworkMatchTypeSubtitle,
} from '@/config/need-offer-framework.ts'
import type { OpportunitySemanticReadModel } from '@/lib/need-offer-semantic-read-model.ts'
import type { MatchTopologyReadModel } from '@/lib/match-topology-read-model.ts'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmTopologyGraph } from '@/components/ui/pm-topology-graph'
import { PmContentCard } from '@/components/layout/pm-layout-panels'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

type NeedOfferMirrorPanelProps = {
  readonly semantic: OpportunitySemanticReadModel
  readonly compact?: boolean
}

export function NeedOfferMirrorPanel({ semantic, compact = false }: NeedOfferMirrorPanelProps) {
  return (
    <PmContentCard
      title="Need / Offer attributes"
      description={
        compact
          ? `${semantic.postTypeLabel} post with framework-aligned fields.`
          : 'Semantic mirroring between Need and Offer post types.'
      }
    >
      <div className="mb-3">
        <PmBadge tone={semantic.postType === 'offer' ? 'success' : 'info'} uppercase>
          {semantic.postTypeLabel}
        </PmBadge>
      </div>

      {!compact ? (
        <div className="mb-4 overflow-x-auto rounded-md border border-border/60">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="px-3 py-2 text-start font-medium">Need</th>
                <th className="px-3 py-2 text-center font-medium" aria-hidden>
                  ↔
                </th>
                <th className="px-3 py-2 text-start font-medium">Offer</th>
              </tr>
            </thead>
            <tbody>
              {SEMANTIC_MIRROR_PAIRS.map((pair) => (
                <tr key={pair.needField} className="border-b last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{pair.needLabel}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground">↔</td>
                  <td className="px-3 py-2 text-muted-foreground">{pair.offerLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <dl className={cn('grid gap-3', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
        {semantic.attributes.map((attr) => (
          <div key={attr.label}>
            <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>{attr.label}</dt>
            <dd className={cn(pmTypography.bodySm, 'font-medium')}>{attr.value}</dd>
          </div>
        ))}
      </dl>
    </PmContentCard>
  )
}

type ValueExchangeModesPanelProps = {
  readonly selectedModes?: readonly string[]
  readonly selectable?: boolean
  readonly onToggle?: (modeKey: string) => void
}

export function ValueExchangeModesPanel({
  selectedModes = [],
  selectable = false,
  onToggle,
}: ValueExchangeModesPanelProps) {
  const normalizedSelected = new Set(
    selectedModes.map((mode) => mode.toLowerCase().replace(/-/g, '_')),
  )

  return (
    <PmContentCard
      title="Value exchange modes"
      description="Five modes defined by the Need/Offer framework."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_EXCHANGE_MODES.map((mode) => {
          const isSelected = normalizedSelected.has(mode.key)
          const content = (
            <>
              <p className={cn(pmTypography.bodySm, 'font-medium')}>{mode.label}</p>
              <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                {mode.description}
              </p>
            </>
          )

          if (selectable) {
            return (
              <button
                key={mode.key}
                type="button"
                className={cn(
                  'rounded-lg border p-3 text-start transition-colors',
                  isSelected
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/30',
                )}
                onClick={() => onToggle?.(mode.key)}
              >
                {content}
              </button>
            )
          }

          return (
            <div
              key={mode.key}
              className={cn(
                'rounded-lg border p-3',
                isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/60',
              )}
            >
              {content}
            </div>
          )
        })}
      </div>
    </PmContentCard>
  )
}

type MatchingModelsReferencePanelProps = {
  /** System-derived topology to highlight — never a user-selected control. */
  readonly selectedModel?: string
  readonly compact?: boolean
  readonly systemDerived?: boolean
}

export function MatchingModelsReferencePanel({
  selectedModel,
  compact = false,
  systemDerived = false,
}: MatchingModelsReferencePanelProps) {
  return (
    <PmContentCard
      title={systemDerived ? 'Recommended Matching Topology' : 'Matching models'}
      description={
        systemDerived
          ? 'System-derived — based on your collaboration model and exchange mode.'
          : 'Four topology models from the Need/Offer framework (reference only).'
      }
    >
      <div
        className={cn('grid gap-2', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}
        role="list"
        aria-label={
          systemDerived
            ? 'System-derived matching topology reference'
            : 'Matching models reference'
        }
      >
        {MATCHING_MODEL_KEYS.map((key) => {
          const model = MATCHING_MODELS[key]
          const isHighlighted = selectedModel?.toLowerCase() === key
          return (
            <div
              key={key}
              role="listitem"
              aria-current={isHighlighted ? 'true' : undefined}
              className={cn(
                'rounded-lg border p-3',
                isHighlighted ? 'border-primary/40 bg-primary/5' : 'border-border/60',
              )}
            >
              <p className={cn(pmTypography.bodySm, 'font-medium')}>{model.label}</p>
              <p className={cn(pmTypography.caption, 'text-primary')}>{model.subtitle}</p>
              {isHighlighted && systemDerived ? (
                <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                  System will match this as {model.label}
                </p>
              ) : null}
              {!compact && !systemDerived ? (
                <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                  {model.description}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </PmContentCard>
  )
}

type UserJourneyStripProps = {
  readonly activeStepId?: string
  readonly compact?: boolean
}

export function UserJourneyStrip({ activeStepId, compact = false }: UserJourneyStripProps) {
  const activeIndex = activeStepId
    ? USER_JOURNEY_STEPS.findIndex((step) => step.id === activeStepId)
    : -1

  return (
    <PmContentCard
      title="Collaboration journey"
      description="End-to-end flow from sign-up through follow-up."
    >
      <ol
        className={cn(
          'flex gap-2',
          compact ? 'flex-wrap' : 'overflow-x-auto pb-1',
        )}
        aria-label="User journey"
      >
        {USER_JOURNEY_STEPS.map((step, index) => {
          const isActive = index === activeIndex
          const isPast = activeIndex >= 0 && index < activeIndex
          return (
            <li
              key={step.id}
              className={cn(
                'shrink-0 rounded-md border px-2 py-1.5 text-xs',
                isActive && 'border-primary bg-primary/10 font-medium text-primary',
                isPast && !isActive && 'border-border/60 bg-muted/30 text-muted-foreground',
                !isActive && !isPast && 'border-border/60 text-muted-foreground',
              )}
            >
              {step.label}
            </li>
          )
        })}
      </ol>
    </PmContentCard>
  )
}

type MatchTopologyDiagramProps = {
  readonly topology: MatchTopologyReadModel
  readonly className?: string
}

export function MatchTopologyDiagram({ topology, className }: MatchTopologyDiagramProps) {
  return (
    <PmContentCard
      title="Match topology"
      description={`${topology.frameworkLabel} — ${topology.frameworkSubtitle}`}
      className={className}
      actions={
        <PmBadge tone="neutral" size="sm">
          {topology.frameworkLabel}
        </PmBadge>
      }
    >
      <PmTopologyGraph
        topology={topology.topology}
        nodes={topology.nodes}
        aria-label={`${topology.frameworkLabel} topology`}
      />
    </PmContentCard>
  )
}

export function FrameworkMatchTypeBadge({
  matchType,
  showSubtitle = false,
}: {
  readonly matchType?: string
  readonly showSubtitle?: boolean
}) {
  return (
    <div className="inline-flex flex-col gap-0.5">
      <PmBadge tone="neutral" size="sm">
        {formatFrameworkMatchTypeLabel(matchType)}
      </PmBadge>
      {showSubtitle ? (
        <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
          {formatFrameworkMatchTypeSubtitle(matchType)}
        </span>
      ) : null}
    </div>
  )
}
