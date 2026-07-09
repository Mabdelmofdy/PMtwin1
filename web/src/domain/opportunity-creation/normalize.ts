import type {
  Deliverable,
  OpportunityResource,
  OfferCapacity,
  StructuredSkill,
  WorkPackage,
  WorkPackageDocumentRequirement,
  CommercialConstraints,
  RichTimeline,
  CommercialTermsByMode,
  TemplateMetadata,
} from './types.ts'

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

/** Coerce legacy string / Deliverable[] into Deliverable[]. */
export function normalizeDeliverables(value: unknown): Deliverable[] {
  if (!Array.isArray(value)) {
    if (typeof value === 'string' && value.trim()) {
      return [{ title: value.trim(), acceptanceCriteria: '', mandatory: true }]
    }
    return []
  }
  return value
    .map((item): Deliverable | null => {
      if (typeof item === 'string') {
        const title = item.trim()
        if (!title) return null
        return { title, acceptanceCriteria: '', mandatory: true }
      }
      if (!isRecord(item)) return null
      const title = String(item.title ?? '').trim()
      if (!title) return null
      return {
        title,
        acceptanceCriteria: String(item.acceptanceCriteria ?? ''),
        milestoneReference: item.milestoneReference
          ? String(item.milestoneReference)
          : undefined,
        mandatory: item.mandatory !== false,
      }
    })
    .filter((item): item is Deliverable => item != null)
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
        requiredSkills: normalizeStructuredSkills(item.requiredSkills),
        deliverables: normalizeDeliverables(item.deliverables),
        requiredDocuments: normalizeDocReqs(item.requiredDocuments),
        optionalDocuments: normalizeDocReqs(item.optionalDocuments),
        location: item.location ? String(item.location) : undefined,
        startDate: item.startDate ? String(item.startDate) : undefined,
        deadline: item.deadline ? String(item.deadline) : undefined,
        estimatedBudget:
          typeof item.estimatedBudget === 'number'
            ? item.estimatedBudget
            : item.estimatedBudget != null
              ? Number(item.estimatedBudget) || undefined
              : undefined,
        currency: item.currency ? String(item.currency) : undefined,
        mandatory: item.mandatory !== false,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
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
