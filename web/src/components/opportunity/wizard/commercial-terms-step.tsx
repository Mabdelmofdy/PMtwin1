import { PmFormField, PmFormGrid, PmFormSection } from '@/components/forms/pm-form-index'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type {
  CommercialConstraints,
  CommercialTermsByMode,
} from '@/domain/opportunity-creation'

const HYBRID_OPTIONS = [
  { key: 'cash', label: 'Cash' },
  { key: 'barter', label: 'Barter' },
  { key: 'profit_sharing', label: 'Profit sharing' },
  { key: 'equity', label: 'Equity' },
] as const

function CashFields({
  terms,
  onChange,
}: {
  terms: CommercialTermsByMode
  onChange: (terms: CommercialTermsByMode) => void
}) {
  return (
    <div data-testid="commercial-cash-fields">
      <PmFormGrid columns={2}>
        <PmFormField id="cash-budget" label="Budget">
          <Input
            value={terms.budget ?? ''}
            onChange={(e) => onChange({ ...terms, budget: e.target.value })}
          />
        </PmFormField>
        <PmFormField id="cash-currency" label="Currency">
          <Input
            value={terms.currency ?? 'SAR'}
            onChange={(e) => onChange({ ...terms, currency: e.target.value })}
          />
        </PmFormField>
        <PmFormField id="cash-payment" label="Payment terms">
          <Input
            value={terms.paymentTerms ?? ''}
            onChange={(e) => onChange({ ...terms, paymentTerms: e.target.value })}
          />
        </PmFormField>
        <PmFormField id="cash-milestones" label="Milestone payments">
          <Input
            value={terms.milestonePayments ?? ''}
            onChange={(e) =>
              onChange({ ...terms, milestonePayments: e.target.value })
            }
          />
        </PmFormField>
        <PmFormField id="cash-advance" label="Advance payment">
          <Input
            value={terms.advancePayment ?? ''}
            onChange={(e) => onChange({ ...terms, advancePayment: e.target.value })}
          />
        </PmFormField>
        <PmFormField id="cash-retention" label="Retention">
          <Input
            value={terms.retention ?? ''}
            onChange={(e) => onChange({ ...terms, retention: e.target.value })}
          />
        </PmFormField>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(terms.vatIncluded)}
            onChange={(e) => onChange({ ...terms, vatIncluded: e.target.checked })}
          />
          VAT / tax included
        </label>
      </PmFormGrid>
    </div>
  )
}

function BarterFields({
  terms,
  onChange,
}: {
  terms: CommercialTermsByMode
  onChange: (terms: CommercialTermsByMode) => void
}) {
  return (
    <PmFormGrid columns={2} data-testid="commercial-barter-fields">
      <PmFormField id="barter-offered" label="Offered value">
        <Input
          value={terms.offeredValue ?? ''}
          onChange={(e) => onChange({ ...terms, offeredValue: e.target.value })}
        />
      </PmFormField>
      <PmFormField id="barter-requested" label="Requested value">
        <Input
          value={terms.requestedValue ?? ''}
          onChange={(e) => onChange({ ...terms, requestedValue: e.target.value })}
        />
      </PmFormField>
      <PmFormField id="barter-equiv" label="Estimated equivalent value">
        <Input
          value={terms.estimatedEquivalentValue ?? ''}
          onChange={(e) =>
            onChange({ ...terms, estimatedEquivalentValue: e.target.value })
          }
        />
      </PmFormField>
      <PmFormField id="barter-conditions" label="Exchange conditions">
        <Textarea
          value={terms.exchangeConditions ?? ''}
          onChange={(e) =>
            onChange({ ...terms, exchangeConditions: e.target.value })
          }
          rows={2}
        />
      </PmFormField>
    </PmFormGrid>
  )
}

