import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import { PmBadge, PmButton } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import { formatOptionalDate } from '@/lib/opportunity-details'
import type { WorkPackage } from '@/domain/opportunity-creation'

function WorkPackageCard({
  pkg,
  expanded,
  onToggle,
  canEdit,
  opportunityId,
}: {
  readonly pkg: WorkPackage
  readonly expanded: boolean
  readonly onToggle: () => void
  readonly canEdit: boolean
  readonly opportunityId: string
}) {
  const taskCount = pkg.tasks?.length ?? 0
  const deliverableCount = pkg.deliverables?.length ?? 0

  return (
    <article className="rounded-lg border border-border/60 bg-card">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={cn(pmTypography.label, 'text-foreground')}>
              {pkg.title || 'Untitled package'}
            </h4>
            {pkg.packageType ? <PmBadge tone="muted">{pkg.packageType}</PmBadge> : null}
            <PmBadge tone="info">Planning Defined</PmBadge>
          </div>
          {pkg.description ? (
            <p className={cn(pmTypography.bodySm, 'line-clamp-2 text-muted-foreground')}>
              {pkg.description}
            </p>
          ) : null}
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {taskCount} Tasks · {deliverableCount} Deliverables
            {pkg.location ? ` · ${pkg.location}` : ''}
            {pkg.startDate || pkg.deadline
              ? ` · ${[formatOptionalDate(pkg.startDate), formatOptionalDate(pkg.deadline)].filter(Boolean).join(' → ')}`
              : ''}
          </p>
        </div>
        <ChevronDown
          className={cn('mt-1 size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="space-y-4 border-t border-border/50 px-4 py-3">
          {pkg.capacity ? (
            <p className={cn(pmTypography.bodySm)}>Capacity: {pkg.capacity}</p>
          ) : null}
          {pkg.dependencyPackageIds && pkg.dependencyPackageIds.length > 0 ? (
            <p className={cn(pmTypography.bodySm)}>
              Dependencies: {pkg.dependencyPackageIds.join(', ')}
            </p>
          ) : null}
          {pkg.tasks && pkg.tasks.length > 0 ? (
            <div>
              <h5 className={cn(pmTypography.label, 'mb-2')}>Tasks</h5>
              <ul className="space-y-2">
                {pkg.tasks.map((task) => (
                  <li key={task.id} className="rounded-md bg-muted/30 px-3 py-2">
                    <p className={cn(pmTypography.label)}>{task.title}</p>
                    <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                      {[task.priority, task.duration, formatOptionalDate(task.startDate)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {task.acceptanceCriteria ? (
                      <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                        Acceptance: {task.acceptanceCriteria}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {pkg.deliverables.length > 0 ? (
            <div>
              <h5 className={cn(pmTypography.label, 'mb-2')}>Deliverables</h5>
              <ul className="space-y-2">
                {pkg.deliverables.map((d) => (
                  <li key={d.id} className="rounded-md bg-muted/30 px-3 py-2">
                    <p className={cn(pmTypography.label)}>{d.title}</p>
                    <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                      {[d.type, d.quantity != null ? `Qty ${d.quantity}` : null, formatOptionalDate(d.dueDate)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {canEdit ? (
            <PmButton size="sm" variant="outline" asChild>
              <Link to={`/opportunities/${opportunityId}/edit?step=scope`}>Edit scope</Link>
            </PmButton>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function ScopeWorkspace() {
  const { model } = useOpportunityDetailsContext()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (model.workspaceVisibility.scope === 'restricted') {
    return (
      <OpportunityRestrictedState
        title="Restricted scope"
        description="Scope details are available to authorized viewers only."
      />
    )
  }

  const { scope, capabilities, opportunity } = model
  const hasAny =
    scope.workPackages.length > 0
    || scope.skills.length > 0
    || scope.services.length > 0
    || scope.milestones.length > 0
    || scope.compliance.length > 0

  if (!hasAny) {
    return (
      <OpportunityEmptyState
        title="No Work Packages"
        description="No work packages have been defined. Edit this opportunity to add structured packages, tasks, deliverables, and milestones."
        action={
          capabilities.canEdit ? (
            <PmButton size="sm" asChild>
              <Link to={`/opportunities/${opportunity.id}/edit?step=scope`}>Edit opportunity</Link>
            </PmButton>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Scope and Work">
      {(scope.skills.length > 0 || scope.services.length > 0) && (
        <OpportunitySection title="Skills and Services">
          <div className="flex flex-wrap gap-1.5">
            {scope.skills.map((skill) => (
              <PmBadge key={skill.name} tone={skill.mandatory ? 'info' : 'muted'}>
                {skill.name}
                {skill.level ? ` · ${skill.level}` : ''}
                {skill.mandatory ? ' · Required' : ' · Preferred'}
              </PmBadge>
            ))}
            {scope.services.map((service) => (
              <PmBadge key={service} tone="muted">
                {service}
              </PmBadge>
            ))}
          </div>
        </OpportunitySection>
      )}

      {(scope.resources.length > 0 || scope.capacity || scope.preferredPartnerType) && (
        <OpportunitySection title="Resources and Capacity">
          <dl className="grid gap-2 sm:grid-cols-2">
            {scope.preferredPartnerType ? (
              <div>
                <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Preferred partner</dt>
                <dd className={cn(pmTypography.bodySm)}>{scope.preferredPartnerType}</dd>
              </div>
            ) : null}
            {scope.capacity?.required != null ? (
              <div>
                <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Required capacity</dt>
                <dd className={cn(pmTypography.bodySm)}>{scope.capacity.required}</dd>
              </div>
            ) : null}
            {scope.capacity?.available != null ? (
              <div>
                <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Available capacity</dt>
                <dd className={cn(pmTypography.bodySm)}>{scope.capacity.available}</dd>
              </div>
            ) : null}
          </dl>
          {scope.resources.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              {scope.resources.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </OpportunitySection>
      )}

      <OpportunitySection title="Work Packages">
        <div className="space-y-3">
          {scope.workPackages.map((pkg) => (
            <WorkPackageCard
              key={pkg.id}
              pkg={pkg}
              expanded={expandedId === pkg.id}
              canEdit={capabilities.canEdit}
              opportunityId={opportunity.id}
              onToggle={() => {
                const next = expandedId === pkg.id ? null : pkg.id
                setExpandedId(next)
                if (next) {
                  trackOcxEvent('opportunity_scope_package_expanded', {
                    opportunityId: opportunity.id,
                    workPackageId: pkg.id,
                  })
                }
              }}
            />
          ))}
        </div>
      </OpportunitySection>

      {scope.milestones.length > 0 ? (
        <OpportunitySection title="Milestones">
          <ol className="relative space-y-4 border-s border-border ps-4">
            {scope.milestones.map((ms) => (
              <li key={ms.id} className="relative">
                <span
                  className="absolute -start-[1.3rem] top-1 size-2.5 rounded-full bg-primary"
                  aria-hidden
                />
                <p className={cn(pmTypography.label)}>{ms.title}</p>
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  {[formatOptionalDate(ms.targetDate), ms.paymentTrigger ? 'Payment trigger' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {ms.completionCriteria ? (
                  <p className={cn(pmTypography.bodySm, 'mt-1 text-muted-foreground')}>
                    {ms.completionCriteria}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </OpportunitySection>
      ) : null}

      {(opportunity.location || model.kpis.timeline.startDate) && (
        <OpportunitySection title="Timeline and Locations">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Location</dt>
              <dd className={cn(pmTypography.bodySm)}>{opportunity.location ?? opportunity.city ?? '—'}</dd>
            </div>
            <div>
              <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Delivery mode</dt>
              <dd className={cn(pmTypography.bodySm)}>{opportunity.workMode ?? '—'}</dd>
            </div>
            <div>
              <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Start</dt>
              <dd className={cn(pmTypography.bodySm)}>{model.kpis.timeline.startDate ?? '—'}</dd>
            </div>
            <div>
              <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Deadline</dt>
              <dd className={cn(pmTypography.bodySm)}>{model.kpis.timeline.deadline ?? '—'}</dd>
            </div>
          </dl>
        </OpportunitySection>
      )}

      {scope.compliance.length > 0 ? (
        <OpportunitySection title="Compliance Requirements">
          <ul className="list-inside list-disc text-sm">
            {scope.compliance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </OpportunitySection>
      ) : null}
    </div>
  )
}
