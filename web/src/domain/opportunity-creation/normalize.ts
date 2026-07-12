import type {
  OpportunityDeliverable,
  OpportunityMilestone,
  OpportunityResource,
  OpportunityTask,
  OfferCapacity,
  StructuredSkill,
  WorkPackage,
  WorkPackageDocumentRequirement,
  CommercialConstraints,
  RichTimeline,
  CommercialTermsByMode,
  TemplateMetadata,
} from './types.ts'
import { createId } from './types.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** Coerce legacy string / string[] / StructuredSkill[] into StructuredSkill[]. */
export function normalizeStructuredSkills(value: unknown): StructuredSkill[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): StructuredSkill | null => {
      if (typeof item === 'string') {
        const name = item.trim()
        if (!name) return null
        return {
          name,
          level: 'intermediate',
          certificationRequired: false,
          mandatory: true,
        }
      }
      if (!isRecord(item)) return null
      const name = String(item.name ?? '').trim()
      if (!name) return null
      const levelRaw = String(item.level ?? 'intermediate').toLowerCase()
      const level =
        levelRaw === 'basic' || levelRaw === 'expert' ? levelRaw : 'intermediate'
      return {
        name,
        level,
        yearsRequired:
          typeof item.yearsRequired === 'number'
            ? item.yearsRequired
            : item.yearsRequired != null
              ? Number(item.yearsRequired) || undefined
              : undefined,
        certificationRequired: Boolean(item.certificationRequired),
        mandatory: item.mandatory !== false,
      }
    })
    .filter((item): item is StructuredSkill => item != null)
}

/** Extract skill names for readiness adapters (algorithms unchanged). */
export function skillNames(skills: readonly StructuredSkill[]): string[] {
  return skills.map((s) => s.name.trim()).filter(Boolean)
}

/** Coerce legacy string / Deliverable[] into OpportunityDeliverable[]. */
export function normalizeDeliverables(
  value: unknown,
  workPackageId?: string | null,
): OpportunityDeliverable[] {
  if (!Array.isArray(value)) {
    if (typeof value === 'string' && value.trim()) {
      return [
        {
          id: createId('dlv'),
          title: value.trim(),
          acceptanceCriteria: '',
          mandatory: true,
          sortOrder: 0,
          workPackageId: workPackageId ?? null,
        },
      ]
    }
    return []
  }
  return value
    .map((item, index): OpportunityDeliverable | null => {
      if (typeof item === 'string') {
        const title = item.trim()
        if (!title) return null
        return {
          id: createId('dlv'),
          title,
          acceptanceCriteria: '',
          mandatory: true,
          sortOrder: index,
          workPackageId: workPackageId ?? null,
        }
      }
      if (!isRecord(item)) return null
      const title = String(item.title ?? '').trim()
      if (!title) return null
      return {
        id: String(item.id ?? createId('dlv')),
        title,
        description: item.description ? String(item.description) : undefined,
        type: item.type ? String(item.type) : undefined,
        quantity:
          item.quantity != null ? Number(item.quantity) || undefined : undefined,
        unit: item.unit ? String(item.unit) : undefined,
        dueDate: item.dueDate ? String(item.dueDate) : undefined,
        acceptanceCriteria: String(item.acceptanceCriteria ?? ''),
        requiredDocuments: Array.isArray(item.requiredDocuments)
          ? item.requiredDocuments.map(String)
          : undefined,
        reviewMethod: item.reviewMethod ? String(item.reviewMethod) : undefined,
        approvalRequired: Boolean(item.approvalRequired),
        workPackageId:
          item.workPackageId != null
            ? String(item.workPackageId)
            : workPackageId ?? null,
        taskId: item.taskId != null ? String(item.taskId) : null,
        milestoneId: item.milestoneId != null ? String(item.milestoneId) : null,
        deliveryLocation: item.deliveryLocation
          ? String(item.deliveryLocation)
          : undefined,
        responsiblePartyType: item.responsiblePartyType
          ? String(item.responsiblePartyType)
          : undefined,
        attachmentRequirements: item.attachmentRequirements
          ? String(item.attachmentRequirements)
          : undefined,
        notes: item.notes ? String(item.notes) : undefined,
        mandatory: item.mandatory !== false,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
        milestoneReference: item.milestoneReference
          ? String(item.milestoneReference)
          : undefined,
      }
    })
    .filter((item): item is OpportunityDeliverable => item != null)
}

