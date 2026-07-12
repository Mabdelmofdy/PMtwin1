import { Link } from 'react-router-dom'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import type { CommercialComponent } from '@/domain/opportunity-commercial-structure'
import { commercialComponentLabel } from '@/domain/opportunity-commercial-structure'
import { PmBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import { useEffect } from 'react'

function Field({ label, value }: { label: string; value?: string | number | null | boolean }) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>{label}</dt>
      <dd className={cn(pmTypography.bodySm, 'text-foreground')}>{String(value)}</dd>
    </div>
  )
}

function ComponentDetails({
  component,
  showAmounts,
  workPackageTitles,
}: {
  readonly component: CommercialComponent
  readonly showAmounts: boolean
  readonly workPackageTitles: Map<string, string>
}) {
  const applicability = [
    ...(component.appliesTo === 'entire_opportunity' ? ['Entire opportunity'] : []),
    ...(component.applicableWorkPackageIds ?? []).map(
      (id) => workPackageTitles.get(id) ?? `Work Package ${id}`,
    ),
    ...(component.applicableTaskIds?.length
      ? [`${component.applicableTaskIds.length} tasks`]
      : []),
    ...(component.applicableDeliverableIds?.length
      ? [`${component.applicableDeliverableIds.length} deliverables`]
      : []),
    ...(component.applicableMilestoneIds?.length
      ? [`${component.applicableMilestoneIds.length} milestones`]
      : []),
  ]

  return (
    <article className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className={cn(pmTypography.label)}>
          {component.title || commercialComponentLabel(component.type)}
        </h4>
        <PmBadge tone="muted">{commercialComponentLabel(component.type)}</PmBadge>
        {!component.enabled ? <PmBadge tone="warning">Disabled</PmBadge> : null}
      </div>

      <dl className="grid gap-2 sm:grid-cols-2">
        {component.type === 'cash' ? (
          <>
            <Field label="Currency" value={component.currency} />
            <Field label="Budget type" value={component.budgetType} />
            {showAmounts ? <Field label="Fixed amount" value={component.fixedAmount} /> : null}
            {showAmounts && component.minimumAmount != null ? (
              <Field
                label="Range"
                value={`${component.minimumAmount} – ${component.maximumAmount ?? '—'}`}
              />
            ) : null}
            {showAmounts ? <Field label="Advance %" value={component.advancePercentage} /> : null}
            {showAmounts ? <Field label="Retention %" value={component.retentionPercentage} /> : null}
            <Field label="VAT handling" value={component.vatHandling} />
            <Field label="Payment terms" value={component.paymentTerms} />
            <Field label="Payment frequency" value={component.paymentFrequency} />
          </>
        ) : null}

        {component.type === 'barter' ? (
          <>
            <Field label="Offered" value={component.offeredAssetOrService} />
            <Field label="Requested" value={component.requestedAssetOrService} />
            {showAmounts ? <Field label="Estimated value" value={component.estimatedValue} /> : null}
            <Field label="Exchange ratio" value={component.exchangeRatio} />
            <Field label="Quantity" value={component.quantity} />
            <Field label="Condition" value={component.condition} />
            <Field label="Delivery" value={component.deliveryLocation ?? component.deliveryDate} />
            <Field
              label="Inspection"
              value={
                component.inspectionRequirement
                  ? component.inspectionMethod ?? 'Required'
                  : undefined
              }
            />
            <Field label="Warranty" value={component.warranty} />
            <Field label="Valuation method" value={component.valuationMethod} />
          </>
        ) : null}

        {component.type === 'profit_sharing' ? (
          <>
            {showAmounts ? <Field label="Percentage" value={component.profitSharePercentage} /> : null}
            <Field label="Basis" value={component.grossOrNet} />
            <Field label="Calculation basis" value={component.calculationBasis} />
            <Field label="Eligible costs" value={component.eligibleCosts} />
            <Field label="Excluded costs" value={component.excludedCosts} />
            <Field label="Distribution" value={component.distributionFrequency} />
            <Field label="Reporting" value={component.reportingRequirements} />
            <Field label="Audit rights" value={component.auditRights} />
            {showAmounts ? <Field label="Minimum guarantee" value={component.minimumGuarantee} /> : null}
            {showAmounts ? <Field label="Cap" value={component.maximumCap} /> : null}
            <Field label="Loss treatment" value={component.lossTreatment} />
            <Field label="Exit terms" value={component.exitConditions} />
          </>
        ) : null}

        {component.type === 'revenue_sharing' ? (
          <>
            {showAmounts ? <Field label="Percentage" value={component.revenueSharePercentage} /> : null}
            <Field label="Revenue definition" value={component.revenueDefinition} />
            <Field label="Basis" value={component.grossOrNet} />
            <Field label="Collection" value={component.collectionResponsibility} />
            <Field label="Distribution cycle" value={component.distributionCycle} />
            <Field label="Reporting" value={component.reportingRequirements} />
            <Field label="Audit rights" value={component.auditRights} />
            {showAmounts ? <Field label="Minimum guarantee" value={component.minimumGuarantee} /> : null}
            {showAmounts ? <Field label="Cap" value={component.maximumCap} /> : null}
            <Field label="Duration" value={component.duration} />
          </>
        ) : null}

        {component.type === 'equity' ? (
          <>
            {showAmounts ? <Field label="Percentage" value={component.equityPercentage} /> : null}
            <Field label="Equity type" value={component.equityType} />
            <Field label="Target entity" value={component.targetEntity} />
            <Field label="Company / SPV" value={component.companyOrSpv} />
            {showAmounts ? (
              <Field
                label="Valuation"
                value={
                  component.valuation != null
                    ? `${component.valuationCurrency ?? ''} ${component.valuation}`.trim()
                    : undefined
                }
              />
            ) : null}
            <Field label="Share class" value={component.shareClass} />
            <Field label="Voting rights" value={component.votingRights} />
            <Field label="Dividend rights" value={component.dividendRights} />
            <Field label="Vesting" value={component.vestingTerms ?? component.vestingPeriod} />
            <Field label="Dilution" value={component.dilutionRules} />
            <Field label="Exit strategy" value={component.exitStrategy} />
          </>
        ) : null}

        {component.type === 'custom' ? (
          <>
            <Field label="Description" value={component.description} />
            <Field label="Value type" value={component.valueType} />
            <Field label="Calculation" value={component.calculationMethod} />
            {showAmounts ? <Field label="Amount" value={component.amount} /> : null}
            {showAmounts ? <Field label="Percentage" value={component.percentage} /> : null}
            <Field label="Trigger" value={component.trigger} />
            <Field label="Settlement" value={component.settlementTerms} />
            <Field label="Duration" value={component.duration} />
            <Field label="Conditions" value={component.conditions} />
          </>
        ) : null}
      </dl>

      {applicability.length > 0 ? (
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
          Applies to: {applicability.join(' · ')}
        </p>
      ) : null}
    </article>
  )
}

