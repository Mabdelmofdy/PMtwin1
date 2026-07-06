import type {
  MainCollaborationModelDefinition,
  ModelTypeDefinition,
  SubModelDefinition,
  SubModelFieldDefinition,
} from '../types.ts'

function attrs(
  fields: SubModelFieldDefinition[],
): readonly SubModelFieldDefinition[] {
  return fields
}

const TASK_BASED_ATTRIBUTES = attrs([
  { key: 'taskTitle', label: 'Task Title', type: 'text', required: true, maxLength: 100 },
  { key: 'taskType', label: 'Task Type', type: 'select', required: true, options: ['Design', 'Engineering', 'Consultation', 'Review', 'Analysis', 'Other'] },
  { key: 'detailedScope', label: 'Detailed Scope', type: 'textarea', required: true, maxLength: 2000 },
  { key: 'duration', label: 'Duration (days)', type: 'number', required: true, min: 1 },
  { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: true },
  { key: 'experienceLevel', label: 'Experience Level', type: 'select', required: true, options: ['Junior', 'Mid-Level', 'Senior', 'Expert'] },
  { key: 'startDate', label: 'Start Date', type: 'date', required: true },
  { key: 'paymentTerms', label: 'Payment Terms', type: 'select', required: true, options: ['Upfront', 'Milestone-Based', 'Upon Completion', 'Monthly'] },
])

