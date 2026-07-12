import { Link } from 'react-router-dom'
import { PanelRight } from 'lucide-react'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import { OpportunityReadinessCard } from '@/components/readiness'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { PmBadge, PmButton } from '@/components/ui/pm-index'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import type { OpportunityDetailsActionHandlers } from '../header/opportunity-executive-header.tsx'
import { OpportunityHealthCard } from './opportunity-health-card.tsx'

function CommandCenterBody({
  handlers,
}: {
  readonly handlers: OpportunityDetailsActionHandlers
}) {
  const { model, setWorkspace } = useOpportunityDetailsContext()
  const { capabilities, nextAction, kpis, related, history, readiness, opportunity } = model

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className={cn(pmTypography.label)}>Quick Actions</h3>
        <div className="flex flex-col gap-2">
          {capabilities.canPublish ? (
            <PmButton size="sm" onClick={() => handlers.onPublish?.()}>
              Publish
            </PmButton>
          ) : null}
          {capabilities.canEdit ? (
            <PmButton size="sm" variant="outline" asChild>
              <Link to={`/opportunities/${opportunity.id}/edit`}>Edit</Link>
            </PmButton>
          ) : null}
          {capabilities.canOpenMatching ? (
            <PmButton
              size="sm"
              variant="outline"
              onClick={() => setWorkspace('matching')}
            >
              Open Matching
            </PmButton>
          ) : null}
          {capabilities.canOpenMarketplace ? (
            <PmButton
              size="sm"
              variant="outline"
              onClick={() => setWorkspace('marketplace')}
            >
              Open Marketplace
            </PmButton>
          ) : null}
          {capabilities.canDuplicateDraft ? (
            <PmButton size="sm" variant="outline" onClick={() => handlers.onDuplicate?.(false)}>
              Duplicate
            </PmButton>
          ) : null}
          {capabilities.canClose ? (
            <PmButton size="sm" variant="outline" onClick={() => handlers.onClose?.()}>
              Close Opportunity
            </PmButton>
          ) : null}
          {capabilities.canArchive ? (
            <PmButton size="sm" variant="outline" onClick={() => handlers.onArchive?.()}>
              Archive
            </PmButton>
          ) : null}
          {capabilities.canDeleteDraft ? (
            <PmButton size="sm" variant="destructive" onClick={() => handlers.onDeleteDraft?.()}>
              Delete Draft
            </PmButton>
          ) : null}
        </div>
      </section>

      <OpportunityHealthCard />

      {capabilities.canViewReadinessDetails ? (
        <section className="space-y-2">
          <h3 className={cn(pmTypography.label)}>Readiness</h3>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className={cn(pmTypography.h1, 'text-foreground')}>
              {formatReadinessScorePercent(kpis.readiness.score)}
            </p>
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              {kpis.readiness.healthLabel}
            </p>
            <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
              {kpis.readiness.blockersCount} required · {kpis.readiness.recommendationsCount}{' '}
              recommendations
            </p>
            <PmButton
              size="sm"
              variant="link"
              className="mt-1 h-auto px-0"
              onClick={() => {
                trackOcxEvent('opportunity_readiness_opened', {
                  opportunityId: opportunity.id,
                })
                setWorkspace('overview')
              }}
            >
              View Details
            </PmButton>
          </div>
          <OpportunityReadinessCard
            opportunity={opportunity}
            opportunityId={opportunity.id}
            result={readiness}
            suppressCta={!capabilities.canEdit}
          />
        </section>
      ) : null}

      {nextAction ? (
        <section className="space-y-2">
          <h3 className={cn(pmTypography.label)}>Next Best Action</h3>
          <div className="rounded-lg border border-border/60 p-3">
            <p className={cn(pmTypography.label)}>{nextAction.title}</p>
            <p className={cn(pmTypography.bodySm, 'mt-1 text-muted-foreground')}>
              {nextAction.context}
            </p>
            {nextAction.actionId === 'publish' ? (
              <PmButton size="sm" className="mt-3" onClick={() => handlers.onPublish?.()}>
                {nextAction.primaryLabel}
              </PmButton>
            ) : nextAction.href ? (
              <PmButton size="sm" className="mt-3" asChild>
                <Link to={nextAction.href}>{nextAction.primaryLabel}</Link>
              </PmButton>
            ) : null}
          </div>
        </section>
      ) : null}

      {capabilities.canViewRelatedObjects ? (
        <section className="space-y-2">
          <h3 className={cn(pmTypography.label)}>Related Objects</h3>
          <div className="flex flex-wrap gap-1.5">
            <PmBadge tone="muted">{related.matches.length} Matches</PmBadge>
            <PmBadge tone="muted">{related.negotiations.length} Negotiations</PmBadge>
            <PmBadge tone="muted">{related.agreements.length} Agreements</PmBadge>
            <PmBadge tone="muted">{related.contracts.length} Contracts</PmBadge>
          </div>
          <PmButton size="sm" variant="link" className="h-auto px-0" onClick={() => setWorkspace('related')}>
            Open Related
          </PmButton>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-2">
          <h3 className={cn(pmTypography.label)}>Recent Activity</h3>
          <ul className="space-y-2">
            {history.slice(0, 3).map((event) => (
              <li key={event.id}>
                <p className={cn(pmTypography.label)}>{event.label}</p>
                {event.timestampLabel ? (
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {event.timestampLabel}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-1">
        <h3 className={cn(pmTypography.label)}>Analytics</h3>
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
          Marketplace analytics are not available in this environment.
        </p>
      </section>
    </div>
  )
}

export function OpportunityCommandCenter({
  handlers,
}: {
  readonly handlers: OpportunityDetailsActionHandlers
}) {
  const { model } = useOpportunityDetailsContext()
  if (!model.workspaceVisibility.showCommandCenter) return null

  return (
    <>
      {/* Desktop sticky rail */}
      <div
        data-slot="opportunity-command-center"
        className="hidden lg:block"
      >
        <div className="sticky top-20 space-y-3">
          <h2 className={cn(pmTypography.h3)}>Command Center</h2>
          <CommandCenterBody handlers={handlers} />
        </div>
      </div>

      {/* Tablet / mobile sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <PmButton
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() =>
                trackOcxEvent('opportunity_command_center_opened', {
                  opportunityId: model.opportunity.id,
                })
              }
            >
              <PanelRight className="size-3.5" aria-hidden />
              Command Center
            </PmButton>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] w-full overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Command Center</SheetTitle>
            </SheetHeader>
            <div className="mt-4 px-1 pb-6">
              <CommandCenterBody handlers={handlers} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
