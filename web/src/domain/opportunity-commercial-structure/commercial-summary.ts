/** Compact commercial summary for review, detail, and cards. */

import { commercialComponentLabel } from './component-types.ts'
import { deriveLegacyExchangeMode } from './legacy-migration.ts'
import type {
  CommercialComponent,
  OpportunityCommercialStructure,
} from './types.ts'

export type CommercialStructureSummary = {
  derivedExchangeMode: string
  isHybrid: boolean
  componentLabels: string[]
  allocationLines: string[]
  linkedWorkPackageCount: number
  linkedMilestoneCount: number
  notes?: string
  previewLines: string[]
}

function cashPreview(c: CommercialComponent): string[] {
  if (c.type !== 'cash') return []
  const lines: string[] = []
  if (c.fixedAmount != null) {
    lines.push(`${c.currency ?? 'SAR'} ${c.fixedAmount.toLocaleString('en-GB')}`)
  }
  if (c.advancePercentage != null) lines.push(`${c.advancePercentage}% advance`)
  if (c.retentionPercentage != null) {
    lines.push(`${c.retentionPercentage}% retention`)
  }
  const schedule = c.paymentSchedule ?? []
  if (schedule.length > 0) {
    lines.push(`${schedule.length} payment milestone(s)`)
  }
  return lines
}

function componentPreview(c: CommercialComponent): string[] {
  switch (c.type) {
    case 'cash':
      return cashPreview(c)
    case 'profit_sharing':
      return [
        c.profitSharePercentage != null
          ? `${c.profitSharePercentage}% of ${c.grossOrNet ?? 'net'} profit`
          : 'Profit sharing',
        c.settlementPeriod ? `${c.settlementPeriod} settlement` : '',
      ].filter(Boolean)
    case 'revenue_sharing':
      return [
        c.revenueSharePercentage != null
          ? `${c.revenueSharePercentage}% revenue share`
          : 'Revenue sharing',
        c.revenueDefinition ?? '',
      ].filter(Boolean)
    case 'equity':
      return [
        c.equityPercentage != null
          ? `${c.equityPercentage}% equity`
          : c.equityType ?? 'Equity',
        c.companyOrSpv === 'spv' ? 'SPV' : '',
      ].filter(Boolean)
    case 'barter':
      return [
        c.offeredAssetOrService
          ? `Offers: ${c.offeredAssetOrService}`
          : 'Barter',
        c.requestedAssetOrService
          ? `Requests: ${c.requestedAssetOrService}`
          : '',
      ].filter(Boolean)
    case 'custom':
      return [c.description || c.title || 'Custom'].filter(Boolean)
  }
}

export function buildCommercialStructureSummary(
  structure: OpportunityCommercialStructure,
): CommercialStructureSummary {
  const enabled = structure.components.filter((c) => c.enabled)
  const derived = deriveLegacyExchangeMode(structure)
  const wpIds = new Set<string>()
  const milestoneIds = new Set<string>()
  for (const c of enabled) {
    for (const id of c.applicableWorkPackageIds ?? []) wpIds.add(id)
    for (const id of c.applicableMilestoneIds ?? []) milestoneIds.add(id)
  }

  const allocationLines =
    structure.allocationMethod === 'percentage'
      ? enabled.map(
          (c) =>
            `${commercialComponentLabel(c.type)} ${c.allocationPercentage ?? 0}%`,
        )
      : structure.allocationMethod === 'fixed'
        ? enabled.map((c) => {
            const amt = c.allocationAmount
            return amt
              ? `${commercialComponentLabel(c.type)} ${amt.currency} ${amt.amount.toLocaleString('en-GB')}`
              : commercialComponentLabel(c.type)
          })
        : enabled.map((c) => commercialComponentLabel(c.type))

  const previewLines: string[] = []
  if (derived === 'hybrid' || enabled.length > 1) {
    previewLines.push('Hybrid')
  } else if (derived) {
    previewLines.push(commercialComponentLabel(enabled[0]!.type))
  }
  for (const c of enabled) {
    previewLines.push(commercialComponentLabel(c.type))
    previewLines.push(...componentPreview(c).map((line) => `  ${line}`))
  }

  return {
    derivedExchangeMode: derived || 'unset',
    isHybrid: enabled.length > 1 || derived === 'hybrid',
    componentLabels: enabled.map((c) => commercialComponentLabel(c.type)),
    allocationLines,
    linkedWorkPackageCount: wpIds.size,
    linkedMilestoneCount: milestoneIds.size,
    notes: structure.notes,
    previewLines,
  }
}
