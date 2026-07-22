import type { OpportunityCollaborationPayload } from '@pm-twin/commands'
import {
  buildOpportunityCollaborationPatch,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { buildValueExchangeDraftPayload } from '@/domain/collaboration/value-exchange-lifecycle.ts'
import {
  buildOpportunityWizardReadinessInput,
  EMPTY_OPPORTUNITY_WIZARD_DRAFT,
  type OpportunityWizardDraft,
} from '@/domain/opportunity-readiness/opportunity-wizard-readiness.ts'
import {
  commercialTermsToExchangeData,
  normalizeCommercialConstraints,
  normalizeCommercialTerms,
  normalizeDeliverables,
  normalizeMilestones,
  normalizeOfferCapacity,
  normalizeResources,
  normalizeRichTimeline,
  normalizeStructuredSkills,
  normalizeTemplateMetadata,
  normalizeWorkPackages,
  skillNames,
  type CommercialConstraints,
  type CommercialTermsByMode,
  type OfferCapacity,
  type OpportunityDeliverable,
  type OpportunityMilestone,
  type OpportunityResource,
  type RichTimeline,
  type StructuredSkill,
  type TemplateMetadata,
  type WorkPackage,
} from '@/domain/opportunity-creation'
import {
  deriveLegacyExchangeMode,
  migrateLegacyExchangeModeToCommercialStructure,
  syncCommercialStructureDerivedFields,
  type OpportunityCommercialStructure,
  emptyCommercialStructure,
} from '@/domain/opportunity-commercial-structure'
import type { Opportunity } from '@/types/domain.ts'

export type OpportunityDraft = {
  title: string
  intent: 'need' | 'offer' | ''
  description: string
  location: string
  serviceArea: string
  mainCollaborationModel: string
  modelType: string
  subModelType: string
  exchangeMode: string
  paymentModes: string[]
  targetRole: string
  sector: string
  /** @deprecated Prefer structuredSkills — kept for wizard-readiness adapter CSV bridge. */
  skills: string
  services: string
  startDate: string
  tenderDeadline: string
  availabilityEndDate: string
  collaborationAttributes: Record<string, unknown>
  preferredPartnerType: string
  attachmentsText: string
  complianceRequirementsText: string
  deliveryMilestonesText: string
  structuredSkills: StructuredSkill[]
  workPackages: WorkPackage[]
  deliverables: OpportunityDeliverable[]
  milestones: OpportunityMilestone[]
  resources: OpportunityResource[]
  capacity: OfferCapacity
  commercialTerms: CommercialTermsByMode
  commercialConstraints: CommercialConstraints
  commercialStructure: OpportunityCommercialStructure
  richTimeline: RichTimeline
  minimumQualifications: string
  certificationsText: string
  portfolioText: string
  experienceLevel: string
  teamSize: string
  templateMetadata: TemplateMetadata
}

export const initialDraft: OpportunityDraft = {
  title: EMPTY_OPPORTUNITY_WIZARD_DRAFT.title ?? '',
  intent: '',
  description: EMPTY_OPPORTUNITY_WIZARD_DRAFT.description ?? '',
  location: EMPTY_OPPORTUNITY_WIZARD_DRAFT.location ?? '',
  serviceArea: '',
  mainCollaborationModel: EMPTY_OPPORTUNITY_WIZARD_DRAFT.mainCollaborationModel ?? '',
  modelType: EMPTY_OPPORTUNITY_WIZARD_DRAFT.modelType ?? '',
  subModelType: EMPTY_OPPORTUNITY_WIZARD_DRAFT.subModelType ?? '',
  exchangeMode: EMPTY_OPPORTUNITY_WIZARD_DRAFT.exchangeMode ?? '',
  paymentModes: [...(EMPTY_OPPORTUNITY_WIZARD_DRAFT.paymentModes ?? [])],
  targetRole: EMPTY_OPPORTUNITY_WIZARD_DRAFT.targetRole ?? '',
  sector: EMPTY_OPPORTUNITY_WIZARD_DRAFT.sector ?? '',
  skills: EMPTY_OPPORTUNITY_WIZARD_DRAFT.skills ?? '',
  services: '',
  startDate: EMPTY_OPPORTUNITY_WIZARD_DRAFT.startDate ?? '',
  tenderDeadline: EMPTY_OPPORTUNITY_WIZARD_DRAFT.tenderDeadline ?? '',
  availabilityEndDate: '',
  collaborationAttributes: {},
  preferredPartnerType: '',
  attachmentsText: '',
  complianceRequirementsText: '',
  deliveryMilestonesText: '',
  structuredSkills: [],
  workPackages: [],
  deliverables: [],
  milestones: [],
  resources: [],
  capacity: {},
  commercialTerms: {},
  commercialConstraints: {},
  commercialStructure: emptyCommercialStructure(),
  richTimeline: {},
  minimumQualifications: '',
  certificationsText: '',
  portfolioText: '',
  experienceLevel: '',
  teamSize: '',
  templateMetadata: {},
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** Prefer a non-empty skills list; empty arrays are treated as absent. */
function coalesceSkills(
  primary: unknown,
  fallback: readonly string[],
): string[] | undefined {
  if (Array.isArray(primary)) {
    const names = primary
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && 'name' in item) {
          return String((item as { name?: unknown }).name ?? '').trim()
        }
        return ''
      })
      .filter(Boolean)
    if (names.length > 0) return names
  }
  return fallback.length > 0 ? [...fallback] : undefined
}

