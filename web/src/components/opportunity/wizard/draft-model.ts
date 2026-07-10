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
  type OpportunityResource,
  type RichTimeline,
  type StructuredSkill,
  type TemplateMetadata,
  type WorkPackage,
} from '@/domain/opportunity-creation'
import type { Opportunity } from '@/types/domain.ts'

export type OpportunityDraft = {
  title: string
  intent: 'need' | 'offer' | ''
  description: string
  location: string
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
  collaborationAttributes: Record<string, unknown>
  preferredPartnerType: string
  attachmentsText: string
  complianceRequirementsText: string
  deliveryMilestonesText: string
  structuredSkills: StructuredSkill[]
  workPackages: WorkPackage[]
  resources: OpportunityResource[]
  capacity: OfferCapacity
  commercialTerms: CommercialTermsByMode
  commercialConstraints: CommercialConstraints
  richTimeline: RichTimeline
  minimumQualifications: string
  certificationsText: string
  portfolioText: string
  templateMetadata: TemplateMetadata
}

export const initialDraft: OpportunityDraft = {
  title: EMPTY_OPPORTUNITY_WIZARD_DRAFT.title ?? '',
  intent: '',
  description: EMPTY_OPPORTUNITY_WIZARD_DRAFT.description ?? '',
  location: EMPTY_OPPORTUNITY_WIZARD_DRAFT.location ?? '',
  mainCollaborationModel: EMPTY_OPPORTUNITY_WIZARD_DRAFT.mainCollaborationModel ?? '',
  modelType: EMPTY_OPPORTUNITY_WIZARD_DRAFT.modelType ?? '',
  subModelType: EMPTY_OPPORTUNITY_WIZARD_DRAFT.subModelType ?? '',
  exchangeMode: EMPTY_OPPORTUNITY_WIZARD_DRAFT.exchangeMode ?? '',
  paymentModes: [...(EMPTY_OPPORTUNITY_WIZARD_DRAFT.paymentModes ?? [])],
  targetRole: EMPTY_OPPORTUNITY_WIZARD_DRAFT.targetRole ?? '',
  sector: EMPTY_OPPORTUNITY_WIZARD_DRAFT.sector ?? '',
  skills: EMPTY_OPPORTUNITY_WIZARD_DRAFT.skills ?? '',
  services: EMPTY_OPPORTUNITY_WIZARD_DRAFT.services ?? '',
  startDate: EMPTY_OPPORTUNITY_WIZARD_DRAFT.startDate ?? '',
  tenderDeadline: EMPTY_OPPORTUNITY_WIZARD_DRAFT.tenderDeadline ?? '',
  collaborationAttributes: {},
  preferredPartnerType: '',
  attachmentsText: '',
  complianceRequirementsText: '',
  deliveryMilestonesText: '',
  structuredSkills: [],
  workPackages: [],
  resources: [],
  capacity: {},
  commercialTerms: {},
  commercialConstraints: {},
  richTimeline: {},
  minimumQualifications: '',
  certificationsText: '',
  portfolioText: '',
  templateMetadata: {},
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toWizardDraft(draft: OpportunityDraft): OpportunityWizardDraft {
  const names = skillNames(draft.structuredSkills)
  return {
    ...draft,
    skills: names.length > 0 ? names.join(', ') : draft.skills,
  }
}

export function opportunityToDraft(existing: Opportunity): OpportunityDraft {
  const attrs = existing.collaborationAttributes ?? {}
  const scopeSkills =
    existing.intent === 'offer'
      ? existing.scope?.offeredSkills ?? existing.scope?.coreSkills
      : existing.scope?.requiredSkills ?? existing.scope?.coreSkills
  const structuredSkills = normalizeStructuredSkills(
    attrs.structuredSkills ?? scopeSkills ?? existing.attributes?.coreSkills ?? [],
  )
  const exchange = existing.exchangeData ?? {}
  return {
    title: existing.title ?? '',
    intent: existing.intent === 'offer' ? 'offer' : existing.intent === 'need' ? 'need' : '',
    description: existing.description ?? '',
    location: existing.location ?? '',
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
    services: '',
    startDate: existing.attributes?.startDate ?? '',
    tenderDeadline: existing.attributes?.tenderDeadline ?? '',
    collaborationAttributes: attrs,
    preferredPartnerType:
      existing.preferredPartnerType ??
      existing.attributes?.preferredPartnerType ??
      '',
    attachmentsText: Array.isArray(existing.attachments)
      ? existing.attachments
          .map((item) => (typeof item === 'string' ? item : item.name ?? ''))
          .filter(Boolean)
          .join(', ')
      : '',
    complianceRequirementsText: (existing.complianceRequirements ?? []).join(', '),
    deliveryMilestonesText: Array.isArray(existing.deliveryMilestones)
      ? existing.deliveryMilestones
          .map((item) => (typeof item === 'string' ? item : item.title ?? ''))
          .filter(Boolean)
          .join(', ')
      : '',
    structuredSkills,
    workPackages: normalizeWorkPackages(attrs.workPackages),
    resources: normalizeResources(attrs.resources),
    capacity: normalizeOfferCapacity(attrs.capacity),
    commercialTerms: normalizeCommercialTerms(
      exchange.commercialTerms ?? exchange,
    ),
    commercialConstraints: normalizeCommercialConstraints(
      exchange.commercialConstraints ?? attrs.commercialConstraints,
    ),
    richTimeline: normalizeRichTimeline(attrs.richTimeline),
    minimumQualifications: String(attrs.minimumQualifications ?? ''),
    certificationsText: Array.isArray(attrs.certifications)
      ? (attrs.certifications as string[]).join(', ')
      : String(attrs.certifications ?? ''),
    portfolioText: String(attrs.portfolio ?? ''),
    templateMetadata: normalizeTemplateMetadata(attrs.templateMetadata),
  }
}

export function buildOpportunityDraftInput(
  draft: OpportunityDraft,
): Record<string, unknown> {
  const skills = skillNames(draft.structuredSkills)
  const legacySkills = skills.length > 0 ? skills : splitCsv(draft.skills)
  const services = splitCsv(draft.services)
  const sectors = draft.sector ? [draft.sector] : []
  const hasCollaborationSelection =
    Boolean(draft.mainCollaborationModel?.trim()) &&
    Boolean(draft.subModelType?.trim()) &&
    Boolean(draft.exchangeMode?.trim())

  const collaborationPatch = hasCollaborationSelection
    ? buildOpportunityCollaborationPatch({
        mainCollaborationModel: draft.mainCollaborationModel,
        modelType: draft.modelType,
        subModelType: draft.subModelType,
        exchangeMode: draft.exchangeMode,
        acceptedExchangeModes: draft.paymentModes,
      })
    : {}

  const base = buildOpportunityWizardReadinessInput(toWizardDraft(draft))
  const exchangePayload = hasCollaborationSelection
    ? buildValueExchangeDraftPayload({
        exchangeMode: draft.exchangeMode,
        paymentModes: draft.paymentModes,
        collaborationAttributes: draft.collaborationAttributes,
      })
    : {}
  const commercialExchange = commercialTermsToExchangeData(
    draft.commercialTerms,
    draft.exchangeMode,
    draft.commercialConstraints,
  )

  return {
    ...base,
    ...collaborationPatch,
    structuredSkills: draft.structuredSkills,
    workPackages: draft.workPackages,
    capacity: draft.intent === 'offer' ? draft.capacity : undefined,
    scope: {
      ...(base.scope as Record<string, unknown>),
      sectors,
      ...(draft.intent === 'offer'
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
      targetRole: draft.targetRole,
      startDate: draft.startDate || undefined,
      tenderDeadline: draft.tenderDeadline || undefined,
      requiredSkills: legacySkills,
      ...(draft.intent === 'offer'
        ? { availabilityDate: draft.startDate || undefined }
        : {}),
    },
    collaborationAttributes: {
      ...draft.collaborationAttributes,
      detailedScope:
        draft.collaborationAttributes.detailedScope ?? draft.description,
      requiredSkills:
        draft.collaborationAttributes.requiredSkills ??
        (legacySkills.length > 0 ? legacySkills : undefined),
      structuredSkills: draft.structuredSkills,
      workPackages: draft.workPackages,
      resources: draft.resources,
      capacity: draft.intent === 'offer' ? draft.capacity : undefined,
      richTimeline: draft.richTimeline,
      commercialConstraints: draft.commercialConstraints,
      minimumQualifications: draft.minimumQualifications || undefined,
      certifications: splitCsv(draft.certificationsText),
      portfolio: draft.portfolioText || undefined,
      templateMetadata: draft.templateMetadata,
      startDate:
        (draft.collaborationAttributes.startDate ?? draft.startDate) ||
        undefined,
    },
    exchangeData: {
      ...(base.exchangeData as Record<string, unknown>),
      ...exchangePayload,
      ...commercialExchange,
      ...(draft.exchangeMode ? { exchangeMode: draft.exchangeMode } : {}),
    },
    normalized: {
      ...(draft.intent === 'offer'
        ? { offeredServices: services }
        : { requiredServices: services }),
    },
  }
}

export function buildCollaborationCommandPayload(
  draft: OpportunityDraft,
  creatorId?: string,
): OpportunityCollaborationPayload {
  const built = buildOpportunityDraftInput(draft)
  return {
    title: draft.title,
    description: draft.description,
    intent:
      draft.intent === 'offer' || draft.intent === 'need'
        ? draft.intent
        : undefined,
    location: draft.location,
    creatorId,
    mainCollaborationModel: draft.mainCollaborationModel,
    modelType: draft.modelType,
    subModelType: draft.subModelType,
    exchangeMode: draft.exchangeMode,
    acceptedExchangeModes: draft.paymentModes,
    collaborationAttributes: built.collaborationAttributes as Record<
      string,
      unknown
    >,
    scope: built.scope as Record<string, unknown>,
    attributes: built.attributes as Record<string, unknown>,
    normalized: built.normalized as Record<string, unknown>,
    exchangeData: built.exchangeData as Record<string, unknown>,
    paymentModes: draft.paymentModes,
    preferredPartnerType: draft.preferredPartnerType || undefined,
    attachments: built.attachments as OpportunityCollaborationPayload['attachments'],
    complianceRequirements: built.complianceRequirements as string[] | undefined,
    deliveryMilestones:
      built.deliveryMilestones as OpportunityCollaborationPayload['deliveryMilestones'],
  }
}