function normalizeDocReqs(value: unknown): WorkPackageDocumentRequirement[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): WorkPackageDocumentRequirement | null => {
      if (typeof item === 'string') {
        const name = item.trim()
        return name ? { name } : null
      }
      if (!isRecord(item)) return null
      const name = String(item.name ?? '').trim()
      if (!name) return null
      return {
        name,
        notes: item.notes ? String(item.notes) : undefined,
      }
    })
    .filter((item): item is WorkPackageDocumentRequirement => item != null)
}

export function normalizeTasks(
  value: unknown,
  workPackageId: string,
): OpportunityTask[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index): OpportunityTask | null => {
      if (!isRecord(item)) return null
      const title = String(item.title ?? '').trim()
      return {
        id: String(item.id ?? createId('task')),
        workPackageId: String(item.workPackageId ?? workPackageId),
        title,
        description: item.description ? String(item.description) : undefined,
        taskType: item.taskType ? String(item.taskType) : undefined,
        requiredSkills: normalizeStructuredSkills(item.requiredSkills),
        requiredServices: Array.isArray(item.requiredServices)
          ? item.requiredServices.map(String)
          : undefined,
        ownerType: item.ownerType ? String(item.ownerType) : undefined,
        duration: item.duration ? String(item.duration) : undefined,
        startDate: item.startDate ? String(item.startDate) : undefined,
        endDate: item.endDate ? String(item.endDate) : undefined,
        dependencyTaskId: item.dependencyTaskId
          ? String(item.dependencyTaskId)
          : undefined,
        priority: item.priority ? String(item.priority) : undefined,
        acceptanceCriteria: item.acceptanceCriteria
          ? String(item.acceptanceCriteria)
          : undefined,
        estimatedEffort: item.estimatedEffort
          ? String(item.estimatedEffort)
          : undefined,
        estimatedQuantity:
          item.estimatedQuantity != null
            ? Number(item.estimatedQuantity) || undefined
            : undefined,
        location: item.location ? String(item.location) : undefined,
        relatedDeliverableIds: Array.isArray(item.relatedDeliverableIds)
          ? item.relatedDeliverableIds.map(String)
          : undefined,
        relatedMilestoneIds: Array.isArray(item.relatedMilestoneIds)
          ? item.relatedMilestoneIds.map(String)
          : undefined,
        requiredResources: item.requiredResources
          ? String(item.requiredResources)
          : undefined,
        status: item.status ? String(item.status) : undefined,
        notes: item.notes ? String(item.notes) : undefined,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
      }
    })
    .filter((item): item is OpportunityTask => item != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function normalizeMilestones(value: unknown): OpportunityMilestone[] {
  if (!Array.isArray(value)) {
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((title, index) => ({
          id: createId('ms'),
          title: title.trim(),
          sortOrder: index,
          relatedWorkPackageIds: [],
          relatedTaskIds: [],
          relatedDeliverableIds: [],
        }))
        .filter((m) => m.title)
    }
    return []
  }
  return value
    .map((item, index): OpportunityMilestone | null => {
      if (typeof item === 'string') {
        const title = item.trim()
        if (!title) return null
        return {
          id: createId('ms'),
          title,
          sortOrder: index,
          relatedWorkPackageIds: [],
          relatedTaskIds: [],
          relatedDeliverableIds: [],
        }
      }
      if (!isRecord(item)) return null
      const title = String(item.title ?? '').trim()
      if (!title && !item.id) return null
      return {
        id: String(item.id ?? createId('ms')),
        title: title || 'Milestone',
        description: item.description ? String(item.description) : undefined,
        targetDate: item.targetDate ? String(item.targetDate) : undefined,
        completionCriteria: item.completionCriteria
          ? String(item.completionCriteria)
          : undefined,
        relatedWorkPackageIds: Array.isArray(item.relatedWorkPackageIds)
          ? item.relatedWorkPackageIds.map(String)
          : [],
        relatedTaskIds: Array.isArray(item.relatedTaskIds)
          ? item.relatedTaskIds.map(String)
          : [],
        relatedDeliverableIds: Array.isArray(item.relatedDeliverableIds)
          ? item.relatedDeliverableIds.map(String)
          : [],
        approvalRequired: Boolean(item.approvalRequired),
        commercialTrigger: Boolean(item.commercialTrigger),
        paymentTrigger: Boolean(item.paymentTrigger),
        notes: item.notes ? String(item.notes) : undefined,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
      }
    })
    .filter((item): item is OpportunityMilestone => item != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function normalizeWorkPackages(value: unknown): WorkPackage[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index): WorkPackage | null => {
      if (!isRecord(item)) return null
      const title = String(item.title ?? '').trim()
      const id = String(item.id ?? `wp-${index}`)
      return {
        id,
        title,
        description: String(item.description ?? ''),
        scope: item.scope ? String(item.scope) : undefined,
        packageType: item.packageType ? String(item.packageType) : undefined,
        requiredSkills: normalizeStructuredSkills(item.requiredSkills),
        requiredServices: Array.isArray(item.requiredServices)
          ? item.requiredServices.map(String)
          : undefined,
        deliverables: normalizeDeliverables(item.deliverables, id),
        tasks: normalizeTasks(item.tasks, id),
        requiredDocuments: normalizeDocReqs(item.requiredDocuments),
        optionalDocuments: normalizeDocReqs(item.optionalDocuments),
        location: item.location ? String(item.location) : undefined,
        serviceArea: item.serviceArea ? String(item.serviceArea) : undefined,
        startDate: item.startDate ? String(item.startDate) : undefined,
        deadline: item.deadline ? String(item.deadline) : undefined,
        duration: item.duration ? String(item.duration) : undefined,
        capacity: item.capacity ? String(item.capacity) : undefined,
        estimatedBudget:
          typeof item.estimatedBudget === 'number'
            ? item.estimatedBudget
            : item.estimatedBudget != null
              ? Number(item.estimatedBudget) || undefined
              : undefined,
        estimatedEffort: item.estimatedEffort
          ? String(item.estimatedEffort)
          : undefined,
        currency: item.currency ? String(item.currency) : undefined,
        requiredResources: item.requiredResources
          ? String(item.requiredResources)
          : undefined,
        offeredResources: item.offeredResources
          ? String(item.offeredResources)
          : undefined,
        dependencyPackageIds: Array.isArray(item.dependencyPackageIds)
          ? item.dependencyPackageIds.map(String)
          : undefined,
        priority: item.priority ? String(item.priority) : undefined,
        status: item.status ? String(item.status) : undefined,
        relatedMilestoneIds: Array.isArray(item.relatedMilestoneIds)
          ? item.relatedMilestoneIds.map(String)
          : undefined,
        acceptanceCriteria: item.acceptanceCriteria
          ? String(item.acceptanceCriteria)
          : undefined,
        complianceRequirements: item.complianceRequirements
          ? String(item.complianceRequirements)
          : undefined,
        applicableCommercialComponentIds: Array.isArray(
          item.applicableCommercialComponentIds,
        )
          ? item.applicableCommercialComponentIds.map(String)
          : undefined,
        mandatory: item.mandatory !== false,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
        collapsed: Boolean(item.collapsed),
      }
    })
    .filter((item): item is WorkPackage => item != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function normalizeResources(value: unknown): OpportunityResource[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): OpportunityResource | null => {
      if (!isRecord(item)) return null
      const name = String(item.name ?? '').trim()
      if (!name) return null
      const typeRaw = String(item.type ?? 'people')
      const allowed = [
        'people',
        'equipment',
        'vehicles',
        'materials',
        'software',
        'licenses',
      ] as const
      const type = (allowed as readonly string[]).includes(typeRaw)
        ? (typeRaw as OpportunityResource['type'])
        : 'people'
      return {
        type,
        name,
        quantity:
          typeof item.quantity === 'number'
            ? item.quantity
            : Number(item.quantity) || 1,
        unit: String(item.unit ?? 'unit'),
        mandatory: Boolean(item.mandatory),
        availability: item.availability ? String(item.availability) : undefined,
        notes: item.notes ? String(item.notes) : undefined,
        workPackageId:
          item.workPackageId == null || item.workPackageId === ''
            ? null
            : String(item.workPackageId),
      }
    })
    .filter((item): item is OpportunityResource => item != null)
}