function ProfitFields({
  terms,
  onChange,
}: {
  terms: CommercialTermsByMode
  onChange: (terms: CommercialTermsByMode) => void
}) {
  return (
    <PmFormGrid columns={2} data-testid="commercial-profit-fields">
      <PmFormField id="profit-share" label="Profit share %">
        <Input
          value={terms.profitSharePercent ?? ''}
          onChange={(e) =>
            onChange({ ...terms, profitSharePercent: e.target.value })
          }
        />
      </PmFormField>
      <PmFormField id="profit-cost" label="Cost sharing">
        <Input
          value={terms.costSharing ?? ''}
          onChange={(e) => onChange({ ...terms, costSharing: e.target.value })}
        />
      </PmFormField>
      <PmFormField id="profit-basis" label="Revenue basis">
        <Input
          value={terms.revenueBasis ?? ''}
          onChange={(e) => onChange({ ...terms, revenueBasis: e.target.value })}
        />
      </PmFormField>
      <PmFormField id="profit-cycle" label="Settlement cycle">
        <Input
          value={terms.settlementCycle ?? ''}
          onChange={(e) =>
            onChange({ ...terms, settlementCycle: e.target.value })
          }
        />
      </PmFormField>
    </PmFormGrid>
  )
}

function EquityFields({
  terms,
  onChange,
}: {
  terms: CommercialTermsByMode
  onChange: (terms: CommercialTermsByMode) => void
}) {
  return (
    <PmFormGrid columns={2} data-testid="commercial-equity-fields">
      <PmFormField id="equity-pct" label="Equity %">
        <Input
          value={terms.equityPercent ?? ''}
          onChange={(e) => onChange({ ...terms, equityPercent: e.target.value })}
        />
      </PmFormField>
      <PmFormField id="equity-capital" label="Capital contribution">
        <Input
          value={terms.capitalContribution ?? ''}
          onChange={(e) =>
            onChange({ ...terms, capitalContribution: e.target.value })
          }
        />
      </PmFormField>
      <PmFormField id="equity-gov" label="Governance rights">
        <Textarea
          value={terms.governanceRights ?? ''}
          onChange={(e) =>
            onChange({ ...terms, governanceRights: e.target.value })
          }
          rows={2}
        />
      </PmFormField>
      <PmFormField id="equity-exit" label="Exit terms">
        <Textarea
          value={terms.exitTerms ?? ''}
          onChange={(e) => onChange({ ...terms, exitTerms: e.target.value })}
          rows={2}
        />
      </PmFormField>
    </PmFormGrid>
  )
}