/** Prefer an explicit duration; fall back to rich-timeline estimate. */
function coalesceDuration(
  explicit: unknown,
  estimatedDuration: string | undefined,
): string | number | undefined {
  if (typeof explicit === 'number' && Number.isFinite(explicit) && explicit > 0) {
    return explicit
  }
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim()
  }
  if (estimatedDuration?.trim()) {
    return estimatedDuration.trim()
  }
  return undefined
}

/** Sync legacy exchangeMode / paymentModes from commercial structure. */
export function syncDraftExchangeFromCommercialStructure(
  draft: OpportunityDraft,
): OpportunityDraft {
  const structure = syncCommercialStructureDerivedFields(draft.commercialStructure)
  const legacyMode = deriveLegacyExchangeMode(structure)
  const enabledTypes = structure.components
    .filter((c) => c.enabled)
    .map((c) => c.type)
  const paymentModes = enabledTypes.filter((t) =>
    ['cash', 'barter', 'equity', 'profit_sharing'].includes(t),
  )
  // revenue_sharing / custom contribute to hybrid via deriveLegacyExchangeMode
  const modesForPayment =
    paymentModes.length > 0
      ? paymentModes
      : legacyMode === 'hybrid'
        ? ['hybrid']
        : legacyMode
          ? [legacyMode]
          : []

  return {
    ...draft,
    commercialStructure: structure,
    exchangeMode: legacyMode || draft.exchangeMode,
    paymentModes: modesForPayment.length > 0 ? modesForPayment : draft.paymentModes,
  }
}

export function toWizardDraft(draft: OpportunityDraft): OpportunityWizardDraft {
  const names = skillNames(draft.structuredSkills)
  const milestoneTitles = draft.milestones
    .map((milestone) => milestone.title.trim())
    .filter(Boolean)
  return {
    ...draft,
    skills: names.length > 0 ? names.join(', ') : draft.skills,
    deliveryMilestonesText:
      draft.deliveryMilestonesText.trim()
      || milestoneTitles.join(', '),
    milestones: draft.milestones,
    commercialStructure: draft.commercialStructure,
  }
}

