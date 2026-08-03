import { Plus, Trash2 } from 'lucide-react'
import { PmButton } from '@/components/ui/pm-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  allowedCommercialComponentTypesForSubModel,
  buildCommercialStructureSummary,
  commercialComponentLabel,
  createEmptyCommercialComponent,
  deriveLegacyExchangeMode,
  syncCommercialStructureDerivedFields,
  type CashCommercialComponent,
  type CashPaymentItem,
  type CommercialComponent,
  type CommercialComponentType,
  type CommercialConstraint,
  type OpportunityCommercialStructure,
} from '@/domain/opportunity-commercial-structure'
import { createId } from '@/domain/opportunity-creation'
import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type CommercialComponentsBuilderProps = {
  draft: OpportunityDraft
  structure: OpportunityCommercialStructure
  onChange: (structure: OpportunityCommercialStructure) => void
}

export function CommercialComponentsBuilder({
  draft,
  structure,
  onChange,
}: CommercialComponentsBuilderProps) {
  const setStructure = (next: OpportunityCommercialStructure) => {
    onChange(syncCommercialStructureDerivedFields(next))
  }

  const enabledTypes = new Set(
    structure.components.filter((c) => c.enabled).map((c) => c.type),
  )

  const toggleType = (type: CommercialComponentType) => {
    const existing = structure.components.find((c) => c.type === type)
    if (existing) {
      const components = structure.components.map((c) =>
        c.type === type ? { ...c, enabled: !c.enabled } : c,
      )
      setStructure({
        ...structure,
        components,
        allocationMethod:
          components.filter((c) => c.enabled).length > 1
            ? structure.allocationMethod ?? 'percentage'
            : 'not_applicable',
      })
      return
    }
    const component = createEmptyCommercialComponent(type, createId(`cc-${type}`))
    const components = [...structure.components, component]
    setStructure({
      ...structure,
      components,
      allocationMethod:
        components.filter((c) => c.enabled).length > 1
          ? 'percentage'
          : 'not_applicable',
    })
  }

  const updateComponent = (id: string, patch: Partial<CommercialComponent>) => {
    setStructure({
      ...structure,
      components: structure.components.map((c) =>
        c.id === id ? ({ ...c, ...patch } as CommercialComponent) : c,
      ),
    })
  }

  const removeComponent = (id: string) => {
    setStructure({
      ...structure,
      components: structure.components.filter((c) => c.id !== id),
    })
  }

  const summary = buildCommercialStructureSummary(structure)
  const derived = deriveLegacyExchangeMode(structure)
  const selectableTypes = allowedCommercialComponentTypesForSubModel(
    draft.subModelType,
  )
  const disallowedSelected = structure.components.filter(
    (component) =>
      component.enabled && !selectableTypes.includes(component.type),
  )

  return (
    <div data-slot="commercial-components-builder" className="space-y-6">
      <div>
        <h3 className={cn(pmTypography.h3)}>How will value be exchanged?</h3>
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
          Select one or more components allowed for this collaboration sub-model.
          Hybrid is derived automatically when more than one is enabled.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {selectableTypes.map((type) => {
          const selected = enabledTypes.has(type)
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              className={cn(
                'rounded-lg border px-3 py-3 text-start',
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-surface-muted',
              )}
              onClick={() => toggleType(type)}
            >
              <span className={cn(pmTypography.label)}>
                {commercialComponentLabel(type)}
              </span>
            </button>
          )
        })}
      </div>

      {disallowedSelected.length > 0 ? (
        <p
          className={cn(pmTypography.caption, 'text-destructive')}
          role="alert"
          data-testid="commercial-disallowed-modes"
        >
          {disallowedSelected
            .map((component) => commercialComponentLabel(component.type))
            .join(', ')}{' '}
          {disallowedSelected.length === 1 ? 'is' : 'are'} not allowed for the
          selected sub-model. Disable {disallowedSelected.length === 1 ? 'it' : 'them'}{' '}
          before continuing.
        </p>
      ) : null}

      {selectableTypes.includes('custom') ? (
        <PmButton type="button" variant="outline" onClick={() => toggleType('custom')}>
          <Plus className="size-4" />
          Add Exchange Component
        </PmButton>
      ) : null}

      {structure.components.filter((c) => c.enabled).length > 1 ? (
        <AllocationBuilder structure={structure} onChange={setStructure} />
      ) : null}

      {structure.components
        .filter((c) => c.enabled)
        .map((component) => (
          <div
            key={component.id}
            className="space-y-3 rounded-lg border border-border p-4"
            data-field-id="commercialStructure"
          >
            <div className="flex items-center justify-between gap-2">
              <p className={cn(pmTypography.label)}>
                {component.title || commercialComponentLabel(component.type)}
              </p>
              <PmButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeComponent(component.id)}
              >
                <Trash2 className="size-4" />
              </PmButton>
            </div>
            <ComponentForm
              component={component}
              draft={draft}
              onChange={(patch) => updateComponent(component.id, patch)}
            />
          </div>
        ))}

      <ConstraintsForm
        constraints={structure.constraints ?? []}
        onChange={(constraints) => setStructure({ ...structure, constraints })}
      />

      <div className="rounded-lg border border-border bg-surface-muted/40 p-4">
        <p className={cn(pmTypography.label)}>Commercial Structure</p>
        <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
          Derived mode: {derived || 'unset'}
          {summary.isHybrid ? ' (Hybrid)' : ''}
        </p>
        <ul className="mt-2 space-y-1">
          {summary.previewLines.map((line) => (
            <li key={line} className={cn(pmTypography.bodySm)}>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AllocationBuilder({
  structure,
  onChange,
}: {
  structure: OpportunityCommercialStructure
  onChange: (s: OpportunityCommercialStructure) => void
}) {
  const enabled = structure.components.filter((c) => c.enabled)
  const total = enabled.reduce((sum, c) => sum + (c.allocationPercentage ?? 0), 0)
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn(pmTypography.label)}>Commercial Allocation</p>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={structure.allocationMethod ?? 'percentage'}
          onChange={(e) =>
            onChange({
              ...structure,
              allocationMethod:
                e.target.value as OpportunityCommercialStructure['allocationMethod'],
            })
          }
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
          <option value="mixed">Mixed</option>
          <option value="not_applicable">Not applicable</option>
        </select>
      </div>
      {enabled.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2">
          <span className="min-w-[8rem] text-sm">
            {commercialComponentLabel(c.type)}
          </span>
          {(structure.allocationMethod === 'percentage'
            || structure.allocationMethod === 'mixed') && (
            <Input
              className="w-24"
              type="number"
              min={0}
              max={100}
              value={c.allocationPercentage ?? ''}
              onChange={(e) =>
                onChange({
                  ...structure,
                  components: structure.components.map((item) =>
                    item.id === c.id
                      ? {
                          ...item,
                          allocationPercentage: Number(e.target.value) || 0,
                        }
                      : item,
                  ),
                })
              }
            />
          )}
          {(structure.allocationMethod === 'fixed'
            || structure.allocationMethod === 'mixed') && (
            <Input
              className="w-36"
              type="number"
              placeholder="Amount"
              value={c.allocationAmount?.amount ?? ''}
              onChange={(e) =>
                onChange({
                  ...structure,
                  components: structure.components.map((item) =>
                    item.id === c.id
                      ? {
                          ...item,
                          allocationAmount: {
                            amount: Number(e.target.value) || 0,
                            currency:
                              item.allocationAmount?.currency
                              ?? (item.type === 'cash'
                                ? item.currency ?? 'SAR'
                                : 'SAR'),
                          },
                        }
                      : item,
                  ),
                })
              }
            />
          )}
        </div>
      ))}
      {structure.allocationMethod === 'percentage' ? (
        <p
          className={cn(
            pmTypography.caption,
            Math.abs(total - 100) > 0.01 ? 'text-warning' : 'text-muted-foreground',
          )}
        >
          Total {total}%
        </p>
      ) : null}
    </div>
  )
}