export function CommercialTermsStep({
  exchangeMode,
  paymentModes,
  terms,
  constraints,
  onTermsChange,
  onConstraintsChange,
}: {
  exchangeMode: string
  paymentModes: string[]
  terms: CommercialTermsByMode
  constraints: CommercialConstraints
  onTermsChange: (terms: CommercialTermsByMode) => void
  onConstraintsChange: (constraints: CommercialConstraints) => void
}) {
  const mode = (exchangeMode || paymentModes[0] || '').toLowerCase()
  const hybridComponents = terms.hybridComponents ?? []
  const showCash =
    mode === 'cash' ||
    mode === 'hybrid' ||
    hybridComponents.includes('cash') ||
    paymentModes.includes('cash')
  const showBarter =
    mode === 'barter' ||
    (mode === 'hybrid' && hybridComponents.includes('barter')) ||
    paymentModes.includes('barter')
  const showProfit =
    mode === 'profit_sharing' ||
    (mode === 'hybrid' && hybridComponents.includes('profit_sharing')) ||
    paymentModes.includes('profit_sharing')
  const showEquity =
    mode === 'equity' ||
    (mode === 'hybrid' && hybridComponents.includes('equity')) ||
    paymentModes.includes('equity')

  return (
    <div className="space-y-4" data-testid="commercial-terms-step">
      <PmFormSection
        title="Commercial terms"
        description="Fields depend on the selected value exchange mode."
      >
        {mode === 'hybrid' ? (
          <div className="mb-4 flex flex-wrap gap-3" data-testid="commercial-hybrid-fields">
            {HYBRID_OPTIONS.map((option) => {
              const checked = hybridComponents.includes(option.key)
              return (
                <label key={option.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? hybridComponents.filter((key) => key !== option.key)
                        : [...hybridComponents, option.key]
                      onTermsChange({ ...terms, hybridComponents: next })
                    }}
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        ) : null}

        {showCash ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Cash</p>
            <CashFields terms={terms} onChange={onTermsChange} />
          </div>
        ) : null}
        {showBarter ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Barter</p>
            <BarterFields terms={terms} onChange={onTermsChange} />
          </div>
        ) : null}
        {showProfit ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Profit sharing</p>
            <ProfitFields terms={terms} onChange={onTermsChange} />
          </div>
        ) : null}
        {showEquity ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Equity</p>
            <EquityFields terms={terms} onChange={onTermsChange} />
          </div>
        ) : null}
        {!showCash && !showBarter && !showProfit && !showEquity ? (
          <p className="text-sm text-muted-foreground">
            Select a value exchange mode in Collaboration Model to configure commercial terms.
          </p>
        ) : null}
      </PmFormSection>

      <PmFormSection
        title="Commercial constraints"
        description="Presentation metadata only — does not change agreement or contract logic."
      >
        <PmFormGrid columns={2} data-testid="commercial-constraints-fields">
          <PmFormField id="cc-min" label="Minimum contract value">
            <Input
              type="number"
              value={constraints.minimumContractValue ?? ''}
              onChange={(e) =>
                onConstraintsChange({
                  ...constraints,
                  minimumContractValue: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </PmFormField>
          <PmFormField id="cc-max" label="Maximum contract value">
            <Input
              type="number"
              value={constraints.maximumContractValue ?? ''}
              onChange={(e) =>
                onConstraintsChange({
                  ...constraints,
                  maximumContractValue: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </PmFormField>
          <PmFormField id="cc-currency" label="Currency">
            <Input
              value={constraints.currency ?? 'SAR'}
              onChange={(e) =>
                onConstraintsChange({ ...constraints, currency: e.target.value })
              }
            />
          </PmFormField>
          <PmFormField id="cc-cycle" label="Payment cycle">
            <Input
              value={constraints.paymentCycle ?? ''}
              onChange={(e) =>
                onConstraintsChange({
                  ...constraints,
                  paymentCycle: e.target.value,
                })
              }
            />
          </PmFormField>
          <PmFormField id="cc-warranty" label="Warranty period">
            <Input
              value={constraints.warrantyPeriod ?? ''}
              onChange={(e) =>
                onConstraintsChange({
                  ...constraints,
                  warrantyPeriod: e.target.value,
                })
              }
            />
          </PmFormField>
          <div className="flex flex-col gap-2 justify-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(constraints.insuranceRequired)}
                onChange={(e) =>
                  onConstraintsChange({
                    ...constraints,
                    insuranceRequired: e.target.checked,
                  })
                }
              />
              Insurance required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(constraints.performanceBond)}
                onChange={(e) =>
                  onConstraintsChange({
                    ...constraints,
                    performanceBond: e.target.checked,
                  })
                }
              />
              Performance bond
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(constraints.taxIncluded)}
                onChange={(e) =>
                  onConstraintsChange({
                    ...constraints,
                    taxIncluded: e.target.checked,
                  })
                }
              />
              Tax included
            </label>
          </div>
          <div className="sm:col-span-2">
            <PmFormField id="cc-notes" label="Commercial notes">
              <Textarea
                value={constraints.commercialNotes ?? ''}
                onChange={(e) =>
                  onConstraintsChange({
                    ...constraints,
                    commercialNotes: e.target.value,
                  })
                }
                rows={2}
              />
            </PmFormField>
          </div>
        </PmFormGrid>
      </PmFormSection>
    </div>
  )
}