export function normalizeOfferCapacity(value: unknown): OfferCapacity {
  if (!isRecord(value)) return {}
  return {
    availableCapacity:
      value.availableCapacity != null
        ? Number(value.availableCapacity) || undefined
        : undefined,
    reservedCapacity:
      value.reservedCapacity != null
        ? Number(value.reservedCapacity) || undefined
        : undefined,
    maximumCapacity:
      value.maximumCapacity != null
        ? Number(value.maximumCapacity) || undefined
        : undefined,
    availableFrom: value.availableFrom
      ? String(value.availableFrom)
      : undefined,
  }
}

export function normalizeCommercialConstraints(
  value: unknown,
): CommercialConstraints {
  if (!isRecord(value)) return {}
  return {
    minimumContractValue:
      value.minimumContractValue != null
        ? Number(value.minimumContractValue) || undefined
        : undefined,
    maximumContractValue:
      value.maximumContractValue != null
        ? Number(value.maximumContractValue) || undefined
        : undefined,
    currency: value.currency ? String(value.currency) : undefined,
    paymentCycle: value.paymentCycle ? String(value.paymentCycle) : undefined,
    insuranceRequired: Boolean(value.insuranceRequired),
    performanceBond: Boolean(value.performanceBond),
    warrantyPeriod: value.warrantyPeriod
      ? String(value.warrantyPeriod)
      : undefined,
    taxIncluded: Boolean(value.taxIncluded),
    commercialNotes: value.commercialNotes
      ? String(value.commercialNotes)
      : undefined,
  }
}

