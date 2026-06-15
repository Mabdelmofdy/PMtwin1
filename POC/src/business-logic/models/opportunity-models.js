/**
 * Opportunity Models
 * Defines all business model structures and their attributes
 */

const OPPORTUNITY_MODELS = {
    // Model 1: Project-Based Collaboration
    project_based: {
        name: 'Project-Based Collaboration',
        subModels: {
            task_based: {
                name: 'Task-Based Engagement',
                attributes: [
                    { key: 'taskTitle', label: 'Task Title', type: 'text', required: true, maxLength: 100 },
                    { key: 'taskType', label: 'Task Type', type: 'select', required: true, options: ['Design', 'Engineering', 'Consultation', 'Review', 'Analysis', 'Other'] },
                    { key: 'detailedScope', label: 'Detailed Scope', type: 'textarea', required: true, maxLength: 2000 },
                    { key: 'duration', label: 'Duration (days)', type: 'number', required: true, min: 1 },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: true },
                    { key: 'experienceLevel', label: 'Experience Level', type: 'select', required: true, options: ['Junior', 'Mid-Level', 'Senior', 'Expert'] },
                    { key: 'locationRequirement', label: 'Location Requirement', type: 'select', required: false, options: ['Remote', 'On-Site', 'Hybrid'] },
                    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
                    { key: 'deliverableFormat', label: 'Deliverable Format', type: 'text', required: true },
                    { key: 'paymentTerms', label: 'Payment Terms', type: 'select', required: true, options: ['Upfront', 'Milestone-Based', 'Upon Completion', 'Monthly'] },
                    { key: 'exchangeType', label: 'Exchange Type', type: 'select', required: true, options: ['Cash', 'Barter', 'Mixed'] },
                    { key: 'barterOffer', label: 'Barter Offer', type: 'textarea', required: false, maxLength: 500, conditional: { field: 'exchangeType', value: ['Barter', 'Mixed'] } }
                ]
            },
            consortium: {
                name: 'Consortium',
                attributes: [
                    { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
                    { key: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Infrastructure', 'Building', 'Industrial', 'Energy', 'Other'] },
                    { key: 'projectValue', label: 'Project Value', type: 'currency', required: true },
                    { key: 'projectDuration', label: 'Project Duration (months)', type: 'number', required: true },
                    { key: 'projectLocation', label: 'Project Location', type: 'text', required: true },
                    { key: 'leadMember', label: 'Are you the lead member?', type: 'boolean', required: true },
                    { key: 'requiredMembers', label: 'Required Members', type: 'number', required: true },
                    { key: 'memberRoles', label: 'Member Roles', type: 'array-objects', required: true },
                    { key: 'scopeDivision', label: 'Scope Division', type: 'select', required: true, options: ['By Trade', 'By Phase', 'By Geography', 'Mixed'] },
                    { key: 'liabilityStructure', label: 'Liability Structure', type: 'select', required: true, options: ['Individual', 'Joint & Several', 'Mixed'] },
                    { key: 'clientType', label: 'Client Type', type: 'select', required: true, options: ['Government', 'Private', 'PPP', 'Other'] },
                    { key: 'tenderDeadline', label: 'Tender Deadline', type: 'date', required: false },
                    { key: 'prequalificationRequired', label: 'Prequalification Required', type: 'boolean', required: true },
                    { key: 'minimumRequirements', label: 'Minimum Requirements', type: 'array-objects', required: true },
                    { key: 'consortiumAgreement', label: 'Formal Consortium Agreement', type: 'boolean', required: true },
                    { key: 'paymentDistribution', label: 'Payment Distribution', type: 'select', required: true, options: ['Per Scope', 'Proportional', 'Fixed Percentage'] },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            },
            project_jv: {
                name: 'Project-Specific Joint Venture',
                attributes: [
                    { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
                    { key: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Building', 'Infrastructure', 'Industrial', 'Energy', 'Real Estate Development', 'Other'] },
                    { key: 'projectValue', label: 'Project Value', type: 'currency', required: true },
                    { key: 'projectDuration', label: 'Project Duration (months)', type: 'number', required: true },
                    { key: 'projectLocation', label: 'Project Location', type: 'text', required: true },
                    { key: 'jvStructure', label: 'JV Structure', type: 'select', required: true, options: ['Contractual', 'Incorporated LLC', 'Incorporated Corporation'] },
                    { key: 'equitySplit', label: 'Equity Split', type: 'array-percentages', required: true },
                    { key: 'capitalContribution', label: 'Capital Contribution', type: 'currency', required: true },
                    { key: 'partnerRoles', label: 'Partner Roles', type: 'array-objects', required: true },
                    { key: 'managementStructure', label: 'Management Structure', type: 'select', required: true, options: ['Equal Management', 'Lead Partner', 'Management Committee', 'Professional Manager'] },
                    { key: 'profitDistribution', label: 'Profit Distribution', type: 'select', required: true, options: ['Proportional to Equity', 'Fixed Percentage', 'Performance-Based'] },
                    { key: 'riskAllocation', label: 'Risk Allocation', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'exitStrategy', label: 'Exit Strategy', type: 'select', required: true, options: ['Dissolution', 'Asset Sale', 'Buyout Option', 'Conversion to Strategic JV'] },
                    { key: 'governance', label: 'Governance Structure', type: 'textarea', required: false, maxLength: 1000, conditional: { field: 'jvStructure', value: ['Incorporated LLC', 'Incorporated Corporation'] } },
                    { key: 'disputeResolution', label: 'Dispute Resolution', type: 'select', required: true, options: ['Arbitration', 'Mediation', 'Court', 'Other'] },
                    { key: 'partnerRequirements', label: 'Partner Requirements', type: 'array-objects', required: true },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            },
            spv: {
                name: 'Special Purpose Vehicle (SPV)',
                attributes: [
                    { key: 'projectTitle', label: 'Project Title', type: 'text', required: true, maxLength: 150 },
                    { key: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Infrastructure', 'Energy', 'Real Estate', 'PPP', 'Industrial', 'Other'] },
                    { key: 'projectValue', label: 'Project Value (Minimum 50M SAR)', type: 'currency', required: true, min: 50000000 },
                    { key: 'projectDuration', label: 'Project Duration (years)', type: 'number', required: true },
                    { key: 'projectLocation', label: 'Project Location', type: 'text', required: true },
                    { key: 'spvLegalForm', label: 'SPV Legal Form', type: 'select', required: true, options: ['LLC', 'Limited Partnership', 'Corporation', 'Trust'] },
                    { key: 'sponsors', label: 'Sponsors', type: 'array-objects', required: true },
                    { key: 'equityStructure', label: 'Equity Structure', type: 'array-objects', required: true },
                    { key: 'debtFinancing', label: 'Debt Financing', type: 'currency', required: true },
                    { key: 'debtType', label: 'Debt Type', type: 'select', required: true, options: ['Non-Recourse', 'Limited Recourse', 'Recourse'] },
                    { key: 'lenders', label: 'Target Lenders', type: 'tags', required: false },
                    { key: 'projectPhase', label: 'Project Phase', type: 'select', required: true, options: ['Concept', 'Feasibility', 'Financing', 'Construction', 'Operation'] },
                    { key: 'revenueModel', label: 'Revenue Model', type: 'select', required: true, options: ['User Fees', 'Government Payments', 'Asset Sale', 'Lease', 'Other'] },
                    { key: 'riskAllocation', label: 'Risk Allocation', type: 'textarea', required: true, maxLength: 2000 },
                    { key: 'governanceStructure', label: 'Governance Structure', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'regulatoryApprovals', label: 'Regulatory Approvals', type: 'tags', required: true },
                    { key: 'exitStrategy', label: 'Exit Strategy', type: 'select', required: true, options: ['Asset Transfer', 'Liquidation', 'Sale', 'Conversion to Permanent Entity'] },
                    { key: 'professionalServicesNeeded', label: 'Professional Services Needed', type: 'multi-select', required: true, options: ['Legal', 'Financial', 'Technical', 'Environmental', 'Other'] },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            }
        }
    },
    
    // Model 2: Strategic Partnerships
    strategic_partnership: {
        name: 'Strategic Partnerships',
        subModels: {
            strategic_jv: {
                name: 'Strategic Joint Venture',
                attributes: [
                    { key: 'jvName', label: 'JV Name', type: 'text', required: true, maxLength: 150 },
                    { key: 'strategicObjective', label: 'Strategic Objective', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'businessScope', label: 'Business Scope', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'targetSectors', label: 'Target Sectors', type: 'multi-select', required: true, options: ['Construction', 'Energy', 'Real Estate', 'Manufacturing', 'Technology', 'Other'] },
                    { key: 'geographicScope', label: 'Geographic Scope', type: 'multi-select', required: true, options: ['Saudi Arabia', 'GCC', 'MENA', 'Global'] },
                    { key: 'duration', label: 'Duration', type: 'select', required: true, options: ['10-15 years', '15-20 years', 'Indefinite', 'Until specific milestone'] },
                    { key: 'jvStructure', label: 'JV Structure', type: 'select', required: true, options: ['Incorporated LLC', 'Incorporated Corporation', 'Limited Partnership'] },
                    { key: 'equitySplit', label: 'Equity Split', type: 'array-percentages', required: true },
                    { key: 'initialCapital', label: 'Initial Capital', type: 'currency', required: true },
                    { key: 'ongoingFunding', label: 'Ongoing Funding', type: 'select', required: true, options: ['Partner Contributions', 'Retained Earnings', 'External Financing', 'Mixed'] },
                    { key: 'partnerContributions', label: 'Partner Contributions', type: 'array-objects', required: true },
                    { key: 'managementStructure', label: 'Management Structure', type: 'select', required: true, options: ['Equal Management', 'Lead Partner', 'Professional CEO', 'Management Committee'] },
                    { key: 'governance', label: 'Governance Structure', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'profitDistribution', label: 'Profit Distribution', type: 'select', required: true, options: ['Proportional to Equity', 'Reinvested', 'Performance-Based'] },
                    { key: 'exitOptions', label: 'Exit Options', type: 'multi-select', required: true, options: ['Buyout', 'IPO', 'Sale to Third Party', 'Dissolution'] },
                    { key: 'nonCompete', label: 'Non-Compete Clauses', type: 'boolean', required: true },
                    { key: 'technologyTransfer', label: 'Technology Transfer Involved', type: 'boolean', required: false },
                    { key: 'partnerRequirements', label: 'Partner Requirements', type: 'array-objects', required: true },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            },
            strategic_alliance: {
                name: 'Long-Term Strategic Alliance',
                attributes: [
                    { key: 'allianceTitle', label: 'Alliance Title', type: 'text', required: true, maxLength: 150 },
                    { key: 'allianceType', label: 'Alliance Type', type: 'select', required: true, options: ['Preferred Supplier', 'Technology Licensing', 'Market Access', 'Knowledge Sharing', 'Joint Service Offering', 'Other'] },
                    { key: 'strategicObjective', label: 'Strategic Objective', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'scopeOfCollaboration', label: 'Scope of Collaboration', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'duration', label: 'Duration (years)', type: 'number', required: true, min: 3 },
                    { key: 'exclusivity', label: 'Exclusive Arrangement', type: 'boolean', required: true },
                    { key: 'geographicScope', label: 'Geographic Scope', type: 'tags', required: true },
                    { key: 'financialTerms', label: 'Financial Terms', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'performanceMetrics', label: 'Performance Metrics', type: 'array-objects', required: true },
                    { key: 'governance', label: 'Governance', type: 'textarea', required: true, maxLength: 500 },
                    { key: 'terminationConditions', label: 'Termination Conditions', type: 'textarea', required: true, maxLength: 500 },
                    { key: 'partnerRequirements', label: 'Partner Requirements', type: 'array-objects', required: true },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            },
            mentorship: {
                name: 'Mentorship Program',
                attributes: [
                    { key: 'mentorshipTitle', label: 'Mentorship Title', type: 'text', required: true, maxLength: 100 },
                    { key: 'mentorshipType', label: 'Mentorship Type', type: 'select', required: true, options: ['Technical', 'Career Development', 'Business', 'Leadership', 'Project Management', 'Design', 'Other'] },
                    { key: 'experienceLevel', label: 'Mentee Experience Level', type: 'select', required: true, options: ['Entry-Level', 'Junior', 'Mid-Level', 'Senior transitioning to leadership'] },
                    { key: 'targetSkills', label: 'Target Skills', type: 'tags', required: true },
                    { key: 'duration', label: 'Duration (months)', type: 'number', required: true },
                    { key: 'frequency', label: 'Meeting Frequency', type: 'select', required: true, options: ['Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'] },
                    { key: 'format', label: 'Format', type: 'select', required: true, options: ['In-Person', 'Virtual', 'Hybrid', 'On-Site Shadowing'] },
                    { key: 'compensation', label: 'Compensation', type: 'select', required: true, options: ['Unpaid', 'Paid Hourly', 'Paid Monthly', 'Barter'] },
                    { key: 'barterOffer', label: 'Barter Offer', type: 'textarea', required: false, maxLength: 500, conditional: { field: 'compensation', value: 'Barter' } },
                    { key: 'mentorRequirements', label: 'Mentor Requirements', type: 'array-objects', required: false },
                    { key: 'menteeBackground', label: 'Mentee Background', type: 'textarea', required: false, maxLength: 500 },
                    { key: 'successMetrics', label: 'Success Metrics', type: 'tags', required: false },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            }
        }
    },
    
    // Model 3: Resource Pooling & Sharing
    resource_pooling: {
        name: 'Resource Pooling & Sharing',
        subModels: {
            bulk_purchasing: {
                name: 'Bulk Purchasing',
                attributes: [
                    { key: 'productService', label: 'Product/Service', type: 'text', required: true, maxLength: 150 },
                    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Materials', 'Equipment', 'Software', 'Services', 'Other'] },
                    { key: 'quantityNeeded', label: 'Quantity Needed', type: 'number', required: true },
                    { key: 'unitOfMeasure', label: 'Unit of Measure', type: 'text', required: true },
                    { key: 'targetPrice', label: 'Target Price per Unit', type: 'currency', required: true },
                    { key: 'currentMarketPrice', label: 'Current Market Price', type: 'currency', required: false },
                    { key: 'expectedSavings', label: 'Expected Savings (%)', type: 'number', required: false },
                    { key: 'deliveryTimeline', label: 'Delivery Timeline', type: 'date-range', required: true },
                    { key: 'deliveryLocation', label: 'Delivery Location', type: 'text', required: true },
                    { key: 'paymentStructure', label: 'Payment Structure', type: 'select', required: true, options: ['Upfront Collection', 'Escrow', 'Pay on Delivery', 'Other'] },
                    { key: 'participantsNeeded', label: 'Participants Needed', type: 'number', required: true },
                    { key: 'minimumOrder', label: 'Minimum Order Quantity', type: 'number', required: false },
                    { key: 'leadOrganizer', label: 'Are you the organizer?', type: 'boolean', required: true },
                    { key: 'supplier', label: 'Preferred Supplier', type: 'text', required: false },
                    { key: 'distributionMethod', label: 'Distribution Method', type: 'select', required: true, options: ['Centralized Pickup', 'Individual Delivery', 'Organizer Distributes'] },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            },
            equipment_sharing: {
                name: 'Equipment Sharing',
                attributes: [
                    { key: 'assetDescription', label: 'Asset Description', type: 'text', required: true, maxLength: 150 },
                    { key: 'assetType', label: 'Asset Type', type: 'select', required: true, options: ['Heavy Equipment', 'Vehicles', 'Tools', 'Technology', 'Facility', 'Other'] },
                    { key: 'purchasePrice', label: 'Purchase Price', type: 'currency', required: true },
                    { key: 'ownershipStructure', label: 'Ownership Structure', type: 'select', required: true, options: ['Equal Shares', 'Proportional to Investment', 'LLC', 'Partnership'] },
                    { key: 'numberOfCoOwners', label: 'Number of Co-Owners', type: 'number', required: true },
                    { key: 'equityPerOwner', label: 'Equity Per Owner (%)', type: 'number', required: true },
                    { key: 'initialInvestment', label: 'Initial Investment per Owner', type: 'currency', required: true },
                    { key: 'ongoingCosts', label: 'Ongoing Costs', type: 'array-objects', required: true },
                    { key: 'costSharing', label: 'Cost Sharing', type: 'select', required: true, options: ['Equally', 'Proportional to Usage', 'Proportional to Ownership'] },
                    { key: 'usageSchedule', label: 'Usage Schedule', type: 'select', required: true, options: ['Rotation', 'Booking System', 'Priority by Ownership %'] },
                    { key: 'assetLocation', label: 'Asset Location', type: 'text', required: true },
                    { key: 'maintenanceResponsibility', label: 'Maintenance Responsibility', type: 'select', required: true, options: ['Shared', 'Designated Owner', 'Third-Party Service'] },
                    { key: 'insurance', label: 'Asset Insured', type: 'boolean', required: true },
                    { key: 'exitStrategy', label: 'Exit Strategy', type: 'select', required: true, options: ['Sell Share to Other Owners', 'Sell to Third Party', 'Liquidate Asset'] },
                    { key: 'disputeResolution', label: 'Dispute Resolution', type: 'select', required: true, options: ['Arbitration', 'Mediation', 'Court'] },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            },
            resource_sharing: {
                name: 'Resource Sharing & Exchange',
                attributes: [
                    { key: 'resourceTitle', label: 'Resource Title', type: 'text', required: true, maxLength: 150 },
                    { key: 'resourceType', label: 'Resource Type', type: 'select', required: true, options: ['Materials', 'Equipment', 'Labor', 'Services', 'Knowledge', 'Other'] },
                    { key: 'transactionType', label: 'Transaction Type', type: 'select', required: true, options: ['Sell', 'Buy', 'Rent', 'Barter', 'Donate'] },
                    { key: 'detailedDescription', label: 'Detailed Description', type: 'textarea', required: true, maxLength: 1000 },
                    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
                    { key: 'unitOfMeasure', label: 'Unit of Measure', type: 'text', required: true },
                    { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['New', 'Like New', 'Good', 'Fair', 'Poor'], conditional: { field: 'resourceType', value: ['Materials', 'Equipment'] } },
                    { key: 'location', label: 'Location', type: 'text', required: true },
                    { key: 'availability', label: 'Availability', type: 'date-range', required: true },
                    { key: 'price', label: 'Price', type: 'currency', required: false, conditional: { field: 'transactionType', value: ['Sell', 'Rent'] } },
                    { key: 'barterOffer', label: 'Barter Offer', type: 'textarea', required: false, maxLength: 1000, conditional: { field: 'transactionType', value: ['Barter'] } },
                    { key: 'barterPreferences', label: 'Barter Preferences', type: 'multi-select', required: false, options: ['Materials', 'Equipment', 'Labor', 'Services', 'Knowledge', 'Certification', 'Other'], conditional: { field: 'transactionType', value: ['Barter'] } },
                    { key: 'delivery', label: 'Delivery', type: 'select', required: true, options: ['Buyer Pickup', 'Seller Delivery', 'Negotiable'] },
                    { key: 'paymentTerms', label: 'Payment Terms', type: 'select', required: false, options: ['Upfront', 'On Delivery', 'Installments'], conditional: { field: 'transactionType', value: ['Sell', 'Rent'] } },
                    { key: 'urgency', label: 'Urgency', type: 'select', required: true, options: ['Immediate', 'Within 1 Week', 'Within 1 Month', 'Flexible'] },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            }
        }
    },
    
    // Model 4: Hiring a Resource
    hiring: {
        name: 'Hiring a Resource',
        subModels: {
            professional_hiring: {
                name: 'Professional Hiring',
                attributes: [
                    { key: 'jobTitle', label: 'Job Title', type: 'text', required: true, maxLength: 100 },
                    { key: 'jobCategory', label: 'Job Category', type: 'select', required: true, options: ['Engineering', 'Project Management', 'Architecture', 'Quantity Surveying', 'Site Supervision', 'Safety', 'Other'] },
                    { key: 'employmentType', label: 'Employment Type', type: 'select', required: true, options: ['Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Temporary'] },
                    { key: 'contractDuration', label: 'Contract Duration (months)', type: 'number', required: false, conditional: { field: 'employmentType', value: ['Contract', 'Temporary'] } },
                    { key: 'jobDescription', label: 'Job Description', type: 'textarea', required: true, maxLength: 2000 },
                    { key: 'requiredQualifications', label: 'Required Qualifications', type: 'tags', required: true },
                    { key: 'requiredExperience', label: 'Required Experience (years)', type: 'number', required: true },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: true },
                    { key: 'preferredSkills', label: 'Preferred Skills', type: 'tags', required: false },
                    { key: 'location', label: 'Location', type: 'text', required: true },
                    { key: 'workMode', label: 'Work Mode', type: 'select', required: true, options: ['On-Site', 'Remote', 'Hybrid'] },
                    { key: 'salaryRange', label: 'Salary Range', type: 'currency-range', required: true },
                    { key: 'benefits', label: 'Benefits', type: 'tags', required: false },
                    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
                    { key: 'reportingTo', label: 'Reporting To', type: 'text', required: false },
                    { key: 'teamSize', label: 'Team Size', type: 'number', required: false },
                    { key: 'applicationDeadline', label: 'Application Deadline', type: 'date', required: false }
                ]
            },
            consultant_hiring: {
                name: 'Consultant Hiring',
                attributes: [
                    { key: 'consultationTitle', label: 'Consultation Title', type: 'text', required: true, maxLength: 100 },
                    { key: 'consultationType', label: 'Consultation Type', type: 'select', required: true, options: ['Legal', 'Financial', 'Technical', 'Sustainability', 'Safety', 'Design', 'Project Management', 'Other'] },
                    { key: 'scopeOfWork', label: 'Scope of Work', type: 'textarea', required: true, maxLength: 2000 },
                    { key: 'deliverables', label: 'Deliverables', type: 'tags', required: true },
                    { key: 'duration', label: 'Duration (days/weeks)', type: 'number', required: true },
                    { key: 'requiredExpertise', label: 'Required Expertise', type: 'tags', required: true },
                    { key: 'requiredCertifications', label: 'Required Certifications', type: 'tags', required: false },
                    { key: 'experienceLevel', label: 'Experience Level', type: 'select', required: true, options: ['Mid-Level', 'Senior', 'Expert'] },
                    { key: 'locationRequirement', label: 'Location Requirement', type: 'select', required: true, options: ['Remote', 'On-Site', 'Hybrid'] },
                    { key: 'budget', label: 'Budget', type: 'currency-range', required: true },
                    { key: 'paymentTerms', label: 'Payment Terms', type: 'select', required: true, options: ['Upfront', 'Milestone-Based', 'Upon Completion'] },
                    { key: 'startDate', label: 'Start Date', type: 'date', required: true },
                    { key: 'exchangeType', label: 'Exchange Type', type: 'select', required: true, options: ['Cash', 'Barter', 'Mixed'] },
                    { key: 'barterOffer', label: 'Barter Offer', type: 'textarea', required: false, maxLength: 500, conditional: { field: 'exchangeType', value: ['Barter', 'Mixed'] } },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            }
        }
    },
    
    // Model 5: Call for Competition
    competition: {
        name: 'Call for Competition',
        subModels: {
            competition_rfp: {
                name: 'Competition/RFP',
                attributes: [
                    { key: 'competitionTitle', label: 'Competition Title', type: 'text', required: true, maxLength: 150 },
                    { key: 'competitionType', label: 'Competition Type', type: 'select', required: true, options: ['Design Competition', 'RFP', 'RFQ', 'Solution Challenge', 'Innovation Contest', 'Other'] },
                    { key: 'competitionScope', label: 'Competition Scope', type: 'textarea', required: true, maxLength: 2000 },
                    { key: 'participantType', label: 'Participant Type', type: 'select', required: true, options: ['Companies Only', 'Professionals Only', 'Both'] },
                    { key: 'competitionFormat', label: 'Competition Format', type: 'select', required: true, options: ['Open to All', 'Invited Only', 'Prequalified Participants'] },
                    { key: 'eligibilityCriteria', label: 'Eligibility Criteria', type: 'array-objects', required: true },
                    { key: 'submissionRequirements', label: 'Submission Requirements', type: 'tags', required: true },
                    { key: 'evaluationCriteria', label: 'Evaluation Criteria', type: 'array-objects', required: true },
                    { key: 'evaluationWeights', label: 'Evaluation Weights', type: 'array-percentages', required: true },
                    { key: 'prizeContractValue', label: 'Prize/Contract Value', type: 'currency', required: true },
                    { key: 'numberOfWinners', label: 'Number of Winners', type: 'number', required: true },
                    { key: 'submissionDeadline', label: 'Submission Deadline', type: 'date', required: true },
                    { key: 'announcementDate', label: 'Announcement Date', type: 'date', required: true },
                    { key: 'competitionRules', label: 'Competition Rules', type: 'textarea', required: true, maxLength: 2000 },
                    { key: 'intellectualProperty', label: 'Intellectual Property', type: 'select', required: true, options: ['Submitter Retains', 'Client Owns', 'Shared', 'Winner Transfers'] },
                    { key: 'submissionFee', label: 'Submission Fee', type: 'currency', required: false },
                    { key: 'requiredSkills', label: 'Required Skills', type: 'tags', required: false }
                ]
            }
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OPPORTUNITY_MODELS;
} else {
    window.OPPORTUNITY_MODELS = OPPORTUNITY_MODELS;
}
