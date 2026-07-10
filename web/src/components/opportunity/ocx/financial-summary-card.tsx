import { OcxSummaryCard } from '@/components/opportunity/ocx/ocx-summary-card.tsx'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'

export type FinancialSummaryCardProps = {
  readonly exchangeMode?: string
  readonly commercialTerms?: Readonly<Record<string, unknown>>
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly state?: 'loading' | 'empty' | 'normal' | 'error'
}

function pick(
  sources: Array<Readonly<Record<string, unknown>> | undefined>,
  keys: readonly string[],
): string {
  for (const source of sources) {
    if (!source) continue
    for (const key of keys) {
      const value = source[key]
      if (value != null && String(value).trim() !== '') return String(value)
    }
  }
  return '—'
}

/**
 * Dynamic financial summary — Cash / Profit Sharing / Equity / Hybrid.
 * Display only from existing draft fields.
 */
export function FinancialSummaryCard({
  exchangeMode,
  commercialTerms,
  exchangeData,
  state,
}: FinancialSummaryCardProps) {
  const mode = (exchangeMode ?? '').toLowerCase().replace(/-/g, '_')
  const sources = [commercialTerms, exchangeData]
  const hasAny =
    Boolean(mode) ||
    Object.keys(commercialTerms ?? {}).length > 0 ||
    Object.keys(exchangeData ?? {}).length > 0

  const rows: Array<{ label: string; value: string }> = []
  if (mode === 'cash' || mode === 'hybrid' || !mode) {
    rows.push(
      { label: 'Budget', value: pick(sources, ['budget', 'cashAmount', 'cashComponent']) },
      { label: 'VAT', value: pick(sources, ['vat', 'vatPercent', 'vatRate']) },
      { label: 'Advance', value: pick(sources, ['advancePayment', 'advance']) },
      { label: 'Retention', value: pick(sources, ['retention', 'retentionPercent']) },
    )
  }
  if (mode === 'profit_sharing' || mode === 'hybrid') {
    rows.push(
      { label: 'Revenue / profit %', value: pick(sources, ['profitSplit', 'profitSharePercentage', 'profitPercent']) },
      { label: 'Settlement', value: pick(sources, ['settlementCycle', 'profitDistribution', 'calculationBasis']) },
    )
  }
  if (mode === 'equity' || mode === 'hybrid') {
    rows.push(
      { label: 'Equity %', value: pick(sources, ['equityPercentage', 'equitySplit', 'equityComponent']) },
      { label: 'Capital contribution', value: pick(sources, ['capitalContribution', 'ownershipTerms']) },
    )
  }

  return (
    <OcxSummaryCard
      title="Financial summary"
      description={
        mode
          ? formatCollaborationExchangeMode(mode)
          : 'Select an exchange mode to refine this summary.'
      }
      why="Partners need clear commercial terms before they can engage confidently."
      state={state ?? (hasAny ? 'normal' : 'empty')}
      emptyTitle="No commercial terms yet"
      emptyDescription="Add budget or exchange terms in Commercial Terms."
      testId="financial-summary-card"
    >
      <dl className="grid gap-2 sm:grid-cols-2 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </OcxSummaryCard>
  )
}