export function normalizeRichTimeline(value: unknown): RichTimeline {
  if (!isRecord(value)) return {}
  return {
    flexibleStart: Boolean(value.flexibleStart),
    mustFinishBefore: value.mustFinishBefore
      ? String(value.mustFinishBefore)
      : undefined,
    estimatedDuration: value.estimatedDuration
      ? String(value.estimatedDuration)
      : undefined,
    workingDays: value.workingDays ? String(value.workingDays) : undefined,
    weekendAllowed: Boolean(value.weekendAllowed),
    shiftType: value.shiftType ? String(value.shiftType) : undefined,
    deliveryMethod: value.deliveryMethod
      ? String(value.deliveryMethod)
      : undefined,
    serviceAreas: Array.isArray(value.serviceAreas)
      ? value.serviceAreas.map(String)
      : undefined,
    workLocations: Array.isArray(value.workLocations)
      ? value.workLocations.map(String)
      : undefined,
    availabilityWindows: value.availabilityWindows
      ? String(value.availabilityWindows)
      : undefined,
  }
}

export function normalizeCommercialTerms(
  value: unknown,
): CommercialTermsByMode {
  if (!isRecord(value)) return {}
  return {
    budget: value.budget != null ? String(value.budget) : undefined,
    currency: value.currency ? String(value.currency) : undefined,
    paymentTerms: value.paymentTerms ? String(value.paymentTerms) : undefined,
    milestonePayments: value.milestonePayments
      ? String(value.milestonePayments)
      : undefined,
    advancePayment: value.advancePayment
      ? String(value.advancePayment)
      : undefined,
    retention: value.retention ? String(value.retention) : undefined,
    vatIncluded: Boolean(value.vatIncluded),
    offeredValue: value.offeredValue ? String(value.offeredValue) : undefined,
    requestedValue: value.requestedValue
      ? String(value.requestedValue)
      : undefined,
    estimatedEquivalentValue: value.estimatedEquivalentValue
      ? String(value.estimatedEquivalentValue)
      : undefined,
    exchangeConditions: value.exchangeConditions
      ? String(value.exchangeConditions)
      : undefined,
    profitSharePercent: value.profitSharePercent
      ? String(value.profitSharePercent)
      : undefined,
    costSharing: value.costSharing ? String(value.costSharing) : undefined,
    revenueBasis: value.revenueBasis ? String(value.revenueBasis) : undefined,
    settlementCycle: value.settlementCycle
      ? String(value.settlementCycle)
      : undefined,
    equityPercent: value.equityPercent
      ? String(value.equityPercent)
      : undefined,
    capitalContribution: value.capitalContribution
      ? String(value.capitalContribution)
      : undefined,
    governanceRights: value.governanceRights
      ? String(value.governanceRights)
      : undefined,
    exitTerms: value.exitTerms ? String(value.exitTerms) : undefined,
    hybridComponents: Array.isArray(value.hybridComponents)
      ? value.hybridComponents.map(String)
      : undefined,
  }
}

