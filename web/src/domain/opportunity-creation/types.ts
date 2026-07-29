/** Enterprise Opportunity Creation metadata types (presentation / persistence only). */

export type SkillLevel = 'basic' | 'intermediate' | 'expert'

export type StructuredSkill = {
  name: string
  level: SkillLevel
  yearsRequired?: number
  certificationRequired: boolean
  mandatory: boolean
}

export type WorkPackageDocumentRequirement = {
  name: string
  notes?: string
}

export type OpportunityDeliverable = {
  id: string
  title: string
  description?: string
  type?: string
  quantity?: number
  unit?: string
  dueDate?: string
  acceptanceCriteria: string
  requiredDocuments?: string[]
  reviewMethod?: string
  approvalRequired?: boolean
  workPackageId?: string | null
  taskId?: string | null
  milestoneId?: string | null
  deliveryLocation?: string
  responsiblePartyType?: string
  attachmentRequirements?: string
  notes?: string
  mandatory: boolean
  sortOrder: number
  /** @deprecated Prefer milestoneId */
  milestoneReference?: string
}

/** @deprecated Prefer OpportunityDeliverable — kept for nested WP deliverables. */
export type Deliverable = OpportunityDeliverable

export type OpportunityTask = {
  id: string
  workPackageId: string
  title: string
  description?: string
  taskType?: string
  requiredSkills?: StructuredSkill[]
  requiredServices?: string[]
  ownerType?: string
  duration?: string
  startDate?: string
  endDate?: string
  dependencyTaskId?: string
  priority?: string
  acceptanceCriteria?: string
  estimatedEffort?: string
  estimatedQuantity?: number
  location?: string
  relatedDeliverableIds?: string[]
  relatedMilestoneIds?: string[]
  requiredResources?: string
  status?: string
  notes?: string
  sortOrder: number
}

export type OpportunityMilestone = {
  id: string
  title: string
  description?: string
  targetDate?: string
  completionCriteria?: string
  relatedWorkPackageIds?: string[]
  relatedTaskIds?: string[]
  relatedDeliverableIds?: string[]
  approvalRequired?: boolean
  commercialTrigger?: boolean
  paymentTrigger?: boolean
  notes?: string
  sortOrder: number
}

export type WorkPackage = {
  id: string
  title: string
  description: string
  scope?: string
  packageType?: string
  requiredSkills: StructuredSkill[]
  requiredServices?: string[]
  deliverables: OpportunityDeliverable[]
  tasks?: OpportunityTask[]
  requiredDocuments?: WorkPackageDocumentRequirement[]
  optionalDocuments?: WorkPackageDocumentRequirement[]
  location?: string
  serviceArea?: string
  startDate?: string
  deadline?: string
  duration?: string
  capacity?: string
  estimatedBudget?: number
  estimatedEffort?: string
  currency?: string
  requiredResources?: string
  offeredResources?: string
  dependencyPackageIds?: string[]
  priority?: string
  status?: string
  relatedMilestoneIds?: string[]
  acceptanceCriteria?: string
  complianceRequirements?: string
  applicableCommercialComponentIds?: string[]
  mandatory: boolean
  sortOrder: number
  collapsed?: boolean
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
  /** Canonical location scope ID for asset/equipment placement. */
  location?: string
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
  deliveryMethod?: 'remote' | 'on_site' | 'hybrid' | string
  serviceAreas?: string[]
  workLocations?: string[]
  availabilityWindows?: string
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

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createEmptyDeliverable(
  sortOrder = 0,
  workPackageId?: string | null,
): OpportunityDeliverable {
  return {
    id: createId('dlv'),
    title: '',
    acceptanceCriteria: '',
    mandatory: true,
    sortOrder,
    workPackageId: workPackageId ?? null,
  }
}

export function createEmptyTask(
  workPackageId: string,
  sortOrder = 0,
): OpportunityTask {
  return {
    id: createId('task'),
    workPackageId,
    title: '',
    requiredSkills: [],
    sortOrder,
  }
}

export function createEmptyMilestone(sortOrder = 0): OpportunityMilestone {
  return {
    id: createId('ms'),
    title: '',
    sortOrder,
    relatedWorkPackageIds: [],
    relatedTaskIds: [],
    relatedDeliverableIds: [],
  }
}

export function createEmptyWorkPackage(sortOrder = 0): WorkPackage {
  return {
    id: createId('wp'),
    title: '',
    description: '',
    requiredSkills: [],
    deliverables: [],
    tasks: [],
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
