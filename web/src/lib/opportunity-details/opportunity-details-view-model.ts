/** Header / presentation view-model helpers for Opportunity Details 4.0. */

import type { OpportunityDetailsReadModel } from './opportunity-details-read-model.ts'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'

export type ExecutiveHeaderViewModel = {
  readonly title: string
  readonly status?: string
  readonly visibilityStatus?: string
  readonly postIntent?: string
  readonly mainModel?: string
  readonly subModel?: string
  readonly commercialLabel?: string
  readonly matchingTopology?: string
  readonly ownerLabel?: string
  readonly createdByLabel?: string
  readonly location?: string
  readonly readinessLabel?: string
  readonly workPackageCount?: number
  readonly matchCountLabel?: string
  readonly updatedLabel?: string
}

export function buildExecutiveHeaderViewModel(
  model: OpportunityDetailsReadModel,
): ExecutiveHeaderViewModel {
  const { opportunity, collaboration, kpis, capabilities, creatorName, updatedLabel } = model
  return {
    title: opportunity.title,
    status: collaboration.lifecycle,
    visibilityStatus: collaboration.visibilityStatus,
    postIntent: collaboration.postIntent,
    mainModel: collaboration.mainModel,
    subModel: collaboration.subModel,
    commercialLabel: collaboration.commercialLabel,
    matchingTopology: collaboration.matchingTopology,
    ownerLabel: model.ownerPartyName ?? creatorName,
    createdByLabel: creatorName,
    location: opportunity.location ?? opportunity.city,
    readinessLabel: capabilities.canViewReadinessDetails
      ? `${formatReadinessScorePercent(kpis.readiness.score)} Ready`
      : undefined,
    workPackageCount: kpis.scope.workPackageCount,
    matchCountLabel:
      kpis.matching.available && kpis.matching.count != null
        ? `${kpis.matching.count} Match${kpis.matching.count === 1 ? '' : 'es'}`
        : undefined,
    updatedLabel,
  }
}

export type CollaborationLayerRow = {
  readonly label: string
  readonly value: string
}

export function buildCollaborationLayerRows(
  model: OpportunityDetailsReadModel,
): readonly CollaborationLayerRow[] {
  const c = model.collaboration
  const rows: CollaborationLayerRow[] = []
  if (c.postIntent) rows.push({ label: 'Post Intent', value: c.postIntent })
  if (c.mainModel) rows.push({ label: 'Main Model', value: c.mainModel })
  if (c.subModel) rows.push({ label: 'Sub-model', value: c.subModel })
  if (c.commercialLabel) rows.push({ label: 'Commercial Structure', value: c.commercialLabel })
  if (c.matchingTopology) rows.push({ label: 'Matching Topology', value: c.matchingTopology })
  if (c.relationshipType) rows.push({ label: 'Relationship', value: c.relationshipType })
  if (c.lifecycle) rows.push({ label: 'Lifecycle', value: c.lifecycle })
  return rows
}
