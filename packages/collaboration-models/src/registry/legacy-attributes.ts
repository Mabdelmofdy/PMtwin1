import type { SubModelFieldDefinition } from '../types.ts'

function attrs(
  fields: SubModelFieldDefinition[],
): readonly SubModelFieldDefinition[] {
  return fields
}

export const TASK_BASED_ATTRIBUTES = attrs([
  { key: 'taskTitle', label: 'Task Title', type: 'text', required: true, maxLength: 100 },
  { key: 'taskType', label: 'Task Type', type: 'select', required: true, options: ['Design', 'Engineering', 'Consultation', 'Review', 'Analysis', 'Other'] },
  { key: 'detailedScope', label: 'Detailed Scope', type: 'textarea', required: true, maxLength: 2000 },
  { key: 'duration', label: 'Duration (days)', type: 'number', required: true, min: 1 },
  { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: true },
  { key: 'experienceLevel', label: 'Experience Level', type: 'select', required: true, options: ['Junior', 'Mid-Level', 'Senior', 'Expert'] },
  { key: 'startDate', label: 'Start Date', type: 'date', required: true },
  { key: 'paymentTerms', label: 'Payment Terms', type: 'select', required: true, options: ['Upfront', 'Milestone-Based', 'Upon Completion', 'Monthly'] },
])