export function opportunityToDraft(existing: Opportunity): OpportunityDraft {
  const attrs = existing.collaborationAttributes ?? {}
  const normalized = existing.normalized ?? {}
  const isOffer = existing.intent === 'offer'
  const scopeSkills =
    isOffer
      ? existing.scope?.offeredSkills ?? existing.scope?.coreSkills
      : existing.scope?.requiredSkills ?? existing.scope?.coreSkills
  const structuredSkills = normalizeStructuredSkills(
    attrs.structuredSkills
      ?? existing.structuredSkills
      ?? scopeSkills
      ?? existing.attributes?.coreSkills
      ?? [],
  )
  const servicesValue = isOffer
    ? normalized.offeredServices
    : normalized.requiredServices
  const services = Array.isArray(servicesValue)
    ? servicesValue.filter((item): item is string => typeof item === 'string').join(', ')
    : typeof servicesValue === 'string'
      ? servicesValue
      : ''
  const capacitySource = attrs.capacity
    ?? (existing.capacity
      ? {
          availableCapacity: existing.capacity.available,
          maximumCapacity: existing.capacity.required,
        }
      : undefined)
  const exchange = existing.exchangeData ?? {}
  const commercialTerms = normalizeCommercialTerms(
    exchange.commercialTerms ?? exchange,
  )
  const commercialStructure = migrateLegacyExchangeModeToCommercialStructure({
    exchangeMode: existing.exchangeMode,
    acceptedExchangeModes: existing.acceptedExchangeModes,
    paymentModes: existing.paymentModes,
    commercialStructure: attrs.commercialStructure as
      | OpportunityCommercialStructure
      | undefined,
    exchangeData: exchange,
    collaborationAttributes: attrs,
    commercialTerms,
  })

  const milestonesFromAttrs = normalizeMilestones(
    attrs.milestones
      ?? existing.deliveryMilestones
      ?? existing.attributes?.deliveryMilestones
      ?? [],
  )
  const legacyDeliveryMilestones =
    existing.deliveryMilestones ?? existing.attributes?.deliveryMilestones
  const deliveryMilestonesText = Array.isArray(legacyDeliveryMilestones)
    ? legacyDeliveryMilestones
        .map((item) => (typeof item === 'string' ? item : item.title ?? ''))
        .filter(Boolean)
        .join(', ')
    : ''

  const draft: OpportunityDraft = {
    title: existing.title ?? '',
    intent:
      existing.intent === 'offer'
        ? 'offer'
        : existing.intent === 'need' || existing.intent === 'request'
          ? 'need'
          : '',
    description: existing.description ?? '',
    location: existing.location ?? '',
    serviceArea: String(attrs.serviceArea ?? ''),
    mainCollaborationModel: existing.mainCollaborationModel ?? '',
    modelType: existing.modelType ?? '',
    subModelType: existing.subModelType ?? '',
    exchangeMode: existing.exchangeMode ?? '',
    paymentModes:
      existing.acceptedExchangeModes ??
      existing.paymentModes ??
      (existing.exchangeMode ? [existing.exchangeMode] : []),
    targetRole:
      (existing as { attributes?: { targetRole?: string } }).attributes?.targetRole ?? '',
    sector: existing.scope?.sectors?.[0] ?? '',
    skills: skillNames(structuredSkills).join(', '),
    services,
    startDate: existing.attributes?.startDate ?? existing.startDate ?? '',
    tenderDeadline: existing.attributes?.tenderDeadline ?? '',
    availabilityEndDate: String(attrs.availabilityEndDate ?? ''),
    collaborationAttributes: attrs,
    preferredPartnerType:
      existing.preferredPartnerType ??
      existing.attributes?.preferredPartnerType ??
      '',
    attachmentsText: Array.isArray(existing.attachments ?? existing.attributes?.attachments)
      ? (existing.attachments ?? existing.attributes?.attachments ?? [])
          .map((item) => (typeof item === 'string' ? item : item.name ?? ''))
          .filter(Boolean)
          .join(', ')
      : '',
    complianceRequirementsText: (existing.complianceRequirements ?? []).join(', '),
    deliveryMilestonesText,
    structuredSkills,
    workPackages: normalizeWorkPackages(attrs.workPackages ?? existing.workPackages),
    deliverables: normalizeDeliverables(attrs.deliverables),
    milestones:
      milestonesFromAttrs.length > 0
        ? milestonesFromAttrs
        : normalizeMilestones(deliveryMilestonesText),
    resources: normalizeResources(attrs.resources),
    capacity: normalizeOfferCapacity(capacitySource),
    commercialTerms,
    commercialConstraints: normalizeCommercialConstraints(
      exchange.commercialConstraints ?? attrs.commercialConstraints,
    ),
    commercialStructure,
    richTimeline: normalizeRichTimeline(attrs.richTimeline),
    minimumQualifications: String(attrs.minimumQualifications ?? ''),
    certificationsText: Array.isArray(attrs.certifications)
      ? (attrs.certifications as string[]).join(', ')
      : String(attrs.certifications ?? ''),
    portfolioText: String(attrs.portfolio ?? ''),
    experienceLevel: String(attrs.experienceLevel ?? ''),
    teamSize: String(attrs.teamSize ?? ''),
    templateMetadata: normalizeTemplateMetadata(attrs.templateMetadata),
  }

  return syncDraftExchangeFromCommercialStructure(draft)
}