function ComponentForm({
  component,
  draft,
  onChange,
}: {
  component: CommercialComponent
  draft: OpportunityDraft
  onChange: (patch: Partial<CommercialComponent>) => void
}) {
  return (
    <div className="space-y-3">
      <Input
        value={component.title}
        placeholder="Component title"
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <ScopeFields component={component} draft={draft} onChange={onChange} />
      {component.type === 'cash' ? (
        <CashFields component={component} onChange={onChange} />
      ) : null}
      {component.type === 'barter' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Offered asset or service"
            value={component.offeredAssetOrService ?? ''}
            onChange={(e) => onChange({ offeredAssetOrService: e.target.value })}
          />
          <Input
            placeholder="Requested asset or service"
            value={component.requestedAssetOrService ?? ''}
            onChange={(e) => onChange({ requestedAssetOrService: e.target.value })}
          />
          <Input
            placeholder="Valuation method"
            value={component.valuationMethod ?? ''}
            onChange={(e) => onChange({ valuationMethod: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Estimated value"
            value={component.estimatedValue ?? ''}
            onChange={(e) =>
              onChange({ estimatedValue: Number(e.target.value) || undefined })
            }
          />
          <Input
            className="sm:col-span-2"
            placeholder="Exchange conditions"
            value={component.condition ?? ''}
            onChange={(e) => onChange({ condition: e.target.value })}
          />
        </div>
      ) : null}
      {component.type === 'profit_sharing' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="number"
            placeholder="Profit share %"
            value={component.profitSharePercentage ?? ''}
            onChange={(e) =>
              onChange({
                profitSharePercentage: Number(e.target.value) || undefined,
              })
            }
          />
          <Input
            placeholder="Calculation basis"
            value={component.calculationBasis ?? ''}
            onChange={(e) => onChange({ calculationBasis: e.target.value })}
          />
          <Input
            placeholder="Settlement period"
            value={component.settlementPeriod ?? ''}
            onChange={(e) => onChange({ settlementPeriod: e.target.value })}
          />
        </div>
      ) : null}
      {component.type === 'revenue_sharing' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="number"
            placeholder="Revenue share %"
            value={component.revenueSharePercentage ?? ''}
            onChange={(e) =>
              onChange({
                revenueSharePercentage: Number(e.target.value) || undefined,
              })
            }
          />
          <Input
            placeholder="Revenue definition"
            value={component.revenueDefinition ?? ''}
            onChange={(e) => onChange({ revenueDefinition: e.target.value })}
          />
        </div>
      ) : null}
      {component.type === 'equity' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="number"
            placeholder="Equity %"
            value={component.equityPercentage ?? ''}
            onChange={(e) =>
              onChange({ equityPercentage: Number(e.target.value) || undefined })
            }
          />
          <Input
            placeholder="Equity type"
            value={component.equityType ?? ''}
            onChange={(e) => onChange({ equityType: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Valuation"
            value={component.valuation ?? ''}
            onChange={(e) =>
              onChange({ valuation: Number(e.target.value) || undefined })
            }
          />
          <Input
            placeholder="Exit strategy"
            value={component.exitStrategy ?? ''}
            onChange={(e) => onChange({ exitStrategy: e.target.value })}
          />
        </div>
      ) : null}
      {component.type === 'custom' ? (
        <div className="grid gap-2">
          <Textarea
            placeholder="Description"
            value={component.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
          />
          <Input
            placeholder="Calculation method"
            value={component.calculationMethod ?? ''}
            onChange={(e) => onChange({ calculationMethod: e.target.value })}
          />
        </div>
      ) : null}
      <Textarea
        placeholder="Notes"
        value={component.notes ?? ''}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
    </div>
  )
}

function ScopeFields({
  component,
  draft,
  onChange,
}: {
  component: CommercialComponent
  draft: OpportunityDraft
  onChange: (patch: Partial<CommercialComponent>) => void
}) {
  return (
    <div className="space-y-2">
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={component.appliesTo}
        onChange={(e) =>
          onChange({
            appliesTo: e.target.value as CommercialComponent['appliesTo'],
          })
        }
      >
        <option value="entire_opportunity">Entire opportunity</option>
        <option value="selected_work_items">Selected work items</option>
      </select>
      {component.appliesTo === 'selected_work_items' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <MultiCheck
            label="Work packages"
            options={draft.workPackages.map((p) => ({
              id: p.id,
              label: p.title || p.id,
            }))}
            selected={component.applicableWorkPackageIds ?? []}
            onChange={(applicableWorkPackageIds) =>
              onChange({ applicableWorkPackageIds })
            }
          />
          <MultiCheck
            label="Milestones"
            options={draft.milestones.map((m) => ({
              id: m.id,
              label: m.title || m.id,
            }))}
            selected={component.applicableMilestoneIds ?? []}
            onChange={(applicableMilestoneIds) =>
              onChange({ applicableMilestoneIds })
            }
          />
        </div>
      ) : null}
    </div>
  )
}

function MultiCheck({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { id: string; label: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  return (
    <div className="space-y-1">
      <p className={cn(pmTypography.caption)}>{label}</p>
      {options.length === 0 ? (
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>None yet</p>
      ) : (
        options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={(e) => {
                onChange(
                  e.target.checked
                    ? [...selected, opt.id]
                    : selected.filter((id) => id !== opt.id),
                )
              }}
            />
            {opt.label}
          </label>
        ))
      )}
    </div>
  )
}

function parseOptionalAmount(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function CashFields({
  component,
  onChange,
}: {
  component: CashCommercialComponent
  onChange: (patch: Partial<CashCommercialComponent>) => void
}) {
  const schedule = component.paymentSchedule ?? []
  const budgetType = component.budgetType ?? 'to_be_negotiated'
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="Currency"
          value={component.currency ?? 'SAR'}
          onChange={(e) => onChange({ currency: e.target.value })}
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={budgetType}
          onChange={(e) => {
            const next =
              e.target.value as CashCommercialComponent['budgetType']
            if (next === 'range') {
              onChange({
                budgetType: next,
                fixedAmount: undefined,
              })
              return
            }
            if (next === 'fixed') {
              onChange({
                budgetType: next,
                minimumAmount: undefined,
                maximumAmount: undefined,
              })
              return
            }
            onChange({ budgetType: next })
          }}
        >
          <option value="fixed">Fixed</option>
          <option value="range">Range</option>
          <option value="rate_based">Rate-based</option>
          <option value="milestone_based">Milestone-based</option>
          <option value="to_be_negotiated">To be negotiated</option>
        </select>
        {budgetType === 'fixed' ? (
          <Input
            type="number"
            min={0}
            placeholder="Fixed amount"
            aria-label="Fixed amount"
            value={component.fixedAmount ?? ''}
            onChange={(e) =>
              onChange({ fixedAmount: parseOptionalAmount(e.target.value) })
            }
          />
        ) : null}
        {budgetType === 'range' ? (
          <>
            <Input
              type="number"
              min={0}
              placeholder="Min amount"
              aria-label="Minimum amount"
              value={component.minimumAmount ?? ''}
              onChange={(e) =>
                onChange({
                  minimumAmount: parseOptionalAmount(e.target.value),
                })
              }
            />
            <Input
              type="number"
              min={0}
              placeholder="Max amount"
              aria-label="Maximum amount"
              value={component.maximumAmount ?? ''}
              onChange={(e) =>
                onChange({
                  maximumAmount: parseOptionalAmount(e.target.value),
                })
              }
            />
          </>
        ) : null}
        <Input
          type="number"
          placeholder="Advance %"
          value={component.advancePercentage ?? ''}
          onChange={(e) =>
            onChange({ advancePercentage: Number(e.target.value) || undefined })
          }
        />
        <Input
          type="number"
          placeholder="Retention %"
          value={component.retentionPercentage ?? ''}
          onChange={(e) =>
            onChange({
              retentionPercentage: Number(e.target.value) || undefined,
            })
          }
        />
        <Input
          placeholder="Payment terms"
          // TODO: Add opportunity-level default payment terms as SSOT; cash
          // components should inherit with optional Override (same pattern as
          // work-package field inheritance).
          value={component.paymentTerms ?? ''}
          onChange={(e) => onChange({ paymentTerms: e.target.value })}
        />
        <Input
          placeholder="VAT handling"
          value={component.vatHandling ?? ''}
          onChange={(e) => onChange({ vatHandling: e.target.value })}
        />
        <Input
          placeholder="Bank guarantee"
          value={component.bankGuarantee ?? ''}
          onChange={(e) => onChange({ bankGuarantee: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className={cn(pmTypography.label)}>Payment schedule</p>
          <PmButton
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const item: CashPaymentItem = {
                id: createId('pay'),
                title: '',
                triggerType: 'milestone',
              }
              onChange({ paymentSchedule: [...schedule, item] })
            }}
          >
            <Plus className="size-4" />
            Add Payment Milestone
          </PmButton>
        </div>
        {schedule.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]"
          >
            <Input
              placeholder="Title"
              value={item.title}
              onChange={(e) =>
                onChange({
                  paymentSchedule: schedule.map((p, i) =>
                    i === index ? { ...p, title: e.target.value } : p,
                  ),
                })
              }
            />
            <Input
              type="number"
              placeholder="%"
              value={item.percentage ?? ''}
              onChange={(e) =>
                onChange({
                  paymentSchedule: schedule.map((p, i) =>
                    i === index
                      ? { ...p, percentage: Number(e.target.value) || undefined }
                      : p,
                  ),
                })
              }
            />
            <Input
              type="number"
              placeholder="Amount"
              value={item.amount ?? ''}
              onChange={(e) =>
                onChange({
                  paymentSchedule: schedule.map((p, i) =>
                    i === index
                      ? { ...p, amount: Number(e.target.value) || undefined }
                      : p,
                  ),
                })
              }
            />
            <PmButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange({
                  paymentSchedule: schedule.filter((_, i) => i !== index),
                })
              }
            >
              <Trash2 className="size-4" />
            </PmButton>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConstraintsForm({
  constraints,
  onChange,
}: {
  constraints: CommercialConstraint[]
  onChange: (items: CommercialConstraint[]) => void
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className={cn(pmTypography.label)}>Commercial Constraints</p>
        <PmButton
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...constraints,
              {
                id: createId('cstr'),
                type: 'budget_ceiling',
                label: 'Budget ceiling',
                value: '',
                negotiable: true,
                blocking: false,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Add constraint
        </PmButton>
      </div>
      {constraints.map((c, index) => (
        <div key={c.id} className="flex flex-wrap gap-2">
          <Input
            className="min-w-[10rem] flex-1"
            value={c.label ?? c.type}
            onChange={(e) =>
              onChange(
                constraints.map((item, i) =>
                  i === index ? { ...item, label: e.target.value } : item,
                ),
              )
            }
          />
          <Input
            className="w-40"
            value={String(c.value ?? '')}
            onChange={(e) =>
              onChange(
                constraints.map((item, i) =>
                  i === index ? { ...item, value: e.target.value } : item,
                ),
              )
            }
          />
          <PmButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(constraints.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </PmButton>
        </div>
      ))}
    </div>
  )
}