export function CommercialWorkspace() {
  const { model } = useOpportunityDetailsContext()

  useEffect(() => {
    if (model.workspaceVisibility.commercial === 'ready') {
      trackOcxEvent('opportunity_commercial_component_viewed', {
        opportunityId: model.opportunity.id,
        count: model.commercial.structure.components.filter((c) => c.enabled).length,
      })
    }
  }, [model])

  if (model.workspaceVisibility.commercial === 'restricted') {
    return (
      <OpportunityRestrictedState
        title="Restricted Commercial Data"
        description="Commercial details are available to authorized participants only."
      />
    )
  }

  const enabled = model.commercial.structure.components.filter((c) => c.enabled)
  const showAmounts = model.commercial.showAmounts
  const summary = model.commercial.publicSummary
  const wpTitles = new Map(model.scope.workPackages.map((pkg) => [pkg.id, pkg.title]))

  if (enabled.length === 0) {
    return (
      <OpportunityEmptyState
        title="No Commercial Structure"
        description="No commercial structure is available."
        action={
          model.capabilities.canEdit ? (
            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              to={`/opportunities/${model.opportunity.id}/edit?step=commercial`}
            >
              Edit commercial structure
            </Link>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Commercial">
      <OpportunitySection title="Commercial Structure">
        <div className="flex flex-wrap gap-2">
          {summary?.derivedExchangeMode ? (
            <PmBadge tone="info">{summary.derivedExchangeMode}</PmBadge>
          ) : null}
          {summary?.isHybrid ? <PmBadge tone="muted">Hybrid</PmBadge> : null}
          {model.commercial.structure.allocationMethod ? (
            <PmBadge tone="muted">
              Allocation: {model.commercial.structure.allocationMethod}
            </PmBadge>
          ) : null}
          {summary?.componentTypes.map((type) => (
            <PmBadge key={type} tone="muted">
              {type}
            </PmBadge>
          ))}
        </div>
        {showAmounts && summary?.allocationLines && summary.allocationLines.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm">
            {summary.allocationLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {!showAmounts ? (
          <p className={cn(pmTypography.bodySm, 'mt-2 text-muted-foreground')}>
            Amounts and formulas are hidden for this audience.
          </p>
        ) : null}
      </OpportunitySection>

      {(() => {
        const cash = enabled.find((c) => c.type === 'cash')
        if (!cash || cash.type !== 'cash') return null
        const schedule = cash.paymentSchedule ?? []
        return (
          <OpportunitySection title="Payment">
            <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Currency" value={cash.currency} />
              <Field label="Budget type" value={cash.budgetType} />
              {showAmounts ? <Field label="Budget / fixed amount" value={cash.fixedAmount} /> : null}
              {showAmounts && cash.minimumAmount != null ? (
                <Field label="Budget range" value={`${cash.minimumAmount} – ${cash.maximumAmount ?? '—'}`} />
              ) : null}
              {showAmounts ? <Field label="Advance %" value={cash.advancePercentage} /> : null}
              {showAmounts ? <Field label="Retention %" value={cash.retentionPercentage} /> : null}
              <Field label="VAT" value={cash.vatHandling} />
              <Field label="Tax handling" value={cash.taxHandling} />
              <Field label="Payment frequency" value={cash.paymentFrequency} />
              <Field label="Payment terms" value={cash.paymentTerms} />
              <Field label="Invoice requirements" value={cash.invoiceRequirements} />
              <Field label="Payment method" value={cash.paymentMethod} />
              {showAmounts ? <Field label="Bank guarantee" value={cash.bankGuarantee} /> : null}
              {showAmounts ? <Field label="Performance bond" value={cash.performanceBond} /> : null}
              <Field label="Penalties" value={cash.penalties} />
              <Field label="Late payment terms" value={cash.latePaymentTerms} />
              <Field label="Performance bonus" value={cash.performanceBonus} />
            </dl>
            {showAmounts && schedule.length > 0 ? (
              <div className="mt-4">
                <p className={cn(pmTypography.label, 'mb-2')}>Payment schedule</p>
                <ul className="space-y-2">
                  {schedule.map((item) => (
                    <li key={item.id} className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground">
                        {[
                          item.percentage != null ? `${item.percentage}%` : null,
                          item.amount != null ? String(item.amount) : null,
                          item.triggerType,
                          item.dueCondition,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </OpportunitySection>
        )
      })()}

      <OpportunitySection title="Components">
        <div className="space-y-3">
          {enabled.map((component) => (
            <ComponentDetails
              key={component.id}
              component={component}
              showAmounts={showAmounts}
              workPackageTitles={wpTitles}
            />
          ))}
        </div>
      </OpportunitySection>

      {(model.commercial.structure.constraints?.length ?? 0) > 0 && showAmounts ? (
        <OpportunitySection title="Commercial Constraints">
          <ul className="space-y-2">
            {model.commercial.structure.constraints!.map((constraint) => (
              <li
                key={constraint.id}
                className="rounded-md border border-border/50 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {constraint.label ?? constraint.type}
                </span>
                {constraint.value != null ? (
                  <span className="text-muted-foreground"> — {String(constraint.value)}</span>
                ) : null}
                <span className="ms-2 text-xs text-muted-foreground">
                  {[
                    constraint.blocking ? 'Blocking' : 'Non-blocking',
                    constraint.negotiable ? 'Negotiable' : 'Non-negotiable',
                  ].join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </OpportunitySection>
      ) : null}
    </div>
  )
}
