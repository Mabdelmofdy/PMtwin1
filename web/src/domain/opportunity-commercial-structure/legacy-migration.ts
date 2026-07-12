/**
 * Migrate legacy exchangeMode / commercialTerms into OpportunityCommercialStructure.
 * Deterministic, idempotent, non-destructive.
 */

import type { ExchangeMode } from '@pm-twin/collaboration-models'
import { createEmptyCommercialComponent } from './component-types.ts'
import type {
  CashCommercialComponent,
  CommercialComponent,
  CommercialComponentType,
  OpportunityCommercialStructure,
} from './types.ts'
import { emptyCommercialStructure } from './types.ts'

export type CommercialTermsLike = {
  budget?: string
  currency?: string
  paymentTerms?: string
  milestonePayments?: string
  advancePayment?: string
  retention?: string
  vatIncluded?: boolean
  offeredValue?: string
  requestedValue?: string
  estimatedEquivalentValue?: string
  exchangeConditions?: string
  profitSharePercent?: string
  costSharing?: string
  revenueBasis?: string
  settlementCycle?: string
  equityPercent?: string
  capitalContribution?: string
  governanceRights?: string
  exitTerms?: string
  hybridComponents?: string[]
}

/** Loose shape for legacy opportunity / draft commercial fields. */
export type LegacyOpportunityCommercialSource = {
  exchangeMode?: string | null
  acceptedExchangeModes?: string[] | null
  paymentModes?: string[] | null
  commercialStructure?: OpportunityCommercialStructure | null
  exchangeData?: Record<string, unknown> | null
  collaborationAttributes?: Record<string, unknown> | null
  commercialTerms?: CommercialTermsLike | null
}

export type LegacyOpportunity = LegacyOpportunityCommercialSource

