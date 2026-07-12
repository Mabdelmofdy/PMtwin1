/**
 * Central Opportunity Details read model (Experience 4.0).
 * Presentation / normalization only — does not call Matching or Readiness engines
 * beyond existing wrappers; does not mutate domain entities.
 */

import type {
  Application,
  AuditEntry,
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PostMatch,
} from '@/types/domain.ts'
import {
  buildCommercialStructureSummary,
  migrateLegacyExchangeModeToCommercialStructure,
  presentCommercialForAudience,
  type CommercialStructureSummary,
  type OpportunityCommercialStructure,
  type PublicCommercialPresentation,
} from '@/domain/opportunity-commercial-structure'
import {
  normalizeDeliverables,
  normalizeMilestones,
  normalizeResources,
  normalizeStructuredSkills,
  normalizeWorkPackages,
  type OfferCapacity,
  type OpportunityDeliverable,
  type OpportunityMilestone,
  type OpportunityResource,
  type OpportunityTask,
  type RichTimeline,
  type StructuredSkill,
  type WorkPackage,
} from '@/domain/opportunity-creation'
import type { OpportunityReadinessResult } from '@/domain/opportunity-readiness/types.ts'
import {
  deriveMatchingTopology,
  opportunityToCollaborationInput,
  resolveMainCollaborationModelLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import {
  resolveOpportunityHealthState,
  type OpportunityHealthState,
} from '@/components/opportunity/opportunity-health-indicator.tsx'
import { resolveOpportunityReadiness } from '@/components/readiness'
import { evaluateLiveOpportunityValidation } from '@/domain/opportunity-validation/index.ts'
import {
  buildViewerContext,
  findParticipantMatchForOpportunity,
  resolveOpportunityDetailVisibility,
  type OpportunityDetailVisibility,
  type ViewerContext,
} from '@/lib/entity-view-visibility.ts'
import {
  buildOpportunityMatchesReadModel,
  type OpportunityMatchCard,
  type OpportunityMatchesReadModel,
} from '@/lib/opportunity-matches-read-model.ts'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import { resolveOpportunityDetailsCapabilities, type OpportunityDetailsCapabilities } from './opportunity-details-actions.ts'
import { buildOpportunityDetailsHistory, type OpportunityHistoryEvent } from './opportunity-details-history.ts'
import { buildOpportunityDetailsKpis, type OpportunityDetailsKpis } from './opportunity-details-kpis.ts'
import {
  resolveOpportunityDetailsNextAction,
  type NextActionDescriptor,
} from './opportunity-details-next-action.ts'
import {
  buildOpportunityDetailsWorkspaceVisibility,
  type OpportunityDetailsWorkspaceVisibility,
} from './opportunity-details-visibility.ts'
import { formatRelativeUpdatedAt } from './opportunity-details-formatters.ts'

export type OpportunityDetailsDocumentItem = {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly relatedWorkPackageId?: string
  readonly relatedWorkPackageTitle?: string
  readonly visibility: 'public' | 'owner' | 'restricted'
}

export type OpportunityDetailsRelatedObject = {
  readonly id: string
  readonly type: 'match' | 'negotiation' | 'agreement' | 'contract' | 'application'
  readonly title: string
  readonly status?: string
  readonly updatedAt?: string
  readonly href: string
}

export type OpportunityDetailsCollaboration = {
  readonly postIntent?: string
  readonly mainModel?: string
  readonly subModel?: string
  readonly commercialLabel?: string
  readonly matchingTopology?: string
  readonly relationshipType?: string
  readonly lifecycle?: string
  readonly visibilityStatus?: string
}

export type OpportunityDetailsQualifications = {
  readonly experienceLevel?: string
  readonly certifications: readonly string[]
  readonly teamSize?: string
  readonly minimumQualifications?: string
}

export type OpportunityDetailsScope = {
  readonly workPackages: readonly WorkPackage[]
  readonly tasks: readonly OpportunityTask[]
  readonly deliverables: readonly OpportunityDeliverable[]
  readonly milestones: readonly OpportunityMilestone[]
  readonly skills: readonly StructuredSkill[]
  readonly requiredSkills: readonly StructuredSkill[]
  readonly preferredSkills: readonly StructuredSkill[]
  readonly requiredServices: readonly string[]
  readonly offeredServices: readonly string[]
  /** @deprecated Prefer requiredServices / offeredServices */
  readonly services: readonly string[]
  readonly structuredResources: readonly OpportunityResource[]
  readonly resources: readonly string[]
  readonly compliance: readonly string[]
  readonly preferredPartnerType?: string
  readonly capacity?: Opportunity['capacity']
  readonly offerCapacity?: OfferCapacity
  readonly richTimeline?: RichTimeline
  readonly serviceArea?: string
  readonly deliveryMethod?: string
  readonly languages: readonly string[]
  readonly priority?: string
  readonly qualifications: OpportunityDetailsQualifications
}

export type OpportunityDetailsViewer = {
  readonly userId?: string
  readonly role?: string
  readonly isOwner: boolean
  readonly isParticipant: boolean
  readonly isAdmin: boolean
  readonly isAuditor: boolean
}

export type OpportunityDetailsReadModel = {
  readonly opportunity: Opportunity
  readonly viewer: OpportunityDetailsViewer
  readonly visibility: OpportunityDetailVisibility
  readonly workspaceVisibility: OpportunityDetailsWorkspaceVisibility
  readonly collaboration: OpportunityDetailsCollaboration
  readonly readiness: OpportunityReadinessResult & {
    readonly health: OpportunityHealthState
    readonly publishEligible: boolean
  }
  readonly scope: OpportunityDetailsScope
  readonly commercial: {
    readonly structure: OpportunityCommercialStructure
    readonly summary: CommercialStructureSummary | null
    readonly publicSummary: PublicCommercialPresentation | null
    readonly showAmounts: boolean
  }
  readonly matching: {
    readonly model: OpportunityMatchesReadModel | null
    readonly cards: readonly OpportunityMatchCard[]
    readonly count: number
    readonly strongCount: number
    readonly participantMatch?: PostMatch
  }
  readonly related: {
    readonly matches: readonly OpportunityDetailsRelatedObject[]
    readonly negotiations: readonly OpportunityDetailsRelatedObject[]
    readonly agreements: readonly OpportunityDetailsRelatedObject[]
    readonly contracts: readonly OpportunityDetailsRelatedObject[]
    readonly applications: readonly OpportunityDetailsRelatedObject[]
  }
  readonly documents: readonly OpportunityDetailsDocumentItem[]
  readonly history: readonly OpportunityHistoryEvent[]
  readonly capabilities: OpportunityDetailsCapabilities
  readonly kpis: OpportunityDetailsKpis
  readonly nextAction: NextActionDescriptor | null
  readonly creatorName?: string
  readonly updatedLabel?: string
  readonly analyticsAvailable: false
}

export type OpportunityDetailsReadModelDeps = {
  readonly getOpportunity: (id: string) => Opportunity | undefined
  readonly getPostMatchesByOpportunity: (opportunityId: string) => readonly PostMatch[]
  readonly getNegotiationsForPostMatch?: (postMatchId: string) => readonly Negotiation[]
  readonly getDealForPostMatch?: (postMatchId: string) => Deal | undefined
  readonly getContractsForDeal?: (dealId: string) => readonly Contract[]
  readonly getApplicationsForOpportunity?: (opportunityId: string) => readonly Application[]
  readonly getAuditEntries?: () => readonly AuditEntry[]
  readonly getPersonName?: (userId: string) => string | undefined
  readonly viewer: ViewerContext
  readonly showLegacyApplicationsFlag?: boolean
  readonly canMutate?: boolean
  readonly isAuditor?: boolean
}

function attrsOf(opportunity: Opportunity): Record<string, unknown> {
  return (opportunity.collaborationAttributes ?? {}) as Record<string, unknown>
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function asOfferCapacity(value: unknown): OfferCapacity | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (
    'availableCapacity' in record
    || 'maximumCapacity' in record
    || 'reservedCapacity' in record
    || 'availableFrom' in record
  ) {
    return value as OfferCapacity
  }
  return undefined
}

function extractScope(opportunity: Opportunity): OpportunityDetailsScope {
  const attrs = attrsOf(opportunity)
  const normalized = (opportunity.normalized ?? {}) as Record<string, unknown>
  const packages = normalizeWorkPackages(
    attrs.workPackages ?? opportunity.workPackages ?? [],
  )
  const milestones = normalizeMilestones(
    attrs.milestones ?? opportunity.deliveryMilestones ?? opportunity.attributes?.deliveryMilestones ?? [],
  )
  const tasks = packages.flatMap((pkg) => pkg.tasks ?? [])
  const topLevelDeliverables = normalizeDeliverables(attrs.deliverables)

  const skills = normalizeStructuredSkills(
    attrs.structuredSkills
      ?? opportunity.structuredSkills
      ?? opportunity.scope?.coreSkills
      ?? opportunity.attributes?.coreSkills
      ?? [],
  )
  const requiredSkills = skills.filter((s) => s.mandatory)
  const preferredSkills = skills.filter((s) => !s.mandatory)

  const requiredServices = stringList(
    normalized.requiredServices ?? attrs.requiredServices ?? attrs.services,
  )
  const offeredServices = stringList(
    normalized.offeredServices ?? attrs.offeredServices,
  )

  const structuredResources = normalizeResources(attrs.resources)
  const resourceStrings: string[] = structuredResources.map(
    (r) => `${r.name} (${r.type}${r.quantity ? ` · ${r.quantity} ${r.unit}` : ''})`,
  )
  for (const pkg of packages) {
    if (pkg.requiredResources?.trim()) resourceStrings.push(pkg.requiredResources.trim())
    if (pkg.offeredResources?.trim()) resourceStrings.push(pkg.offeredResources.trim())
  }

  const offerCapacity =
    asOfferCapacity(attrs.offerCapacity) ?? asOfferCapacity(attrs.capacity)

  const richTimelineRaw = attrs.richTimeline
  const richTimeline =
    richTimelineRaw && typeof richTimelineRaw === 'object'
      ? (richTimelineRaw as RichTimeline)
      : undefined

  const serviceArea =
    (typeof attrs.serviceArea === 'string' && attrs.serviceArea.trim())
    || (typeof attrs.serviceAreas === 'string' && attrs.serviceAreas.trim())
    || (Array.isArray(attrs.serviceAreas) ? stringList(attrs.serviceAreas).join(', ') : undefined)
    || richTimeline?.serviceAreas?.join(', ')
    || undefined

  const deliveryMethod =
    richTimeline?.deliveryMethod
    || opportunity.workMode
    || undefined

  const languages = stringList(attrs.languages)
  const priority =
    typeof attrs.priority === 'string' && attrs.priority.trim()
      ? attrs.priority.trim()
      : undefined

  const certifications = stringList(
    attrs.certifications ?? attrs.requiredCertifications,
  )
  const qualifications: OpportunityDetailsQualifications = {
    experienceLevel:
      typeof attrs.experienceLevel === 'string' ? attrs.experienceLevel : undefined,
    certifications,
    teamSize: attrs.teamSize != null ? String(attrs.teamSize) : undefined,
    minimumQualifications:
      typeof attrs.minimumQualifications === 'string'
        ? attrs.minimumQualifications
        : undefined,
  }

  const compliance = [
    ...(opportunity.complianceRequirements ?? []),
    ...packages
      .map((pkg) => pkg.complianceRequirements?.trim())
      .filter((value): value is string => Boolean(value)),
  ]

  return {
    workPackages: packages,
    tasks,
    deliverables: topLevelDeliverables,
    milestones,
    skills,
    requiredSkills,
    preferredSkills,
    requiredServices,
    offeredServices,
    services: [...requiredServices, ...offeredServices],
    structuredResources,
    resources: [...new Set(resourceStrings)],
    compliance: [...new Set(compliance)],
    preferredPartnerType:
      opportunity.preferredPartnerType
      ?? opportunity.attributes?.preferredPartnerType,
    capacity: opportunity.capacity,
    offerCapacity,
    richTimeline,
    serviceArea,
    deliveryMethod,
    languages,
    priority,
    qualifications,
  }
}

function extractDocuments(
  opportunity: Opportunity,
  scope: OpportunityDetailsScope,
): OpportunityDetailsDocumentItem[] {
  const items: OpportunityDetailsDocumentItem[] = []
  const attrs = attrsOf(opportunity)
  const attachments = [
    ...(opportunity.attachments ?? []),
    ...(opportunity.attributes?.attachments ?? []),
  ]
  attachments.forEach((attachment, index) => {
    const name = typeof attachment === 'string'
      ? attachment
      : attachment.name
    if (!name?.trim()) return
    items.push({
      id: `att-${index}-${name}`,
      name: name.trim(),
      category: 'Attachments',
      visibility: 'owner',
    })
  })

  const portfolio = stringList(attrs.portfolio ?? attrs.portfolioReferences)
  portfolio.forEach((name, index) => {
    items.push({
      id: `portfolio-${index}-${name}`,
      name,
      category: 'Portfolio',
      visibility: 'owner',
    })
  })

  for (const pkg of scope.workPackages) {
    for (const doc of pkg.requiredDocuments ?? []) {
      const name = typeof doc === 'string' ? doc : doc.name
      if (!name?.trim()) continue
      items.push({
        id: `wp-req-${pkg.id}-${name}`,
        name: name.trim(),
        category: 'Compliance',
        relatedWorkPackageId: pkg.id,
        relatedWorkPackageTitle: pkg.title,
        visibility: 'owner',
      })
    }
    for (const doc of pkg.optionalDocuments ?? []) {
      const name = typeof doc === 'string' ? doc : doc.name
      if (!name?.trim()) continue
      items.push({
        id: `wp-opt-${pkg.id}-${name}`,
        name: name.trim(),
        category: 'Other Documents',
        relatedWorkPackageId: pkg.id,
        relatedWorkPackageTitle: pkg.title,
        visibility: 'owner',
      })
    }
  }

  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.category}:${item.name}:${item.relatedWorkPackageId ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function flattenDeliverables(scope: OpportunityDetailsScope): OpportunityDeliverable[] {
  const fromPackages = scope.workPackages.flatMap((pkg) =>
    (pkg.deliverables ?? []).map((d) => ({
      ...d,
      workPackageId: d.workPackageId ?? pkg.id,
    })),
  )
  const seen = new Set(fromPackages.map((d) => d.id))
  const topLevel = scope.deliverables.filter((d) => !seen.has(d.id))
  return [...fromPackages, ...topLevel]
}

export function buildOpportunityDetailsReadModel(
  opportunityId: string,
  deps: OpportunityDetailsReadModelDeps,
): OpportunityDetailsReadModel | null {
  const opportunity = deps.getOpportunity(opportunityId)
  if (!opportunity) return null

  const postMatches = deps.getPostMatchesByOpportunity(opportunityId)
  const visibility = resolveOpportunityDetailVisibility(opportunity, deps.viewer, {
    postMatches,
    showLegacyApplicationsFlag: deps.showLegacyApplicationsFlag,
  })

  const isOwner = visibility.access === 'owner'
  const isAdmin = visibility.access === 'admin'
  const participantMatch = findParticipantMatchForOpportunity(
    opportunityId,
    postMatches,
    deps.viewer,
  )
  const isParticipant = Boolean(participantMatch) && !isOwner
  const isAuditor = Boolean(deps.isAuditor)

  const workspaceVisibility = buildOpportunityDetailsWorkspaceVisibility(visibility, {
    isAuditor,
  })

  const collabInput = opportunityToCollaborationInput(opportunity)
  const topology = deriveMatchingTopology(collabInput)
  const commercialStructure = migrateLegacyExchangeModeToCommercialStructure(
    opportunity as Parameters<typeof migrateLegacyExchangeModeToCommercialStructure>[0],
  )
  const commercialSummary =
    commercialStructure.components.some((c) => c.enabled)
      ? buildCommercialStructureSummary(commercialStructure)
      : null
  const publicSummary = presentCommercialForAudience(
    commercialStructure,
    workspaceVisibility.commercialAudience,
  )

  const scopeRaw = extractScope(opportunity)
  const scope: OpportunityDetailsScope = {
    ...scopeRaw,
    deliverables: flattenDeliverables(scopeRaw),
  }

  const readiness = resolveOpportunityReadiness(opportunity)
  const liveValidation = evaluateLiveOpportunityValidation(opportunity)
  const validationErrorCount = liveValidation
    ? liveValidation.issues.filter(
        (i) => i.severity === 'error' || i.severity === 'blocker',
      ).length
    : 0

  const health = resolveOpportunityHealthState({
    status: opportunity.status,
    visibilityStatus: opportunity.visibilityStatus,
    errorCount: validationErrorCount,
    publishReady: readiness.missingRequired.length === 0,
  })

  const matchingModel = visibility.showMatchingSection
    ? buildOpportunityMatchesReadModel(opportunityId, {
        getPostMatchesByOpportunity: deps.getPostMatchesByOpportunity,
        getOpportunity: deps.getOpportunity,
        getNegotiationsForPostMatch: deps.getNegotiationsForPostMatch,
        getDealForPostMatch: deps.getDealForPostMatch,
        getPersonName: deps.getPersonName,
        currentUserId: deps.viewer.userId ?? null,
        canMutate: deps.canMutate !== false && !isAuditor,
      })
    : null

  const cards = matchingModel?.matches ?? []
  const matchScores = cards.map((card) => card.match.matchScore)

  const relatedMatches: OpportunityDetailsRelatedObject[] = workspaceVisibility.canViewRelatedObjectExistence
    ? cards.map((card) => ({
        id: card.match.id,
        type: 'match' as const,
        title: card.matchTypeLabel || card.statusLabel,
        status: card.statusLabel,
        href: card.detailPath,
      }))
    : []

  const negotiations: OpportunityDetailsRelatedObject[] = []
  const agreements: OpportunityDetailsRelatedObject[] = []
  const contracts: OpportunityDetailsRelatedObject[] = []

  if (workspaceVisibility.canViewRelatedObjectExistence) {
    for (const card of cards) {
      if (card.actions.negotiationId) {
        negotiations.push({
          id: card.actions.negotiationId,
          type: 'negotiation',
          title: 'Negotiation',
          status: card.actions.negotiation?.status,
          href: `/negotiations/${card.actions.negotiationId}`,
        })
      }
      if (card.actions.dealId) {
        agreements.push({
          id: card.actions.dealId,
          type: 'agreement',
          title: 'Commercial Agreement',
          href: `/commercial-agreements/${card.actions.dealId}`,
        })
        const dealContracts = deps.getContractsForDeal?.(card.actions.dealId) ?? []
        for (const contract of dealContracts) {
          contracts.push({
            id: contract.id,
            type: 'contract',
            title: 'Contract',
            status: contract.status,
            href: `/contracts/${contract.id}`,
          })
        }
      }
    }
  }

  const applications: OpportunityDetailsRelatedObject[] =
    visibility.showLegacyApplications && workspaceVisibility.canViewRelatedObjectExistence
      ? (deps.getApplicationsForOpportunity?.(opportunityId) ?? []).map((app) => ({
          id: app.id,
          type: 'application' as const,
          title: 'Application',
          status: app.status,
          updatedAt: app.updatedAt,
          href: `/opportunities/${opportunityId}?workspace=related`,
        }))
      : []

  const capabilities = resolveOpportunityDetailsCapabilities({
    opportunity,
    visibility,
    userId: deps.viewer.userId,
    canMutate: deps.canMutate !== false && !isAuditor,
    isAuditor,
    canViewCommercialAmounts: workspaceVisibility.canViewCommercialAmounts,
  })

  const kpis = buildOpportunityDetailsKpis({
    opportunity,
    readiness,
    healthState: health,
    workPackageCount: scope.workPackages.length,
    taskCount: scope.tasks.length,
    deliverableCount: scope.deliverables.length,
    milestoneCount: scope.milestones.length,
    matchCount: cards.length,
    matchScores,
    matchingAvailable: workspaceVisibility.matching !== 'restricted',
    commercialSummary,
    allocationMethod: commercialStructure.allocationMethod,
    validationErrorCount,
    publishReady: readiness.missingRequired.length === 0,
  })

  const status = resolveCanonicalStatus('opportunity', opportunity.status)
  const relatedContracts = workspaceVisibility.canViewRelatedObjectExistence
    ? contracts
    : []

  const primaryContractId = relatedContracts[0]?.id ?? null

  const nextAction = resolveOpportunityDetailsNextAction({
    capabilities,
    opportunityId,
    isDraft: status === 'draft',
    blockersCount: readiness.missingRequired.length,
    matchCount: cards.length,
    topCard: cards[0],
    showRecommendedActions: visibility.showRecommendedActions,
    contractId: primaryContractId,
    opportunityStatus: opportunity.status,
  })

  const auditEntries = (deps.getAuditEntries?.() ?? []).filter(
    (entry) => entry.entityId === opportunityId || entry.entityType === 'opportunity',
  )

  const history = capabilities.canViewHistory
    ? buildOpportunityDetailsHistory({
        opportunity,
        auditEntries,
        matchCount: workspaceVisibility.canViewRelatedObjectExistence ? cards.length : undefined,
        negotiationCount: workspaceVisibility.canViewRelatedObjectExistence
          ? negotiations.length
          : undefined,
        agreementCount: workspaceVisibility.canViewRelatedObjectExistence
          ? agreements.length
          : undefined,
        contractCount: workspaceVisibility.canViewRelatedObjectExistence
          ? contracts.length
          : undefined,
        includeAuditorMetadata: isAuditor || isAdmin,
      })
    : []

  const documents = workspaceVisibility.documents === 'restricted'
    ? []
    : extractDocuments(opportunity, scope)

  const relationshipType =
    typeof attrsOf(opportunity).relationshipType === 'string'
      ? String(attrsOf(opportunity).relationshipType)
      : typeof attrsOf(opportunity).businessRelationship === 'string'
        ? String(attrsOf(opportunity).businessRelationship)
        : undefined

  return {
    opportunity,
    viewer: {
      userId: deps.viewer.userId ?? undefined,
      role: deps.viewer.role ?? undefined,
      isOwner,
      isParticipant,
      isAdmin,
      isAuditor,
    },
    visibility,
    workspaceVisibility,
    collaboration: {
      postIntent: formatOpportunityIntent(opportunity.intent) || undefined,
      mainModel: opportunity.mainCollaborationModel
        ? (resolveMainCollaborationModelLabel(opportunity.mainCollaborationModel)
          || opportunity.mainCollaborationModel)
        : undefined,
      subModel: opportunity.subModelType
        ? (resolveSubModelLabel(opportunity.subModelType) || opportunity.subModelType)
        : undefined,
      commercialLabel: commercialSummary?.derivedExchangeMode
        ?? (opportunity.exchangeMode
          ? formatCollaborationExchangeMode(opportunity.exchangeMode)
          : undefined),
      matchingTopology: topology?.topology
        ? formatFrameworkMatchTypeLabel(topology.topology)
        : opportunity.preferredMatchingTopology
          ? formatFrameworkMatchTypeLabel(opportunity.preferredMatchingTopology)
          : undefined,
      relationshipType,
      lifecycle: status,
      visibilityStatus: opportunity.visibilityStatus,
    },
    readiness: {
      ...readiness,
      health,
      publishEligible: readiness.missingRequired.length === 0 && status === 'draft',
    },
    scope,
    commercial: {
      structure: commercialStructure,
      summary: commercialSummary,
      publicSummary,
      showAmounts: workspaceVisibility.canViewCommercialAmounts,
    },
    matching: {
      model: matchingModel,
      cards,
      count: cards.length,
      strongCount: kpis.matching.strongCount ?? 0,
      participantMatch: participantMatch,
    },
    related: {
      matches: relatedMatches,
      negotiations,
      agreements,
      contracts,
      applications,
    },
    documents,
    history,
    capabilities,
    kpis,
    nextAction,
    creatorName: opportunity.creatorId
      ? deps.getPersonName?.(opportunity.creatorId)
      : undefined,
    updatedLabel: formatRelativeUpdatedAt(opportunity.updatedAt),
    analyticsAvailable: false,
  }
}

export { buildViewerContext }
