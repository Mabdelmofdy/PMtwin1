/** Enterprise Opportunity Creation metadata types (presentation / persistence only). */

export type SkillLevel = 'basic' | 'intermediate' | 'expert'

export type StructuredSkill = {
  name: string
  level: SkillLevel
  yearsRequired?: number
  certificationRequired: boolean
  mandatory: boolean
}

export type Deliverable = {
  title: string
  acceptanceCriteria: string
  milestoneReference?: string
  mandatory: boolean
}

export type WorkPackageDocumentRequirement = {
  name: string
  notes?: string
}

export type WorkPackage = {
  id: string
  title: string
  description: string
  requiredSkills: StructuredSkill[]
  deliverables: Deliverable[]
  requiredDocuments?: WorkPackageDocumentRequirement[]
  optionalDocuments?: WorkPackageDocumentRequirement[]
  location?: string
  startDate?: string
  deadline?: string
  estimatedBudget?: number
  currency?: string
  mandatory: boolean
  sortOrder: number
}

export type ResourceType =
  | 'people'
  | 'equipment'
  | 'vehicles'
  | 'materials'
  | 'software'
  | 'licenses'

export type OpportunityResource = {
  type: ResourceType
  name: string
  quantity: number
  unit: string
  mandatory: boolean
  availability?: string
  notes?: string
  /** Omit / null = global opportunity resource. */
  workPackageId?: string | null
}

export type OfferCapacity = {
  availableCapacity?: number
  reservedCapacity?: number
  maximumCapacity?: number
  availableFrom?: string
}

export type CommercialConstraints = {
  minimumContractValue?: number
  maximumContractValue?: number
  currency?: string
  paymentCycle?: string
  insuranceRequired?: boolean
  performanceBond?: boolean
  warrantyPeriod?: string
  taxIncluded?: boolean
  commercialNotes?: string
}

export type RichTimeline = {
  flexibleStart?: boolean
  mustFinishBefore?: string
  estimatedDuration?: string
  workingDays?: string
  weekendAllowed?: boolean
  shiftType?: string
}

export type CommercialTermsByMode = {
  // Cash
  budget?: string
  currency?: string
  paymentTerms?: string
  milestonePayments?: string
  advancePayment?: string
  retention?: string
  vatIncluded?: boolean
  // Barter
  offeredValue?: string
  requestedValue?: string
  estimatedEquivalentValue?: string
  exchangeConditions?: string
  // Profit sharing
  profitSharePercent?: string
  costSharing?: string
  revenueBasis?: string
  settlementCycle?: string
  // Equity
  equityPercent?: string
  capitalContribution?: string
  governanceRights?: string
  exitTerms?: string
  // Hybrid component selection
  hybridComponents?: string[]
}

export type TemplateMetadata = {
  isTemplate?: boolean
  /** Reserved for future Template Library — do not expose library UI this sprint. */
  templateScope?: 'personal' | 'company'
  sourceOpportunityId?: string
}

export function createEmptyStructuredSkill(): StructuredSkill {
  return {
    name: '',
    level: 'intermediate',
    certificationRequired: false,
    mandatory: true,
  }
}

export function createEmptyWorkPackage(sortOrder = 0): WorkPackage {
  return {
    id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    description: '',
    requiredSkills: [],
    deliverables: [],
    requiredDocuments: [],
    optionalDocuments: [],
    mandatory: true,
    sortOrder,
  }
}

export function createEmptyResource(): OpportunityResource {
  return {
    type: 'people',
    name: '',
    quantity: 1,
    unit: 'unit',
    mandatory: false,
  }
}

export function createEmptyDeliverable(): Deliverable {
  return {
    title: '',
    acceptanceCriteria: '',
    mandatory: true,
  }
}