export const CONSORTIUM_ATTRIBUTES = attrs([
  { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
  { key: 'requiredMembers', label: 'Required Members', type: 'number', required: true, min: 2 },
  { key: 'memberRoles', label: 'Member Roles', type: 'array-objects', required: true },
  { key: 'scopeDivision', label: 'Scope Division', type: 'select', required: true, options: ['By Trade', 'By Phase', 'By Geography', 'Mixed'] },
  { key: 'minimumRequirements', label: 'Minimum Requirements', type: 'array-objects', required: true },
  { key: 'tenderDeadline', label: 'Tender Deadline', type: 'date', required: false },
])

export const PROJECT_JV_ATTRIBUTES = attrs([
  { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
  { key: 'partnerRoles', label: 'Partner Roles', type: 'array-objects', required: true },
  { key: 'equitySplit', label: 'Equity Split', type: 'array-percentages', required: true },
  { key: 'capitalContribution', label: 'Capital Contribution', type: 'currency', required: true },
  { key: 'profitDistribution', label: 'Profit Distribution', type: 'select', required: true, options: ['Proportional to Equity', 'Fixed Percentage', 'Performance-Based'] },
  { key: 'governance', label: 'Governance Structure', type: 'textarea', required: false, maxLength: 1000 },
])

export const SPV_ATTRIBUTES = attrs([
  { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
  { key: 'spvLegalForm', label: 'SPV Legal Form', type: 'select', required: true, options: ['LLC', 'Limited Partnership', 'Corporation', 'Trust'] },
  { key: 'equityStructure', label: 'Equity Structure', type: 'array-objects', required: true },
  { key: 'projectValue', label: 'Project Value', type: 'currency', required: true, min: 50000000 },
  { key: 'governanceStructure', label: 'Governance Structure', type: 'textarea', required: true, maxLength: 1000 },
])

export const STRATEGIC_JV_ATTRIBUTES = attrs([
  { key: 'jvName', label: 'JV Name', type: 'text', required: true, maxLength: 150 },
  { key: 'strategicObjective', label: 'Strategic Objective', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'equitySplit', label: 'Equity Split', type: 'array-percentages', required: true },
  { key: 'partnerContributions', label: 'Partner Contributions', type: 'array-objects', required: true },
  { key: 'governance', label: 'Governance Structure', type: 'textarea', required: true, maxLength: 1000 },
])

export const STRATEGIC_ALLIANCE_ATTRIBUTES = attrs([
  { key: 'allianceTitle', label: 'Alliance Title', type: 'text', required: true, maxLength: 150 },
  { key: 'allianceType', label: 'Alliance Type', type: 'select', required: true, options: ['Preferred Supplier', 'Technology Licensing', 'Market Access', 'Knowledge Sharing', 'Joint Service Offering', 'Other'] },
  { key: 'scopeOfCollaboration', label: 'Scope of Collaboration', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'financialTerms', label: 'Financial Terms', type: 'textarea', required: true, maxLength: 1000 },
  { key: 'duration', label: 'Duration (years)', type: 'number', required: true, min: 3 },
])

export const MENTORSHIP_ATTRIBUTES = attrs([
  { key: 'mentorshipTitle', label: 'Mentorship Title', type: 'text', required: true, maxLength: 100 },
  { key: 'mentorshipType', label: 'Mentorship Type', type: 'select', required: true, options: ['Technical', 'Career Development', 'Business', 'Leadership', 'Project Management', 'Design', 'Other'] },
  { key: 'targetSkills', label: 'Target Skills', type: 'tags', required: true },
  { key: 'duration', label: 'Duration (months)', type: 'number', required: true },
])

export const BULK_PURCHASING_ATTRIBUTES = attrs([
  { key: 'productService', label: 'Product/Service', type: 'text', required: true, maxLength: 150 },
  { key: 'quantityNeeded', label: 'Quantity Needed', type: 'number', required: true },
  { key: 'participantsNeeded', label: 'Participants Needed', type: 'number', required: true },
  { key: 'deliveryTimeline', label: 'Delivery Timeline', type: 'date-range', required: true },
])

export const EQUIPMENT_SHARING_ATTRIBUTES = attrs([
  { key: 'assetDescription', label: 'Asset Description', type: 'text', required: true, maxLength: 150 },
  { key: 'assetType', label: 'Equipment Type', type: 'select', required: true, options: ['Heavy Equipment', 'Vehicles', 'Tools', 'Technology', 'Facility', 'Other'] },
  { key: 'assetLocation', label: 'Location', type: 'text', required: true },
  { key: 'availability', label: 'Availability', type: 'date-range', required: true },
  { key: 'usageSchedule', label: 'Usage Terms', type: 'select', required: true, options: ['Rotation', 'Booking System', 'Priority by Ownership %'] },
])

export const RESOURCE_SHARING_ATTRIBUTES = attrs([
  { key: 'resourceTitle', label: 'Resource Title', type: 'text', required: true, maxLength: 150 },
  { key: 'resourceType', label: 'Resource Type', type: 'select', required: true, options: ['Materials', 'Equipment', 'Labor', 'Services', 'Knowledge', 'Other'] },
  { key: 'location', label: 'Location', type: 'text', required: true },
  { key: 'availability', label: 'Availability', type: 'date-range', required: true },
  { key: 'transactionType', label: 'Transaction Type', type: 'select', required: true, options: ['Sell', 'Buy', 'Rent', 'Barter', 'Donate'] },
])

export const PROFESSIONAL_HIRING_ATTRIBUTES = attrs([
  { key: 'jobTitle', label: 'Role', type: 'text', required: true, maxLength: 100 },
  { key: 'requiredExperience', label: 'Required Experience (years)', type: 'number', required: true },
  { key: 'contractDuration', label: 'Duration (months)', type: 'number', required: false },
  { key: 'salaryRange', label: 'Rate / Salary Range', type: 'currency-range', required: true },
  { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: true },
  { key: 'startDate', label: 'Start Date', type: 'date', required: true },
])

export const CONSULTANT_HIRING_ATTRIBUTES = attrs([
  { key: 'consultationTitle', label: 'Consultation Title', type: 'text', required: true, maxLength: 100 },
  { key: 'consultationType', label: 'Specialty', type: 'select', required: true, options: ['Legal', 'Financial', 'Technical', 'Sustainability', 'Safety', 'Design', 'Project Management', 'Other'] },
  { key: 'scopeOfWork', label: 'Engagement Type / Scope', type: 'textarea', required: true, maxLength: 2000 },
  { key: 'deliverables', label: 'Deliverables', type: 'tags', required: true },
  { key: 'budget', label: 'Budget', type: 'currency-range', required: true },
  { key: 'duration', label: 'Duration', type: 'number', required: true },
])

export const COMPETITION_RFP_ATTRIBUTES = attrs([
  { key: 'competitionTitle', label: 'Competition Title', type: 'text', required: true, maxLength: 150 },
  { key: 'submissionDeadline', label: 'Submission Deadline', type: 'date', required: true },
  { key: 'evaluationCriteria', label: 'Evaluation Criteria', type: 'array-objects', required: true },
  { key: 'prizeContractValue', label: 'Award Terms / Prize Value', type: 'currency', required: true },
  { key: 'competitionRules', label: 'Competition Rules', type: 'textarea', required: true, maxLength: 2000 },
])
