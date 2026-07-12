/** Commercial component factory helpers. */

import type {
  BarterCommercialComponent,
  CashCommercialComponent,
  CommercialComponent,
  CommercialComponentType,
  CustomCommercialComponent,
  EquityCommercialComponent,
  ProfitSharingCommercialComponent,
  RevenueSharingCommercialComponent,
} from './types.ts'

export function createEmptyCashComponent(id: string): CashCommercialComponent {
  return {
    id,
    type: 'cash',
    title: 'Cash',
    enabled: true,
    appliesTo: 'entire_opportunity',
    currency: 'SAR',
    budgetType: 'to_be_negotiated',
    paymentSchedule: [],
  }
}

export function createEmptyBarterComponent(id: string): BarterCommercialComponent {
  return {
    id,
    type: 'barter',
    title: 'Barter',
    enabled: true,
    appliesTo: 'entire_opportunity',
  }
}

export function createEmptyProfitSharingComponent(
  id: string,
): ProfitSharingCommercialComponent {
  return {
    id,
    type: 'profit_sharing',
    title: 'Profit Sharing',
    enabled: true,
    appliesTo: 'entire_opportunity',
  }
}

export function createEmptyRevenueSharingComponent(
  id: string,
): RevenueSharingCommercialComponent {
  return {
    id,
    type: 'revenue_sharing',
    title: 'Revenue Sharing',
    enabled: true,
    appliesTo: 'entire_opportunity',
  }
}

export function createEmptyEquityComponent(id: string): EquityCommercialComponent {
  return {
    id,
    type: 'equity',
    title: 'Equity',
    enabled: true,
    appliesTo: 'entire_opportunity',
  }
}

export function createEmptyCustomComponent(id: string): CustomCommercialComponent {
  return {
    id,
    type: 'custom',
    title: 'Custom',
    enabled: true,
    appliesTo: 'entire_opportunity',
  }
}

export function createEmptyCommercialComponent(
  type: CommercialComponentType,
  id: string,
): CommercialComponent {
  switch (type) {
    case 'cash':
      return createEmptyCashComponent(id)
    case 'barter':
      return createEmptyBarterComponent(id)
    case 'profit_sharing':
      return createEmptyProfitSharingComponent(id)
    case 'revenue_sharing':
      return createEmptyRevenueSharingComponent(id)
    case 'equity':
      return createEmptyEquityComponent(id)
    case 'custom':
      return createEmptyCustomComponent(id)
  }
}

export function commercialComponentLabel(type: CommercialComponentType): string {
  switch (type) {
    case 'cash':
      return 'Cash'
    case 'barter':
      return 'Barter'
    case 'profit_sharing':
      return 'Profit Sharing'
    case 'revenue_sharing':
      return 'Revenue Sharing'
    case 'equity':
      return 'Equity'
    case 'custom':
      return 'Custom'
  }
}