export function buildOpportunityDraftInput(
  draft: OpportunityDraft,
): Record<string, unknown> {
  const synced = syncDraftExchangeFromCommercialStructure(draft)
  const skills = skillNames(synced.structuredSkills)
  const legacySkills = skills.length > 0 ? skills : splitCsv(synced.skills)
  const services = splitCsv(synced.services)
  const sectors = synced.sector ? [synced.sector] : []
  const hasCollaborationSelection =
    Boolean(synced.mainCollaborationModel?.trim()) &&
    Boolean(synced.subModelType?.trim()) &&
    Boolean(synced.exchangeMode?.trim())

  const collaborationPatch = hasCollaborationSelection
    ? buildOpportunityCollaborationPatch({
        mainCollaborationModel: synced.mainCollaborationModel,
        modelType: synced.modelType,
        subModelType: synced.subModelType,
        exchangeMode: synced.exchangeMode,
        acceptedExchangeModes: synced.paymentModes,
      })
    : {}

  const base = buildOpportunityWizardReadinessInput(toWizardDraft(synced))
  const exchangePayload = hasCollaborationSelection
    ? buildValueExchangeDraftPayload({
        exchangeMode: synced.exchangeMode,
        paymentModes: synced.paymentModes,
        collaborationAttributes: synced.collaborationAttributes,
      })
    : {}
  const commercialExchange = commercialTermsToExchangeData(
    synced.commercialTerms,
    synced.exchangeMode,
    synced.commercialConstraints,
  )

  const milestoneTitles = synced.milestones
    .map((m) => m.title.trim())
    .filter(Boolean)

  return {
    ...base,
    ...collaborationPatch,
    structuredSkills: synced.structuredSkills,
    workPackages: synced.workPackages,
    capacity: synced.intent === 'offer' ? synced.capacity : undefined,
    scope: {
      ...(base.scope as Record<string, unknown>),
      sectors,
      ...(synced.intent === 'offer'
        ? {
            offeredSkills: legacySkills,
            coreSkills: legacySkills,
          }
        : {
            requiredSkills: legacySkills,
            coreSkills: legacySkills,
          }),
    },
    attributes: {
      ...(base.attributes as Record<string, unknown>),
      targetRole: synced.targetRole,
      startDate: synced.startDate || undefined,
      tenderDeadline: synced.tenderDeadline || undefined,
      requiredSkills: legacySkills,
      ...(synced.intent === 'offer'
        ? { availabilityDate: synced.startDate || undefined }
        : {}),
    },
    collaborationAttributes: {
      ...synced.collaborationAttributes,
      detailedScope:
        synced.collaborationAttributes.detailedScope ?? synced.description,
      requiredSkills: coalesceSkills(
        synced.collaborationAttributes.requiredSkills,
        legacySkills,
      ),
      duration: coalesceDuration(
        synced.collaborationAttributes.duration,
        synced.richTimeline.estimatedDuration,
      ),
      structuredSkills: synced.structuredSkills,
      workPackages: synced.workPackages,
      deliverables: synced.deliverables,
      milestones: synced.milestones,
      resources: synced.resources,
      capacity: synced.intent === 'offer' ? synced.capacity : undefined,
      richTimeline: synced.richTimeline,
      commercialConstraints: synced.commercialConstraints,
      commercialStructure: synced.commercialStructure,
      serviceArea: synced.serviceArea || undefined,
      availabilityEndDate: synced.availabilityEndDate || undefined,
      experienceLevel: synced.experienceLevel || undefined,
      teamSize: synced.teamSize || undefined,
      minimumQualifications: synced.minimumQualifications || undefined,
      certifications: splitCsv(synced.certificationsText),
      portfolio: synced.portfolioText || undefined,
      templateMetadata: synced.templateMetadata,
      startDate:
        (synced.collaborationAttributes.startDate ?? synced.startDate) ||
        undefined,
    },
    exchangeData: {
      ...(base.exchangeData as Record<string, unknown>),
      ...exchangePayload,
      ...commercialExchange,
      ...(synced.exchangeMode ? { exchangeMode: synced.exchangeMode } : {}),
      commercialStructure: synced.commercialStructure,
    },
    deliveryMilestones:
      milestoneTitles.length > 0
        ? synced.milestones.map((m) => ({
            title: m.title,
            targetDate: m.targetDate,
          }))
        : base.deliveryMilestones,
    normalized: {
      ...(synced.intent === 'offer'
        ? { offeredServices: services }
        : { requiredServices: services }),
    },
  }
}

export function buildCollaborationCommandPayload(
  draft: OpportunityDraft,
  creatorId?: string,
): OpportunityCollaborationPayload {
  const synced = syncDraftExchangeFromCommercialStructure(draft)
  const built = buildOpportunityDraftInput(synced)
  const cashComponent = synced.commercialStructure.components.find(
    (component) => component.enabled && component.type === 'cash',
  )
  const budget =
    cashComponent?.type === 'cash'
      ? cashComponent.fixedAmount ??
        cashComponent.maximumAmount ??
        cashComponent.minimumAmount
      : undefined
  return {
    title: synced.title,
    description: synced.description,
    intent:
      synced.intent === 'offer' || synced.intent === 'need'
        ? synced.intent
        : undefined,
    location: synced.location,
    creatorId,
    mainCollaborationModel: synced.mainCollaborationModel,
    modelType: synced.modelType,
    subModelType: synced.subModelType,
    exchangeMode: synced.exchangeMode,
    acceptedExchangeModes: synced.paymentModes,
    collaborationAttributes: built.collaborationAttributes as Record<
      string,
      unknown
    >,
    scope: built.scope as Record<string, unknown>,
    attributes: built.attributes as Record<string, unknown>,
    normalized: built.normalized as Record<string, unknown>,
    exchangeData: built.exchangeData as Record<string, unknown>,
    budget,
    paymentModes: synced.paymentModes,
    preferredPartnerType: synced.preferredPartnerType || undefined,
    attachments: built.attachments as OpportunityCollaborationPayload['attachments'],
    complianceRequirements: built.complianceRequirements as string[] | undefined,
    deliveryMilestones:
      built.deliveryMilestones as OpportunityCollaborationPayload['deliveryMilestones'],
  }
}
