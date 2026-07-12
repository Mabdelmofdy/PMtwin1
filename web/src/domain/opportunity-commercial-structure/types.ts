/** Opportunity Creation 3.0 — multi-component commercial structure. */

import type { ExchangeMode } from '@pm-twin/collaboration-models'

export type Money = {
  amount: number
  currency: string
}

export type CommercialComponentType =
  | 'cash'
  | 'barter'
  | 'equity'
  | 'profit_sharing'
  | 'revenue_sharing'
  | 'custom'

export type CommercialAllocationMethod =
  | 'percentage'
  | 'fixed'
  | 'mixed'
  | 'not_applicable'

export type CommercialAppliesTo =
  | 'entire_opportunity'
  | 'selected_work_items'

export type CommercialConstraint = {
  id: string
  type: string
  label?: string
  value: unknown
  negotiable: boolean
  blocking: boolean
  notes?: string
}

export type CommercialComponentBase = {
  id: string
  type: CommercialComponentType
  title: string
  enabled: boolean
  allocationPercentage?: number
  allocationAmount?: Money
  appliesTo: CommercialAppliesTo
  applicableWorkPackageIds?: string[]
  applicableTaskIds?: string[]
  applicableDeliverableIds?: string[]
  applicableMilestoneIds?: string[]
  negotiable?: boolean
  notes?: string
}

export type CashBudgetType =
  | 'fixed'
  | 'range'
  | 'rate_based'
  | 'milestone_based'
  | 'to_be_negotiated'

export type CashPaymentItem = {
  id: string
  title: string
  description?: string
  triggerType?:
    | 'advance'
    | 'milestone'
    | 'deliverable'
    | 'completion'
    | 'retention_release'
    | 'custom'
  percentage?: number
  amount?: number
  dueCondition?: string
  dueDate?: string
  linkedWorkPackageId?: string
  linkedTaskId?: string
  linkedDeliverableId?: string
  linkedMilestoneId?: string
  approvalRequired?: boolean
  invoiceRequired?: boolean
  retentionApplicable?: boolean
  notes?: string
}

export type CashCommercialComponent = CommercialComponentBase & {
  type: 'cash'
  currency?: string
  budgetType?: CashBudgetType
  fixedAmount?: number
  minimumAmount?: number
  maximumAmount?: number
  rate?: number
  rateUnit?: string
  advancePercentage?: number
  retentionPercentage?: number
  vatHandling?: string
  taxHandling?: string
  paymentTerms?: string
  paymentFrequency?: string
  paymentMethod?: string
  invoiceRequirements?: string
  approvalRequirements?: string
  latePaymentTerms?: string
  performanceBonus?: string
  penalties?: string
  bankGuarantee?: string
  performanceBond?: string
  paymentSchedule?: CashPaymentItem[]
}

export type BarterCommercialComponent = CommercialComponentBase & {
  type: 'barter'
  exchangeCategory?: string
  offeredAssetOrService?: string
  requestedAssetOrService?: string
  assetType?: string
  serviceType?: string
  description?: string
  estimatedValue?: number
  replacementValue?: number
  exchangeRatio?: string
  quantity?: number
  unit?: string
  condition?: string
  deliveryLocation?: string
  deliveryDate?: string
  inspectionRequirement?: boolean
  inspectionMethod?: string
  warranty?: string
  valuationMethod?: string
  differenceSettlementMethod?: string
}

export type ProfitSharingCommercialComponent = CommercialComponentBase & {
  type: 'profit_sharing'
  profitSharePercentage?: number
  calculationBasis?: string
  grossOrNet?: 'gross' | 'net'
  eligibleCosts?: string
  excludedCosts?: string
  distributionFrequency?: string
  reportingRequirements?: string
  auditRights?: string
  minimumGuarantee?: number
  maximumCap?: number
  settlementMethod?: string
  settlementPeriod?: string
  lossTreatment?: string
  duration?: string
  startCondition?: string
  endCondition?: string
  exitConditions?: string
}

export type RevenueSharingCommercialComponent = CommercialComponentBase & {
  type: 'revenue_sharing'
  revenueSharePercentage?: number
  revenueDefinition?: string
  grossOrNet?: 'gross' | 'net'
  collectionResponsibility?: string
  distributionCycle?: string
  minimumGuarantee?: number
  maximumCap?: number
  refundTreatment?: string
  discountTreatment?: string
  taxTreatment?: string
  reportingRequirements?: string
  auditRights?: string
  duration?: string
  settlementMethod?: string
  settlementPeriod?: string
}

export type EquityCommercialComponent = CommercialComponentBase & {
  type: 'equity'
  equityPercentage?: number
  equityType?: string
  targetEntity?: string
  companyOrSpv?: 'company' | 'spv'
  valuation?: number
  valuationCurrency?: string
  valuationDate?: string
  shareClass?: string
  votingRights?: string
  dividendRights?: string
  vestingTerms?: string
  vestingPeriod?: string
  dilutionRules?: string
  antiDilutionProtection?: string
  lockInPeriod?: string
  exitStrategy?: string
  transferRestrictions?: string
  boardRepresentation?: string
  conditionsPrecedent?: string
  shareIssuanceTrigger?: string
}

export type CustomCommercialComponent = CommercialComponentBase & {
  type: 'custom'
  description?: string
  valueType?: string
  calculationMethod?: string
  amount?: number
  percentage?: number
  trigger?: string
  settlementTerms?: string
  duration?: string
  conditions?: string
  requiredDocuments?: string
}

export type CommercialComponent =
  | CashCommercialComponent
  | BarterCommercialComponent
  | EquityCommercialComponent
  | ProfitSharingCommercialComponent
  | RevenueSharingCommercialComponent
  | CustomCommercialComponent

export type OpportunityCommercialStructure = {
  primaryMode?: ExchangeMode | CommercialComponentType
  components: CommercialComponent[]
  allocationMethod?: CommercialAllocationMethod
  totalAllocationPercentage?: number
  notes?: string
  constraints?: CommercialConstraint[]
}

export type MatchingExchangeAllocationSummary = {
  type: CommercialComponentType
  percentage?: number
  amount?: number
  currency?: string
}

export type MatchingExchangeProfile = {
  primaryMode: ExchangeMode
  modes: CommercialComponentType[]
  isHybrid: boolean
  allocationMethod?: CommercialAllocationMethod
  allocationSummary: MatchingExchangeAllocationSummary[]
  negotiability: Partial<Record<CommercialComponentType, boolean>>
}

export const COMMERCIAL_COMPONENT_TYPES: readonly CommercialComponentType[] = [
  'cash',
  'barter',
  'profit_sharing',
  'revenue_sharing',
  'equity',
  'custom',
] as const

export const STANDARD_EXCHANGE_MODES: readonly ExchangeMode[] = [
  'cash',
  'barter',
  'equity',
  'profit_sharing',
  'hybrid',
] as const

export function emptyCommercialStructure(): OpportunityCommercialStructure {
  return {
    components: [],
    allocationMethod: 'not_applicable',
    constraints: [],
  }
}