const STANDARD: readonly string[] = [
  'cash',
  'barter',
  'equity',
  'profit_sharing',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeMode(raw?: string | null): string {
  if (!raw) return ''
  return raw.toLowerCase().replace(/-/g, '_').trim()
}

function deterministicId(type: CommercialComponentType, seed: string): string {
  return `cc-${type}-${seed}`
}

function parseNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function isValidStructure(
  value: unknown,
): value is OpportunityCommercialStructure {
  if (!isRecord(value)) return false
  return Array.isArray(value.components)
}

function modesFromLegacy(source: LegacyOpportunityCommercialSource): string[] {
  const modes = new Set<string>()
  const primary = normalizeMode(source.exchangeMode)
  if (primary && primary !== 'hybrid') modes.add(primary)

  const accepted =
    source.acceptedExchangeModes ?? source.paymentModes ?? []
  for (const mode of accepted) {
    const n = normalizeMode(mode)
    if (n && n !== 'hybrid') modes.add(n)
  }

  const hybrid =
    source.commercialTerms?.hybridComponents
    ?? (isRecord(source.exchangeData)
      ? (source.exchangeData.hybridComponents as string[] | undefined)
      : undefined)
  if (Array.isArray(hybrid)) {
    for (const mode of hybrid) {
      const n = normalizeMode(mode)
      if (n) modes.add(n)
    }
  }

  // Infer components from attribute signals when exchangeMode is hybrid.
  if (primary === 'hybrid') {
    const attrs = {
      ...(source.collaborationAttributes ?? {}),
      ...(source.exchangeData ?? {}),
    }
    if (
      attrs.budget != null
      || attrs.budgetRange != null
      || attrs.paymentSchedule != null
      || attrs.cashComponent != null
    ) {
      modes.add('cash')
    }
    if (
      attrs.barterOffer != null
      || attrs.barterPreferences != null
      || attrs.offeredService != null
      || attrs.barterComponent != null
    ) {
      modes.add('barter')
    }
    if (attrs.equityPercentage != null || attrs.equityComponent != null) {
      modes.add('equity')
    }
    if (
      attrs.profitSplit != null
      || attrs.profitComponent != null
      || attrs.calculationBasis != null
    ) {
      modes.add('profit_sharing')
    }
  }

  if (modes.size === 0 && primary === 'hybrid') {
    modes.add('cash')
  }

  return [...modes]
}

function enrichCash(
  component: CashCommercialComponent,
  terms: CommercialTermsLike | null | undefined,
  exchange: Record<string, unknown> | null | undefined,
): CashCommercialComponent {
  const currency =
    terms?.currency
    ?? (exchange?.currency != null ? String(exchange.currency) : undefined)
    ?? 'SAR'
  const budget = parseNumber(terms?.budget ?? exchange?.budget)
  const advance = parseNumber(terms?.advancePayment ?? exchange?.advancePayment)
  const retention = parseNumber(terms?.retention ?? exchange?.retention)
  return {
    ...component,
    currency,
    fixedAmount: budget,
    budgetType: budget != null ? 'fixed' : 'to_be_negotiated',
    advancePercentage: advance,
    retentionPercentage: retention,
    paymentTerms:
      terms?.paymentTerms
      ?? (exchange?.paymentSchedule != null
        ? String(exchange.paymentSchedule)
        : undefined)
      ?? (exchange?.cashPaymentTerms != null
        ? String(exchange.cashPaymentTerms)
        : undefined),
    vatHandling:
      terms?.vatIncluded === true
        ? 'included'
        : terms?.vatIncluded === false
          ? 'excluded'
          : undefined,
  }
}

function buildComponentFromMode(
  mode: string,
  seed: string,
  terms: CommercialTermsLike | null | undefined,
  exchange: Record<string, unknown> | null | undefined,
): CommercialComponent | null {
  const type = normalizeMode(mode) as CommercialComponentType
  if (
    type !== 'cash'
    && type !== 'barter'
    && type !== 'equity'
    && type !== 'profit_sharing'
    && type !== 'revenue_sharing'
    && type !== 'custom'
  ) {
    return null
  }

  const id = deterministicId(type, seed)
  let component = createEmptyCommercialComponent(type, id)

  if (type === 'cash') {
    component = enrichCash(component as CashCommercialComponent, terms, exchange)
  }
  if (type === 'barter') {
    component = {
      ...component,
      type: 'barter',
      offeredAssetOrService:
        terms?.offeredValue
        ?? (exchange?.offeredService != null
          ? String(exchange.offeredService)
          : undefined),
      requestedAssetOrService:
        terms?.requestedValue
        ?? (exchange?.requestedService != null
          ? String(exchange.requestedService)
          : undefined),
      estimatedValue: parseNumber(
        terms?.estimatedEquivalentValue ?? exchange?.equivalenceEstimate,
      ),
      condition: terms?.exchangeConditions
        ?? (exchange?.exchangeConditions != null
          ? String(exchange.exchangeConditions)
          : undefined),
    }
  }
  if (type === 'profit_sharing') {
    component = {
      ...component,
      type: 'profit_sharing',
      profitSharePercentage: parseNumber(
        terms?.profitSharePercent ?? exchange?.profitSplit,
      ),
      calculationBasis:
        terms?.revenueBasis
        ?? (exchange?.calculationBasis != null
          ? String(exchange.calculationBasis)
          : undefined),
      settlementPeriod:
        terms?.settlementCycle
        ?? (exchange?.settlementCycle != null
          ? String(exchange.settlementCycle)
          : undefined),
      eligibleCosts: terms?.costSharing,
    }
  }
  if (type === 'equity') {
    component = {
      ...component,
      type: 'equity',
      equityPercentage: parseNumber(
        terms?.equityPercent ?? exchange?.equityPercentage,
      ),
      exitStrategy: terms?.exitTerms
        ?? (exchange?.exitTerms != null ? String(exchange.exitTerms) : undefined),
      boardRepresentation: terms?.governanceRights
        ?? (exchange?.ownershipTerms != null
          ? String(exchange.ownershipTerms)
          : undefined),
    }
  }

  return component
}

/**
 * Derive matching-safe legacy ExchangeMode from commercial structure.
 * revenue_sharing / custom alone → hybrid.
 */
export function deriveLegacyExchangeMode(
  structure: OpportunityCommercialStructure,
): ExchangeMode | '' {
  const enabled = structure.components.filter((c) => c.enabled)
  if (enabled.length === 0) return ''
  if (enabled.length > 1) return 'hybrid'
  const type = enabled[0]!.type
  if (STANDARD.includes(type)) return type as ExchangeMode
  return 'hybrid'
}

export function derivePrimaryMode(
  structure: OpportunityCommercialStructure,
): OpportunityCommercialStructure['primaryMode'] {
  const enabled = structure.components.filter((c) => c.enabled)
  if (enabled.length === 0) return undefined
  if (enabled.length > 1) {
    const firstStandard = enabled.find((c) => STANDARD.includes(c.type))
    return firstStandard?.type ?? enabled[0]!.type
  }
  return enabled[0]!.type
}

export function migrateLegacyExchangeModeToCommercialStructure(
  opportunity: LegacyOpportunity,
): OpportunityCommercialStructure {
  const fromAttrs = opportunity.collaborationAttributes?.commercialStructure
  const existing =
    opportunity.commercialStructure
    ?? (isValidStructure(fromAttrs) ? fromAttrs : null)
    ?? (isValidStructure(opportunity.exchangeData?.commercialStructure)
      ? (opportunity.exchangeData!.commercialStructure as OpportunityCommercialStructure)
      : null)

  if (existing && existing.components.length > 0) {
    const primaryMode =
      existing.primaryMode ?? derivePrimaryMode(existing)
    return {
      ...existing,
      primaryMode,
      constraints: existing.constraints ?? [],
      allocationMethod: existing.allocationMethod ?? (
        existing.components.filter((c) => c.enabled).length > 1
          ? 'percentage'
          : 'not_applicable'
      ),
    }
  }

  const modes = modesFromLegacy(opportunity)
  if (modes.length === 0) {
    return emptyCommercialStructure()
  }

  const terms =
    opportunity.commercialTerms
    ?? (isRecord(opportunity.exchangeData?.commercialTerms)
      ? (opportunity.exchangeData!.commercialTerms as CommercialTermsLike)
      : isRecord(opportunity.exchangeData)
        ? (opportunity.exchangeData as CommercialTermsLike)
        : null)

  const exchange = opportunity.exchangeData ?? null
  const seed = normalizeMode(opportunity.exchangeMode) || modes.join('-') || 'legacy'
  const components: CommercialComponent[] = []

  for (const mode of modes) {
    const component = buildComponentFromMode(mode, seed, terms, exchange)
    if (component) components.push(component)
  }

  // Deduplicate by type (one component per type from legacy)
  const byType = new Map<CommercialComponentType, CommercialComponent>()
  for (const component of components) {
    if (!byType.has(component.type)) byType.set(component.type, component)
  }
  const unique = [...byType.values()]

  const structure: OpportunityCommercialStructure = {
    components: unique,
    allocationMethod: unique.length > 1 ? 'percentage' : 'not_applicable',
    constraints: [],
  }
  structure.primaryMode = derivePrimaryMode(structure)
  return structure
}
