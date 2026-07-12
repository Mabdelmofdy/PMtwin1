import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import { buildCollaborationLayerRows } from '@/lib/opportunity-details'
import { OpportunitySection } from '../shared/opportunity-section.tsx'
import { formatOptionalDate } from '@/lib/opportunity-details'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>{label}</dt>
      <dd className={cn(pmTypography.bodySm, 'text-foreground')}>{String(value)}</dd>
    </div>
  )
}

export function OverviewWorkspace() {
  const { model } = useOpportunityDetailsContext()
  const opp = model.opportunity
  const layers = buildCollaborationLayerRows(model)
  const { scope } = model
  const q = scope.qualifications

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Overview">
      {opp.description ? (
        <OpportunitySection title="Description">
          <p className={cn(pmTypography.body, 'whitespace-pre-wrap text-foreground')}>
            {opp.description}
          </p>
        </OpportunitySection>
      ) : null}

      <OpportunitySection title="Collaboration Summary">
        <dl className="grid gap-3 sm:grid-cols-2">
          {layers.map((row) => (
            <div key={row.label} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
              <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>{row.label}</dt>
              <dd className={cn(pmTypography.label, 'text-foreground')}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </OpportunitySection>

      <OpportunitySection title="Opportunity facts">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Post Type" value={model.collaboration.postIntent} />
          <Field label="Category or profession" value={opp.scope?.sectors?.[0]} />
          <Field label="Target role" value={opp.attributes?.targetRole} />
          <Field label="Owned by" value={model.ownerPartyName ?? model.creatorName} />
          <Field label="Created by" value={model.creatorName} />
          <Field label="Primary location" value={opp.location ?? opp.city} />
          <Field label="Country" value={opp.country} />
          <Field label="Service area" value={scope.serviceArea} />
          <Field label="Delivery method" value={scope.deliveryMethod} />
          <Field
            label="Languages"
            value={scope.languages.length > 0 ? scope.languages.join(', ') : undefined}
          />
          <Field label="Priority" value={scope.priority} />
          <Field label="Preferred partner type" value={scope.preferredPartnerType} />
          <Field label="Experience level" value={q.experienceLevel} />
          <Field
            label="Certifications"
            value={q.certifications.length > 0 ? q.certifications.join(', ') : undefined}
          />
          <Field label="Team size" value={q.teamSize} />
          <Field label="Minimum qualifications" value={q.minimumQualifications} />
          <Field label="Created" value={formatOptionalDate(opp.createdAt)} />
          <Field label="Updated" value={formatOptionalDate(opp.updatedAt)} />
          <Field
            label="Start date"
            value={formatOptionalDate(opp.startDate ?? opp.attributes?.startDate)}
          />
          <Field
            label="Deadline"
            value={formatOptionalDate(
              opp.deliveryDeadline ?? opp.endDate ?? opp.attributes?.tenderDeadline,
            )}
          />
          <Field label="Visibility" value={opp.visibilityStatus} />
          <Field label="Lifecycle" value={model.collaboration.lifecycle} />
        </dl>
      </OpportunitySection>
    </div>
  )
}