export function normalizeTemplateMetadata(value: unknown): TemplateMetadata {
  if (!isRecord(value)) return {}
  const scope = value.templateScope
  return {
    isTemplate: Boolean(value.isTemplate),
    templateScope:
      scope === 'personal' || scope === 'company' ? scope : undefined,
    sourceOpportunityId: value.sourceOpportunityId
      ? String(value.sourceOpportunityId)
      : undefined,
  }
}

/** Map commercial UI terms into exchangeData aliases used by existing extractors. */
export function commercialTermsToExchangeData(
  terms: CommercialTermsByMode,
  exchangeMode: string,
  constraints: CommercialConstraints,
): Record<string, unknown> {
  const mode = exchangeMode.toLowerCase().replace(/-/g, '_')
  const data: Record<string, unknown> = {
    exchangeMode: mode || undefined,
    commercialConstraints: constraints,
    commercialTerms: terms,
  }

  if (terms.budget) data.budget = terms.budget
  if (terms.currency) data.currency = terms.currency
  if (terms.paymentTerms) {
    data.paymentSchedule = terms.paymentTerms
    data.cashPaymentTerms = terms.paymentTerms
  }
  if (terms.milestonePayments) data.milestonePayments = terms.milestonePayments
  if (terms.advancePayment) data.advancePayment = terms.advancePayment
  if (terms.retention) data.retention = terms.retention
  if (terms.vatIncluded != null) data.vatIncluded = terms.vatIncluded

  if (terms.offeredValue) {
    data.offeredService = terms.offeredValue
    data.barterOffer = terms.offeredValue
  }
  if (terms.requestedValue) {
    data.requestedService = terms.requestedValue
    data.barterPreferences = terms.requestedValue
  }
  if (terms.estimatedEquivalentValue) {
    data.equivalenceEstimate = terms.estimatedEquivalentValue
  }
  if (terms.exchangeConditions) data.exchangeConditions = terms.exchangeConditions

  if (terms.profitSharePercent) {
    data.profitSplit = terms.profitSharePercent
    data.profitDistribution = terms.profitSharePercent
  }
  if (terms.revenueBasis) data.calculationBasis = terms.revenueBasis
  if (terms.costSharing) data.costSharing = terms.costSharing
  if (terms.settlementCycle) data.settlementCycle = terms.settlementCycle

  if (terms.equityPercent) {
    data.equityPercentage = terms.equityPercent
    data.equitySplit = terms.equityPercent
  }
  if (terms.capitalContribution) data.capitalContribution = terms.capitalContribution
  if (terms.governanceRights) data.ownershipTerms = terms.governanceRights
  if (terms.exitTerms) data.exitTerms = terms.exitTerms

  if (terms.hybridComponents?.length) {
    data.hybridComponents = terms.hybridComponents
    if (terms.hybridComponents.includes('cash') && terms.budget) {
      data.cashComponent = terms.budget
    }
    if (terms.hybridComponents.includes('barter') && terms.offeredValue) {
      data.barterComponent = terms.offeredValue
      data.nonCashComponent = terms.offeredValue
    }
    if (terms.hybridComponents.includes('equity') && terms.equityPercent) {
      data.equityComponent = terms.equityPercent
      data.nonCashComponent = data.nonCashComponent ?? terms.equityPercent
    }
    if (terms.hybridComponents.includes('profit_sharing') && terms.profitSharePercent) {
      data.profitComponent = terms.profitSharePercent
      data.nonCashComponent = data.nonCashComponent ?? terms.profitSharePercent
    }
  }

  return data
}