const CONSORTIUM_ATTRIBUTES = attrs([
  { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
  { key: 'requiredMembers', label: 'Required Members', type: 'number', required: true, min: 2 },
  { key: 'memberRoles', label: 'Member Roles', type: 'array-objects', required: true },
  { key: 'scopeDivision', label: 'Scope Division', type: 'select', required: true, options: ['By Trade', 'By Phase', 'By Geography', 'Mixed'] },
  { key: 'minimumRequirements', label: 'Minimum Requirements', type: 'array-objects', required: true },
  { key: 'tenderDeadline', label: 'Tender Deadline', type: 'date', required: false },
])

const PROJECT_JV_ATTRIBUTES = attrs([
  { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
  { key: 'partnerRoles', label: 'Partner Roles', type: 'array-objects', required: true },
  { key: 'equitySplit', label: 'Equity Split', type: 'array-percentages', required: true },
  { key: 'capitalContribution', label: 'Capital Contribution', type: 'currency', required: true },
  { key: 'profitDistribution', label: 'Profit Distribution', type: 'select', required: true, options: ['Proportional to Equity', 'Fixed Percentage', 'Performance-Based'] },
  { key: 'governance', label: 'Governance Structure', type: 'textarea', required: false, maxLength: 1000 },
])

const SPV_ATTRIBUTES = attrs([
  { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
  { key: 'spvLegalForm', label: 'SPV Legal Form', type: 'select', required: true, options: ['LLC', 'Limited Partnership', 'Corporation', 'Trust'] },
  { key: 'equityStructure', label: 'Equity Structure', type: 'array-objects', required: true },
  { key: 'projectValue', label: 'Project Value', type: 'currency', required: true, min: 50000000 },
  { key: 'governanceStructure', label: 'Governance Structure', type: 'textarea', required: true, maxLength: 1000 },
])

const STRATEGIC_JV_ATTRIBUTES = attrs([
  { key: 'jvName', label: 'JV Name', type: 'text', required: true, maxLength: 150 },
  { key: 'strategicObjective', label: 'Strategic Objective', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'equitySplit', label: 'Equity Split', type: 'array-percentages', required: true },
  { key: 'partnerContributions', label: 'Partner Contributions', type: 'array-objects', required: true },
  { key: 'governance', label: 'Governance Structure', type: 'textarea', required: true, maxLength: 1000 },
])

const STRATEGIC_ALLIANCE_ATTRIBUTES = attrs([
  { key: 'allianceTitle', label: 'Alliance Title', type: 'text', required: true, maxLength: 150 },
  { key: 'allianceType', label: 'Alliance Type', type: 'select', required: true, options: ['Preferred Supplier', 'Technology Licensing', 'Market Access', 'Knowledge Sharing', 'Joint Service Offering', 'Other'] },
  { key: 'scopeOfCollaboration', label: 'Scope of Collaboration', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'financialTerms', label: 'Financial Terms', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'duration', label: 'Duration (years)', type: 'number', required: true, min: 3 },
])

const MENTORSHIP_ATTRIBUTES = attrs([
  { key: 'mentorshipTitle', label: 'Mentorship Title', type: 'text', required: true, maxLength: 100 },
  { key: 'mentorshipType', label: 'Mentorship Type', type: 'select', required: true, options: ['Technical', 'Career Development', 'Business', 'Leadership', 'Project Management', 'Design', 'Other'] },
  { key: 'targetSkills', label: 'Target Skills', type: 'tags', required: true },
  { key: 'duration', label: 'Duration (months)', type: 'number', required: true },
])

const BULK_PURCHASING_ATTRIBUTES = attrs([
  { key: 'productService', label: 'Product/Service', type: 'text', required: true, maxLength: 150 },
  { key: 'quantityNeeded', label: 'Quantity Needed', type: 'number', required: true },
  { key: 'participantsNeeded', label: 'Participants Needed', type: 'number', required: true },
  { key: 'deliveryTimeline', label: 'Delivery Timeline', type: 'date-range', required: true },
])

const EQUIPMENT_SHARING_ATTRIBUTES = attrs([
  { key: 'assetDescription', label: 'Asset Description', type: 'text', required: true, maxLength: 150 },
  { key: 'assetType', label: 'Equipment Type', type: 'select', required: true, options: ['Heavy Equipment', 'Vehicles', 'Tools', 'Technology', 'Facility', 'Other'] },
  { key: 'assetLocation', label: 'Location', type: 'text', required: true },
  { key: 'availability', label: 'Availability', type: 'date-range', required: true },
  { key: 'usageSchedule', label: 'Usage Terms', type: 'select', required: true, options: ['Rotation', 'Booking System', 'Priority by Ownership %'] },
])

const RESOURCE_SHARING_ATTRIBUTES = attrs([
  { key: 'resourceTitle', label: 'Resource Title', type: 'text', required: true, maxLength: 150 },
  { key: 'resourceType', label: 'Resource Type', type: 'select', required: true, options: ['Materials', 'Equipment', 'Labor', 'Services', 'Knowledge', 'Other'] },
  { key: 'location', label: 'Location', type: 'text', required: true },
  { key: 'availability', label: 'Availability', type: 'date-range', required: true },
  { key: 'transactionType', label: 'Transaction Type', type: 'select', required: true, options: ['Sell', 'Buy', 'Rent', 'Barter', 'Donate'] },
])

const PROFESSIONAL_HIRING_ATTRIBUTES = attrs([
  { key: 'jobTitle', label: 'Role', type: 'text', required: true, maxLength: 100 },
  { key: 'requiredExperience', label: 'Required Experience (years)', type: 'number', required: true },
  { key: 'contractDuration', label: 'Duration (months)', type: 'number', required: false },
  { key: 'salaryRange', label: 'Rate / Salary Range', type: 'currency-range', required: true },
  { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: true },
  { key: 'startDate', label: 'Start Date', type: 'date', required: true },
])

const CONSULTANT_HIRING_ATTRIBUTES = attrs([
  { key: 'consultationTitle', label: 'Consultation Title', type: 'text', required: true, maxLength: 100 },
  { key: 'consultationType', label: 'Specialty', type: 'select', required: true, options: ['Legal', 'Financial', 'Technical', 'Sustainability', 'Safety', 'Design', 'Project Management', 'Other'] },
  { key: 'scopeOfWork', label: 'Engagement Type / Scope', type: 'textarea', required: true, maxLength: 2000 },
  { key: 'deliverables', label: 'Deliverables', type: 'tags', required: true },
  { key: 'budget', label: 'Budget', type: 'currency-range', required: true },
  { key: 'duration', label: 'Duration', type: 'number', required: true },
])

const COMPETITION_RFP_ATTRIBUTES = attrs([
  { key: 'competitionTitle', label: 'Competition Title', type: 'text', required: true, maxLength: 150 },
  { key: 'submissionDeadline', label: 'Submission Deadline', type: 'date', required: true },
  { key: 'evaluationCriteria', label: 'Evaluation Criteria', type: 'array-objects', required: true },
  { key: 'prizeContractValue', label: 'Award Terms / Prize Value', type: 'currency', required: true },
  { key: 'competitionRules', label: 'Competition Rules', type: 'textarea', required: true, maxLength: 2000 },
])

export const SUB_MODEL_REGISTRY: Record<string, SubModelDefinition> = {
  task_based: {
    key: 'task_based',
    name: 'Task-Based Engagement',
    description: 'Short-term collaboration for specific tasks or deliverables.',
    modelType: 'project_based',
    mainCollaborationModel: 'cash_subcontracting',
    allowedMatchTopologies: ['one_way'],
    allowedExchangeModes: ['cash', 'hybrid', 'barter'],
    requiredFields: ['detailedScope', 'requiredSkills', 'duration', 'startDate'],
    recommendedFields: ['taskTitle', 'taskType', 'paymentTerms', 'experienceLevel'],
    attributes: TASK_BASED_ATTRIBUTES,
  },
  consortium: {
    key: 'consortium',
    name: 'Consortium',
    description: 'Multi-party project delivery with defined member roles.',
    modelType: 'project_based',
    mainCollaborationModel: 'joint_venture',
    allowedMatchTopologies: ['consortium'],
    allowedExchangeModes: ['cash', 'profit_sharing', 'hybrid'],
    requiredFields: ['memberRoles', 'requiredMembers', 'minimumRequirements'],
    recommendedFields: ['projectTitle', 'scopeDivision', 'tenderDeadline'],
    attributes: CONSORTIUM_ATTRIBUTES,
  },
  project_jv: {
    key: 'project_jv',
    name: 'Project-Specific Joint Venture',
    description: 'JV formed for a single project with equity and governance terms.',
    modelType: 'project_based',
    mainCollaborationModel: 'joint_venture',
    allowedMatchTopologies: ['consortium'],
    allowedExchangeModes: ['equity', 'profit_sharing', 'hybrid', 'cash'],
    requiredFields: ['partnerRoles', 'equitySplit', 'capitalContribution', 'profitDistribution'],
    recommendedFields: ['governance', 'projectTitle', 'riskAllocation'],
    attributes: PROJECT_JV_ATTRIBUTES,
    eligibility: {
      allowedEntityTypes: ['company'],
      reason: 'Project-Specific Joint Venture requires a company entity',
    },
  },
  spv: {
    key: 'spv',
    name: 'Special Purpose Vehicle (SPV)',
    description: 'Corporate vehicle for large structured projects.',
    modelType: 'project_based',
    mainCollaborationModel: 'joint_venture',
    allowedMatchTopologies: ['consortium'],
    allowedExchangeModes: ['equity', 'profit_sharing', 'hybrid'],
    requiredFields: ['equityStructure', 'spvLegalForm', 'governanceStructure'],
    recommendedFields: ['projectValue', 'debtFinancing', 'regulatoryApprovals'],
    attributes: SPV_ATTRIBUTES,
    eligibility: {
      allowedEntityTypes: ['company'],
      reason: 'SPV is a corporate structure available to companies only',
    },
  },
  strategic_jv: {
    key: 'strategic_jv',
    name: 'Strategic Joint Venture',
    description: 'Long-horizon JV with strategic objectives.',
    modelType: 'strategic_partnership',
    mainCollaborationModel: 'joint_venture',
    allowedMatchTopologies: ['consortium'],
    allowedExchangeModes: ['equity', 'profit_sharing', 'hybrid'],
    requiredFields: ['partnerContributions', 'equitySplit', 'governance'],
    recommendedFields: ['jvName', 'strategicObjective', 'businessScope'],
    attributes: STRATEGIC_JV_ATTRIBUTES,
    eligibility: {
      allowedEntityTypes: ['company'],
      reason: 'Strategic Joint Venture requires a company entity',
    },
  },
  strategic_alliance: {
    key: 'strategic_alliance',
    name: 'Long-Term Strategic Alliance',
    description: 'Non-equity strategic collaboration and service exchange.',
    modelType: 'strategic_partnership',
    mainCollaborationModel: 'service_exchange',
    allowedMatchTopologies: ['two_way', 'one_way'],
    allowedExchangeModes: ['barter', 'hybrid', 'cash'],
    requiredFields: ['scopeOfCollaboration', 'duration', 'financialTerms'],
    recommendedFields: ['allianceTitle', 'allianceType', 'governance'],
    attributes: STRATEGIC_ALLIANCE_ATTRIBUTES,
  },
  mentorship: {
    key: 'mentorship',
    name: 'Mentorship Program',
    description: 'Knowledge and career development exchange.',
    modelType: 'strategic_partnership',
    mainCollaborationModel: 'service_exchange',
    allowedMatchTopologies: ['two_way', 'one_way'],
    allowedExchangeModes: ['barter', 'cash', 'hybrid'],
    requiredFields: ['targetSkills', 'duration', 'mentorshipType'],
    recommendedFields: ['mentorshipTitle', 'format', 'compensation'],
    attributes: MENTORSHIP_ATTRIBUTES,
  },
  bulk_purchasing: {
    key: 'bulk_purchasing',
    name: 'Bulk Purchasing',
    description: 'Pooled procurement across participants.',
    modelType: 'resource_pooling',
    mainCollaborationModel: 'resource_sharing',
    allowedMatchTopologies: ['one_way', 'consortium'],
    allowedExchangeModes: ['cash', 'hybrid'],
    requiredFields: ['productService', 'quantityNeeded', 'participantsNeeded'],
    recommendedFields: ['deliveryTimeline', 'targetPrice'],
    attributes: BULK_PURCHASING_ATTRIBUTES,
  },
  equipment_sharing: {
    key: 'equipment_sharing',
    name: 'Equipment Sharing',
    description: 'Shared ownership or usage of equipment assets.',
    modelType: 'resource_pooling',
    mainCollaborationModel: 'resource_sharing',
    allowedMatchTopologies: ['one_way', 'circular'],
    allowedExchangeModes: ['cash', 'barter', 'hybrid'],
    requiredFields: ['assetType', 'assetLocation', 'availability', 'usageSchedule'],
    recommendedFields: ['assetDescription', 'ownershipStructure'],
    attributes: EQUIPMENT_SHARING_ATTRIBUTES,
  },
  resource_sharing: {
    key: 'resource_sharing',
    name: 'Resource Sharing & Exchange',
    description: 'Peer resource exchange across projects.',
    modelType: 'resource_pooling',
    mainCollaborationModel: 'resource_sharing',
    allowedMatchTopologies: ['one_way', 'circular', 'two_way'],
    allowedExchangeModes: ['cash', 'barter', 'hybrid'],
    requiredFields: ['resourceType', 'location', 'availability'],
    recommendedFields: ['resourceTitle', 'transactionType'],
    attributes: RESOURCE_SHARING_ATTRIBUTES,
  },
  professional_hiring: {
    key: 'professional_hiring',
    name: 'Professional Hiring',
    description: 'Hire professionals for defined roles.',
    modelType: 'hiring',
    mainCollaborationModel: 'hiring',
    allowedMatchTopologies: ['one_way'],
    allowedExchangeModes: ['cash', 'hybrid'],
    requiredFields: ['jobTitle', 'requiredExperience', 'salaryRange', 'startDate'],
    recommendedFields: ['requiredSkills', 'contractDuration', 'employmentType'],
    attributes: PROFESSIONAL_HIRING_ATTRIBUTES,
  },
  consultant_hiring: {
    key: 'consultant_hiring',
    name: 'Consultant Hiring',
    description: 'Engage consultants for scoped advisory work.',
    modelType: 'hiring',
    mainCollaborationModel: 'hiring',
    allowedMatchTopologies: ['one_way'],
    allowedExchangeModes: ['cash', 'barter', 'hybrid'],
    requiredFields: ['consultationType', 'scopeOfWork', 'deliverables', 'budget'],
    recommendedFields: ['consultationTitle', 'duration', 'paymentTerms'],
    attributes: CONSULTANT_HIRING_ATTRIBUTES,
  },
  competition_rfp: {
    key: 'competition_rfp',
    name: 'Competition / RFP',
    description: 'Structured competition or request-for-proposal.',
    modelType: 'competition',
    mainCollaborationModel: 'cash_subcontracting',
    allowedMatchTopologies: ['one_way'],
    allowedExchangeModes: ['cash', 'hybrid'],
    requiredFields: ['submissionDeadline', 'evaluationCriteria', 'prizeContractValue'],
    recommendedFields: ['competitionTitle', 'competitionRules', 'eligibilityCriteria'],
    attributes: COMPETITION_RFP_ATTRIBUTES,
  },
}

export const MAIN_MODEL_REGISTRY: Record<string, MainCollaborationModelDefinition> = {
  cash_subcontracting: {
    key: 'cash_subcontracting',
    name: 'Cash Subcontracting',
    description: 'Paid delivery for a defined scope with clear payment milestones.',
    defaultModelType: 'project_based',
    subModelKeys: ['task_based', 'competition_rfp'],
    allowedMatchTopologies: ['one_way'],
    allowedExchangeModes: ['cash', 'hybrid'],
  },
  service_exchange: {
    key: 'service_exchange',
    name: 'Service Exchange / Barter',
    description: 'Trade services or resources of comparable value instead of cash.',
    defaultModelType: 'strategic_partnership',
    subModelKeys: ['strategic_alliance', 'mentorship', 'task_based'],
    allowedMatchTopologies: ['two_way', 'one_way'],
    allowedExchangeModes: ['barter', 'hybrid'],
  },
  joint_venture: {
    key: 'joint_venture',
    name: 'Joint Venture',
    description: 'Shared delivery, governance, and outcomes across partners.',
    defaultModelType: 'project_based',
    subModelKeys: ['consortium', 'project_jv', 'spv', 'strategic_jv'],
    allowedMatchTopologies: ['consortium'],
    allowedExchangeModes: ['equity', 'profit_sharing', 'hybrid', 'cash'],
  },
  resource_sharing: {
    key: 'resource_sharing',
    name: 'Resource Sharing',
    description: 'Pool equipment, teams, or procurement capacity across projects.',
    defaultModelType: 'resource_pooling',
    subModelKeys: ['bulk_purchasing', 'equipment_sharing', 'resource_sharing'],
    allowedMatchTopologies: ['one_way', 'circular', 'consortium'],
    allowedExchangeModes: ['cash', 'barter', 'hybrid'],
  },
  hiring: {
    key: 'hiring',
    name: 'Hiring / Professional Engagement',
    description: 'Engage professionals or consultants for roles and deliverables.',
    defaultModelType: 'hiring',
    subModelKeys: ['professional_hiring', 'consultant_hiring'],
    allowedMatchTopologies: ['one_way'],
    allowedExchangeModes: ['cash', 'barter', 'hybrid'],
  },
}

export const MODEL_TYPE_REGISTRY: Record<string, ModelTypeDefinition> = {
  project_based: {
    key: 'project_based',
    name: 'Project-Based Collaboration',
    subModelKeys: ['task_based', 'consortium', 'project_jv', 'spv'],
  },
  strategic_partnership: {
    key: 'strategic_partnership',
    name: 'Strategic Partnerships',
    subModelKeys: ['strategic_jv', 'strategic_alliance', 'mentorship'],
  },
  resource_pooling: {
    key: 'resource_pooling',
    name: 'Resource Pooling & Sharing',
    subModelKeys: ['bulk_purchasing', 'equipment_sharing', 'resource_sharing'],
  },
  hiring: {
    key: 'hiring',
    name: 'Hiring a Resource',
    subModelKeys: ['professional_hiring', 'consultant_hiring'],
  },
  competition: {
    key: 'competition',
    name: 'Call for Competition',
    subModelKeys: ['competition_rfp'],
  },
}
