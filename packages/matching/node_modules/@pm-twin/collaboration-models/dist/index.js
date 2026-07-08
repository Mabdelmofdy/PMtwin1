// src/types.ts
var MATCH_TOPOLOGY_KEYS = [
  "one_way",
  "two_way",
  "consortium",
  "circular"
];
var EXCHANGE_MODE_KEYS = [
  "cash",
  "barter",
  "equity",
  "profit_sharing",
  "hybrid"
];
var MAIN_COLLABORATION_MODEL_KEYS = [
  "cash_subcontracting",
  "service_exchange",
  "joint_venture",
  "resource_sharing",
  "hiring"
];
var MODEL_TYPE_KEYS = [
  "project_based",
  "strategic_partnership",
  "resource_pooling",
  "hiring",
  "competition"
];
var SUB_MODEL_TYPE_KEYS = [
  "task_based",
  "consortium",
  "project_jv",
  "spv",
  "strategic_jv",
  "strategic_alliance",
  "mentorship",
  "bulk_purchasing",
  "equipment_sharing",
  "resource_sharing",
  "professional_hiring",
  "consultant_hiring",
  "competition_rfp"
];

// src/registry/legacy-attributes.ts
function attrs(fields) {
  return fields;
}
var TASK_BASED_ATTRIBUTES = attrs([
  { key: "taskTitle", label: "Task Title", type: "text", required: true, maxLength: 100 },
  { key: "taskType", label: "Task Type", type: "select", required: true, options: ["Design", "Engineering", "Consultation", "Review", "Analysis", "Other"] },
  { key: "detailedScope", label: "Detailed Scope", type: "textarea", required: true, maxLength: 2e3 },
  { key: "duration", label: "Duration (days)", type: "number", required: true, min: 1 },
  { key: "requiredSkills", label: "Required Skills", type: "tags", required: true },
  { key: "experienceLevel", label: "Experience Level", type: "select", required: true, options: ["Junior", "Mid-Level", "Senior", "Expert"] },
  { key: "startDate", label: "Start Date", type: "date", required: true },
  { key: "paymentTerms", label: "Payment Terms", type: "select", required: true, options: ["Upfront", "Milestone-Based", "Upon Completion", "Monthly"] }
]);
var CONSORTIUM_ATTRIBUTES = attrs([
  { key: "projectTitle", label: "Project Title", type: "text", required: true, maxLength: 150 },
  { key: "requiredMembers", label: "Required Members", type: "number", required: true, min: 2 },
  { key: "memberRoles", label: "Member Roles", type: "array-objects", required: true },
  { key: "scopeDivision", label: "Scope Division", type: "select", required: true, options: ["By Trade", "By Phase", "By Geography", "Mixed"] },
  { key: "minimumRequirements", label: "Minimum Requirements", type: "array-objects", required: true },
  { key: "tenderDeadline", label: "Tender Deadline", type: "date", required: false }
]);
var PROJECT_JV_ATTRIBUTES = attrs([
  { key: "projectTitle", label: "Project Title", type: "text", required: true, maxLength: 150 },
  { key: "partnerRoles", label: "Partner Roles", type: "array-objects", required: true },
  { key: "equitySplit", label: "Equity Split", type: "array-percentages", required: true },
  { key: "capitalContribution", label: "Capital Contribution", type: "currency", required: true },
  { key: "profitDistribution", label: "Profit Distribution", type: "select", required: true, options: ["Proportional to Equity", "Fixed Percentage", "Performance-Based"] },
  { key: "governance", label: "Governance Structure", type: "textarea", required: false, maxLength: 1e3 }
]);
var SPV_ATTRIBUTES = attrs([
  { key: "projectTitle", label: "Project Title", type: "text", required: true, maxLength: 150 },
  { key: "spvLegalForm", label: "SPV Legal Form", type: "select", required: true, options: ["LLC", "Limited Partnership", "Corporation", "Trust"] },
  { key: "equityStructure", label: "Equity Structure", type: "array-objects", required: true },
  { key: "projectValue", label: "Project Value", type: "currency", required: true, min: 5e7 },
  { key: "governanceStructure", label: "Governance Structure", type: "textarea", required: true, maxLength: 1e3 }
]);
var STRATEGIC_JV_ATTRIBUTES = attrs([
  { key: "jvName", label: "JV Name", type: "text", required: true, maxLength: 150 },
  { key: "strategicObjective", label: "Strategic Objective", type: "textarea", required: true, maxLength: 1e3 },
  { key: "equitySplit", label: "Equity Split", type: "array-percentages", required: true },
  { key: "partnerContributions", label: "Partner Contributions", type: "array-objects", required: true },
  { key: "governance", label: "Governance Structure", type: "textarea", required: true, maxLength: 1e3 }
]);
var STRATEGIC_ALLIANCE_ATTRIBUTES = attrs([
  { key: "allianceTitle", label: "Alliance Title", type: "text", required: true, maxLength: 150 },
  { key: "allianceType", label: "Alliance Type", type: "select", required: true, options: ["Preferred Supplier", "Technology Licensing", "Market Access", "Knowledge Sharing", "Joint Service Offering", "Other"] },
  { key: "scopeOfCollaboration", label: "Scope of Collaboration", type: "textarea", required: true, maxLength: 1e3 },
  { key: "financialTerms", label: "Financial Terms", type: "textarea", required: true, maxLength: 1e3 },
  { key: "duration", label: "Duration (years)", type: "number", required: true, min: 3 }
]);
var MENTORSHIP_ATTRIBUTES = attrs([
  { key: "mentorshipTitle", label: "Mentorship Title", type: "text", required: true, maxLength: 100 },
  { key: "mentorshipType", label: "Mentorship Type", type: "select", required: true, options: ["Technical", "Career Development", "Business", "Leadership", "Project Management", "Design", "Other"] },
  { key: "targetSkills", label: "Target Skills", type: "tags", required: true },
  { key: "duration", label: "Duration (months)", type: "number", required: true }
]);
var BULK_PURCHASING_ATTRIBUTES = attrs([
  { key: "productService", label: "Product/Service", type: "text", required: true, maxLength: 150 },
  { key: "quantityNeeded", label: "Quantity Needed", type: "number", required: true },
  { key: "participantsNeeded", label: "Participants Needed", type: "number", required: true },
  { key: "deliveryTimeline", label: "Delivery Timeline", type: "date-range", required: true }
]);
var EQUIPMENT_SHARING_ATTRIBUTES = attrs([
  { key: "assetDescription", label: "Asset Description", type: "text", required: true, maxLength: 150 },
  { key: "assetType", label: "Equipment Type", type: "select", required: true, options: ["Heavy Equipment", "Vehicles", "Tools", "Technology", "Facility", "Other"] },
  { key: "assetLocation", label: "Location", type: "text", required: true },
  { key: "availability", label: "Availability", type: "date-range", required: true },
  { key: "usageSchedule", label: "Usage Terms", type: "select", required: true, options: ["Rotation", "Booking System", "Priority by Ownership %"] }
]);
var RESOURCE_SHARING_ATTRIBUTES = attrs([
  { key: "resourceTitle", label: "Resource Title", type: "text", required: true, maxLength: 150 },
  { key: "resourceType", label: "Resource Type", type: "select", required: true, options: ["Materials", "Equipment", "Labor", "Services", "Knowledge", "Other"] },
  { key: "location", label: "Location", type: "text", required: true },
  { key: "availability", label: "Availability", type: "date-range", required: true },
  { key: "transactionType", label: "Transaction Type", type: "select", required: true, options: ["Sell", "Buy", "Rent", "Barter", "Donate"] }
]);
var PROFESSIONAL_HIRING_ATTRIBUTES = attrs([
  { key: "jobTitle", label: "Role", type: "text", required: true, maxLength: 100 },
  { key: "requiredExperience", label: "Required Experience (years)", type: "number", required: true },
  { key: "contractDuration", label: "Duration (months)", type: "number", required: false },
  { key: "salaryRange", label: "Rate / Salary Range", type: "currency-range", required: true },
  { key: "requiredSkills", label: "Required Skills", type: "tags", required: true },
  { key: "startDate", label: "Start Date", type: "date", required: true }
]);
var CONSULTANT_HIRING_ATTRIBUTES = attrs([
  { key: "consultationTitle", label: "Consultation Title", type: "text", required: true, maxLength: 100 },
  { key: "consultationType", label: "Specialty", type: "select", required: true, options: ["Legal", "Financial", "Technical", "Sustainability", "Safety", "Design", "Project Management", "Other"] },
  { key: "scopeOfWork", label: "Engagement Type / Scope", type: "textarea", required: true, maxLength: 2e3 },
  { key: "deliverables", label: "Deliverables", type: "tags", required: true },
  { key: "budget", label: "Budget", type: "currency-range", required: true },
  { key: "duration", label: "Duration", type: "number", required: true }
]);
var COMPETITION_RFP_ATTRIBUTES = attrs([
  { key: "competitionTitle", label: "Competition Title", type: "text", required: true, maxLength: 150 },
  { key: "submissionDeadline", label: "Submission Deadline", type: "date", required: true },
  { key: "evaluationCriteria", label: "Evaluation Criteria", type: "array-objects", required: true },
  { key: "prizeContractValue", label: "Award Terms / Prize Value", type: "currency", required: true },
  { key: "competitionRules", label: "Competition Rules", type: "textarea", required: true, maxLength: 2e3 }
]);

// src/knowledge/builders.ts
var DEFAULT_KNOWLEDGE_METADATA = {
  schemaVersion: "1.0",
  knowledgeVersion: 1,
  lastUpdated: "2026-07",
  deprecated: false,
  stability: "stable"
};
var CORE_DASHBOARD_WIDGETS = [
  { id: "success_rate", label: "Success Rate", metricKey: "success_rate" },
  { id: "avg_duration", label: "Average Duration", metricKey: "avg_duration" },
  {
    id: "avg_commercial_value",
    label: "Average Commercial Value",
    metricKey: "avg_commercial_value"
  },
  { id: "top_industries", label: "Top Industries", metricKey: "top_industries" },
  {
    id: "most_used_exchange_mode",
    label: "Most Used Exchange Mode",
    metricKey: "most_used_exchange_mode"
  }
];
var TYPE_TO_GROUP = {
  currency: "financial",
  "currency-range": "financial",
  date: "timeline",
  "date-range": "timeline",
  datetime: "timeline",
  location: "location",
  skills: "requirements",
  equipment: "resources",
  resource: "resources",
  attachment: "requirements"
};
function inferFieldGroup(field) {
  const key = field.key.toLowerCase();
  if (key.includes("budget") || key.includes("salary") || key.includes("equity") || key.includes("capital") || key.includes("profit") || key.includes("payment") || key.includes("price") || key.includes("financial") || key.includes("prize")) {
    return "financial";
  }
  if (key.includes("date") || key.includes("duration") || key.includes("deadline") || key.includes("timeline") || key.includes("schedule") || key.includes("availability")) {
    return "timeline";
  }
  if (key.includes("location") || key.includes("geography")) {
    return "location";
  }
  if (key.includes("skill") || key.includes("experience") || key.includes("requirement") || key.includes("eligibility") || key.includes("criteria")) {
    return "requirements";
  }
  if (key.includes("governance") || key.includes("legal") || key.includes("rule") || key.includes("compliance")) {
    return "legal";
  }
  if (key.includes("risk")) {
    return "risk";
  }
  if (key.includes("asset") || key.includes("resource") || key.includes("equipment") || key.includes("quantity") || key.includes("participant")) {
    return "resources";
  }
  if (key.includes("scope") || key.includes("deliverable") || key.includes("technical") || key.includes("evaluation")) {
    return "technical";
  }
  return TYPE_TO_GROUP[field.type] ?? "general";
}
function mapLegacyFieldType(type) {
  if (type === "tags") return "skills";
  if (type === "multi-select") return "multiselect";
  return type;
}
function attributesToDynamicFields(attributes, requiredKeys) {
  const required = new Set(requiredKeys);
  return attributes.map((attr, index) => ({
    id: attr.key,
    label: attr.label,
    description: attr.description ?? `${attr.label} for this collaboration model.`,
    type: mapLegacyFieldType(attr.type),
    required: required.has(attr.key) || attr.required,
    placeholder: `Enter ${attr.label.toLowerCase()}`,
    helpText: attr.description,
    validation: {
      ...attr.min != null ? { min: attr.min } : {},
      ...attr.maxLength != null ? { maxLength: attr.maxLength } : {}
    },
    displayOrder: (index + 1) * 10,
    group: inferFieldGroup(attr),
    ...attr.options ? { options: attr.options } : {}
  }));
}
function uniqueGroups(fields) {
  const seen = /* @__PURE__ */ new Set();
  const groups = [];
  for (const field of fields) {
    if (!seen.has(field.group)) {
      seen.add(field.group);
      groups.push(field.group);
    }
  }
  return groups;
}
function weightEntries(entries) {
  return entries.map((entry) => ({
    fieldId: entry.fieldId,
    weight: entry.weight,
    requiredWeight: entry.requiredWeight,
    recommendedWeight: entry.recommendedWeight
  }));
}

// src/knowledge/catalog.ts
var OPP_STAGES = [
  "draft",
  "published",
  "matched",
  "negotiating",
  "contracted",
  "executing",
  "completed"
];
function formFrom(attributes, requiredKeys) {
  const fields = attributesToDynamicFields(attributes, requiredKeys);
  return { groups: uniqueGroups(fields), fields };
}
function readinessFrom(requiredFields, optionalFields, weights) {
  return {
    requiredFields,
    optionalFields,
    minimumPublishFields: [...requiredFields],
    fieldWeights: weightEntries(weights)
  };
}
function leaf(id, prompt, outcome) {
  return { id, prompt, outcomeSubModel: outcome };
}
function branch(id, prompt, answers) {
  return { id, prompt, branches: answers.map((a) => ({ answer: a.answer, next: a.next })) };
}
function confidentialityFrom(fields, marketplaceIds, privateIds = []) {
  const all = fields.map((f) => f.id);
  const marketplace = marketplaceIds.filter((id) => all.includes(id));
  const privateFields = privateIds.filter((id) => all.includes(id));
  const participant = all.filter((id) => !privateFields.includes(id));
  return {
    marketplaceVisibleFields: marketplace,
    participantVisibleFields: participant,
    auditorVisibleFields: all,
    privateFields
  };
}
function marketWorkflow(partial) {
  return {
    supportedWorkflow: true,
    supportsNegotiation: true,
    supportsCommercialAgreement: true,
    supportsContract: true,
    supportsApplications: true,
    supportsMarketplace: true,
    supportsAward: true,
    ...partial
  };
}
function jvDeps(overrides) {
  return {
    requiresMarketplace: false,
    requiresMatching: true,
    requiresNegotiation: true,
    requiresCommercialAgreement: true,
    requiresContract: true,
    requiresAward: false,
    ...overrides
  };
}
function marketDeps(overrides) {
  return {
    requiresMarketplace: true,
    requiresMatching: true,
    requiresNegotiation: true,
    requiresCommercialAgreement: true,
    requiresContract: true,
    requiresAward: true,
    ...overrides
  };
}
function highRisk(factors, hints) {
  return { defaultRiskLevel: "high", riskFactors: factors, mitigationHints: hints };
}
function mediumRisk(factors, hints) {
  return { defaultRiskLevel: "medium", riskFactors: factors, mitigationHints: hints };
}
function lowRisk(factors, hints) {
  return { defaultRiskLevel: "low", riskFactors: factors, mitigationHints: hints };
}
function criticalRisk(factors, hints) {
  return { defaultRiskLevel: "critical", riskFactors: factors, mitigationHints: hints };
}
function compliance(flags) {
  return flags;
}
function metrics(...items) {
  return { metrics: items };
}
function m(id, label, description, weightHint) {
  return { id, label, description, weightHint };
}
function faq(question, answer) {
  return { question, answer };
}
var TASK_FORM = formFrom(TASK_BASED_ATTRIBUTES, ["detailedScope", "requiredSkills", "duration", "startDate"]);
var CONSORTIUM_FORM = formFrom(CONSORTIUM_ATTRIBUTES, ["memberRoles", "requiredMembers", "minimumRequirements"]);
var PROJECT_JV_FORM = formFrom(PROJECT_JV_ATTRIBUTES, ["partnerRoles", "equitySplit", "capitalContribution", "profitDistribution"]);
var SPV_FORM = formFrom(SPV_ATTRIBUTES, ["equityStructure", "spvLegalForm", "governanceStructure"]);
var STRATEGIC_JV_FORM = formFrom(STRATEGIC_JV_ATTRIBUTES, ["partnerContributions", "equitySplit", "governance"]);
var ALLIANCE_FORM = formFrom(STRATEGIC_ALLIANCE_ATTRIBUTES, ["scopeOfCollaboration", "duration", "financialTerms"]);
var MENTORSHIP_FORM = formFrom(MENTORSHIP_ATTRIBUTES, ["targetSkills", "duration", "mentorshipType"]);
var BULK_FORM = formFrom(BULK_PURCHASING_ATTRIBUTES, ["productService", "quantityNeeded", "participantsNeeded"]);
var EQUIPMENT_FORM = formFrom(EQUIPMENT_SHARING_ATTRIBUTES, ["assetType", "assetLocation", "availability", "usageSchedule"]);
var RESOURCE_FORM = formFrom(RESOURCE_SHARING_ATTRIBUTES, ["resourceType", "location", "availability"]);
var PROF_FORM = formFrom(PROFESSIONAL_HIRING_ATTRIBUTES, ["jobTitle", "requiredExperience", "salaryRange", "startDate"]);
var CONSULT_FORM = formFrom(CONSULTANT_HIRING_ATTRIBUTES, ["consultationType", "scopeOfWork", "deliverables", "budget"]);
var RFP_FORM = formFrom(COMPETITION_RFP_ATTRIBUTES, ["submissionDeadline", "evaluationCriteria", "prizeContractValue"]);
var SUB_MODEL_KNOWLEDGE = {
  task_based: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Task-Based Engagement",
      shortDescription: "Short-term paid delivery for a defined task or deliverable.",
      longDescription: "Task-Based Engagement lets an organization subcontract a discrete scope\u2014design, engineering, review, or analysis\u2014with clear duration, skills, and commercial terms.",
      businessPurpose: "Acquire missing capacity for time-bound deliverables without forming a long-term partnership structure.",
      businessOutcome: "Completed task deliverables under agreed payment and quality terms."
    },
    usage: {
      whenToUse: ["Scope is short and well-bounded", "Skills gap is temporary", "Cash or hybrid payment is preferred"],
      whenNotToUse: ["Long-term equity partnership needed", "Multi-party governance is primary", "Shared asset ownership is the goal"],
      bestFor: ["SMEs", "Project owners", "Specialist freelancers"],
      typicalIndustries: ["Construction", "Engineering", "ICT", "Consulting"],
      exampleScenarios: ["Hire a scheduler for 30 days", "Outsource a design review package"]
    },
    dynamicForm: TASK_FORM,
    readiness: readinessFrom(
      ["detailedScope", "requiredSkills", "duration", "startDate"],
      ["taskTitle", "taskType", "paymentTerms", "experienceLevel"],
      [
        { fieldId: "detailedScope", weight: 30, requiredWeight: 25, recommendedWeight: 5 },
        { fieldId: "requiredSkills", weight: 20, requiredWeight: 18, recommendedWeight: 2 },
        { fieldId: "duration", weight: 10, requiredWeight: 8, recommendedWeight: 2 },
        { fieldId: "startDate", weight: 10, requiredWeight: 8, recommendedWeight: 2 },
        { fieldId: "paymentTerms", weight: 10, requiredWeight: 5, recommendedWeight: 5 },
        { fieldId: "experienceLevel", weight: 10, requiredWeight: 5, recommendedWeight: 5 },
        { fieldId: "taskTitle", weight: 5, requiredWeight: 2, recommendedWeight: 3 },
        { fieldId: "taskType", weight: 5, requiredWeight: 2, recommendedWeight: 3 }
      ]
    ),
    matching: metrics(
      m("skills", "Skills", "Overlap between required and candidate skills", 25),
      m("budget", "Budget", "Alignment of commercial expectations", 20),
      m("availability", "Availability", "Calendar and capacity fit", 20),
      m("location", "Location", "Geographic / remote suitability", 15),
      m("experience", "Experience", "Level and domain tenure", 20)
    ),
    workflow: marketWorkflow(),
    dependencies: marketDeps({ requiresCommercialAgreement: false }),
    lifecycle: {
      typicalStages: [...OPP_STAGES],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["scope_statement"],
      optional: ["cv_portfolio", "insurance_certificate", "nda"]
    },
    confidentiality: confidentialityFrom(TASK_FORM.fields, ["taskTitle", "taskType", "duration", "requiredSkills", "experienceLevel"], ["paymentTerms"]),
    riskProfile: mediumRisk(
      ["Ambiguous scope", "Underpriced bids", "Skill mismatch"],
      ["Define acceptance criteria", "Milestone payments", "Skills verification"]
    ),
    compliance: compliance({
      requiresLegalReview: false,
      requiresFinancialReview: false,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "fixed_or_milestone",
      commercialTemplate: "task_sow_cash",
      recommendedCommercialTerms: ["Milestone payments", "Acceptance criteria", "VAT exclusive + 15% clear"]
    },
    education: {
      whatIsIt: "A focused subcontract for a discrete deliverable.",
      whyUseIt: "Fast capacity without forming a JV or long alliance.",
      advantages: ["Speed", "Clear commercials", "Easy marketplace matching"],
      risks: ["Scope creep", "Weak acceptance criteria"],
      typicalMistakes: ["Missing skills list", "No start date", "Vague deliverables"],
      realWorldExample: "A developer hires a BIM modeller for a 45-day package.",
      faq: [faq("Is equity allowed?", "Usually cash/hybrid; use JV models for equity.")],
      relatedModels: ["consultant_hiring", "competition_rfp", "professional_hiring"]
    },
    ai: {
      intentKeywords: ["task", "subcontract", "deliverable", "freelancer", "short term"],
      recommendedQuestions: ["What is the deliverable?", "Which skills are mandatory?", "When must work start?"],
      decisionHints: ["Prefer task_based when scope is short and one-sided delivery"],
      confidenceFactors: ["Clear scope", "Skills listed", "Duration known"],
      missingInformationPrompts: ["Add detailed scope", "Add required skills", "Confirm start date"],
      decisionTree: branch("need_capacity", "Need short-term delivery capacity?", [
        {
          answer: "Yes",
          next: branch("need_partner_equity", "Need equity partner?", [
            { answer: "No", next: leaf("task", "Use Task-Based Engagement", "task_based") },
            { answer: "Yes", next: leaf("jv", "Consider Project JV", "project_jv") }
          ])
        },
        { answer: "No", next: leaf("mentor", "Consider Mentorship", "mentorship") }
      ])
    },
    analytics: {
      primaryKPIs: ["completion_rate", "time_to_award"],
      secondaryKPIs: ["applicant_count", "renegotiation_rate"],
      successMetrics: ["on_time_delivery", "acceptance_first_pass"],
      timeMetrics: ["days_to_match", "engagement_duration"],
      financialMetrics: ["avg_contract_value", "vat_inclusive_spend"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  consortium: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Consortium",
      shortDescription: "Multi-party delivery vehicle with defined member roles.",
      longDescription: "Consortium coordinates multiple organizations under shared tender or project delivery with role, membership, and minimum requirement definitions.",
      businessPurpose: "Combine complementary capabilities to chase or deliver larger packages.",
      businessOutcome: "Aligned multi-party team ready for tender or joint delivery."
    },
    usage: {
      whenToUse: ["Tender needs multiple specialties", "No single firm can cover full scope"],
      whenNotToUse: ["Simple one-to-one subcontract", "Equity SPV already required"],
      bestFor: ["Contractors", "Specialist firms", "Public tenders"],
      typicalIndustries: ["Infrastructure", "Construction", "Energy"],
      exampleScenarios: ["Civil + MEP consortium for a metro package"]
    },
    dynamicForm: CONSORTIUM_FORM,
    readiness: readinessFrom(
      ["memberRoles", "requiredMembers", "minimumRequirements"],
      ["projectTitle", "scopeDivision", "tenderDeadline"],
      [
        { fieldId: "memberRoles", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "requiredMembers", weight: 15, requiredWeight: 12, recommendedWeight: 3 },
        { fieldId: "minimumRequirements", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "projectTitle", weight: 10, requiredWeight: 5, recommendedWeight: 5 },
        { fieldId: "scopeDivision", weight: 15, requiredWeight: 8, recommendedWeight: 7 },
        { fieldId: "tenderDeadline", weight: 10, requiredWeight: 5, recommendedWeight: 5 }
      ]
    ),
    matching: metrics(
      m("capability_coverage", "Capability Coverage", "Roles covered across members", 30),
      m("capacity", "Capacity", "Combined delivery capacity", 20),
      m("track_record", "Track Record", "Relevant joint or solo delivery history", 25),
      m("compliance", "Compliance", "Prequalification and licensing", 25)
    ),
    workflow: marketWorkflow({ supportsMarketplace: true, supportsAward: true }),
    dependencies: jvDeps({ requiresMatching: true, requiresAward: true, requiresMarketplace: true }),
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["member_list", "role_matrix"],
      optional: ["mou", "past_performance", "prequalification_pack"]
    },
    confidentiality: confidentialityFrom(CONSORTIUM_FORM.fields, ["projectTitle", "requiredMembers", "scopeDivision"], ["minimumRequirements"]),
    riskProfile: highRisk(
      ["Member drop-out", "Role ambiguity", "Joint liability"],
      ["Signed MoU", "Clear lead member", "Minimum qualification gates"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: true,
      requiresKyc: true,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "profit_sharing", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "tender_share",
      commercialTemplate: "consortium_mou",
      recommendedCommercialTerms: ["Lead member authority", "Liability split", "Profit share rules"]
    },
    education: {
      whatIsIt: "A multi-party collaboration for tenders or delivery.",
      whyUseIt: "Fill capability gaps while remaining separate legal entities.",
      advantages: ["Broader capability", "Shared bid cost", "Flexible membership"],
      risks: ["Coordination overhead", "Uneven performance"],
      typicalMistakes: ["No lead member", "Undefined exit rules"],
      realWorldExample: "Three firms form a consortium for a hospital tender.",
      faq: [faq("Is an SPV required?", "Not always; use SPV when a new legal vehicle is needed.")],
      relatedModels: ["project_jv", "spv", "strategic_alliance"]
    },
    ai: {
      intentKeywords: ["consortium", "multi party", "tender team", "joint bid"],
      recommendedQuestions: ["How many members?", "What roles are open?", "What are minimum requirements?"],
      decisionHints: ["Use consortium when multiple firms collaborate without creating equity SPV first"],
      confidenceFactors: ["Roles defined", "Member count set", "Requirements listed"],
      missingInformationPrompts: ["Define member roles", "Set required members", "List minimum requirements"],
      decisionTree: branch("multi_party", "Need multiple organizations?", [
        {
          answer: "Yes",
          next: branch("new_entity", "Need a new equity entity?", [
            { answer: "No", next: leaf("cons", "Use Consortium", "consortium") },
            { answer: "Yes", next: leaf("spv", "Use SPV", "spv") }
          ])
        },
        { answer: "No", next: leaf("task", "Use Task-Based", "task_based") }
      ])
    },
    analytics: {
      primaryKPIs: ["consortium_fill_rate", "bid_success_rate"],
      secondaryKPIs: ["avg_members", "time_to_complete_roster"],
      successMetrics: ["tender_award_rate", "member_retention"],
      timeMetrics: ["days_to_roster", "days_to_award"],
      financialMetrics: ["combined_bid_value", "shared_cost"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  project_jv: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Project-Specific Joint Venture",
      shortDescription: "Equity JV formed for a single project.",
      longDescription: "Project JV establishes partner roles, equity split, capital contribution, and profit distribution for one project lifecycle.",
      businessPurpose: "Share risk, capital, and upside for a defined project.",
      businessOutcome: "Governed JV ready to execute the named project."
    },
    usage: {
      whenToUse: ["Equity partnership for one project", "Shared capital and profit required"],
      whenNotToUse: ["Non-equity alliance sufficient", "Open marketplace task hire"],
      bestFor: ["Companies", "Large project sponsors"],
      typicalIndustries: ["Real estate", "Infrastructure", "Industrial"],
      exampleScenarios: ["Developer and contractor form project JV for a tower"]
    },
    dynamicForm: PROJECT_JV_FORM,
    readiness: readinessFrom(
      ["partnerRoles", "equitySplit", "capitalContribution", "profitDistribution"],
      ["governance", "projectTitle"],
      [
        { fieldId: "partnerRoles", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "equitySplit", weight: 20, requiredWeight: 18, recommendedWeight: 2 },
        { fieldId: "capitalContribution", weight: 20, requiredWeight: 18, recommendedWeight: 2 },
        { fieldId: "profitDistribution", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "governance", weight: 10, requiredWeight: 4, recommendedWeight: 6 },
        { fieldId: "projectTitle", weight: 10, requiredWeight: 5, recommendedWeight: 5 }
      ]
    ),
    matching: metrics(
      m("financial_capacity", "Financial Capacity", "Ability to fund capital calls", 30),
      m("capital", "Capital", "Alignment of contribution plans", 25),
      m("governance", "Governance", "Decision-rights compatibility", 25),
      m("equity", "Equity Fit", "Equity split realism", 20)
    ),
    workflow: marketWorkflow({ supportsMarketplace: false, supportsApplications: false, supportsAward: false }),
    dependencies: jvDeps(),
    lifecycle: {
      typicalStages: ["draft", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "negotiating"
    },
    documents: {
      required: ["jv_term_sheet", "equity_schedule", "capital_plan"],
      optional: ["governance_charter", "financial_model", "board_resolution"]
    },
    confidentiality: confidentialityFrom(
      PROJECT_JV_FORM.fields,
      ["projectTitle"],
      ["equitySplit", "capitalContribution", "profitDistribution"]
    ),
    riskProfile: highRisk(
      ["Capital call default", "Governance deadlock", "Profit disputes"],
      ["Escrow capital", "Deadlock resolution clause", "Independent audit"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: true,
      requiresKyc: true,
      requiresBoardApproval: true
    }),
    commercial: {
      recommendedExchangeModes: ["equity", "profit_sharing", "hybrid"],
      defaultExchangeMode: "equity",
      pricingStrategy: "equity_and_profit_share",
      commercialTemplate: "project_jv_agreement",
      recommendedCommercialTerms: ["Capital calls", "Transfer restrictions", "Deadlock mechanism"]
    },
    education: {
      whatIsIt: "An equity joint venture for a single named project.",
      whyUseIt: "Share capital, risk, and upside with governance clarity.",
      advantages: ["Aligned incentives", "Shared balance sheet strength"],
      risks: ["Complex legal setup", "Partner conflict"],
      typicalMistakes: ["Vague equity split", "No capital call rules"],
      realWorldExample: "Two developers form a project JV for a mixed-use plot.",
      faq: [faq("Company only?", "Yes \u2014 eligibility requires a company entity.")],
      relatedModels: ["spv", "strategic_jv", "consortium"]
    },
    ai: {
      intentKeywords: ["project jv", "equity", "capital contribution", "profit share"],
      recommendedQuestions: ["What equity split?", "Who contributes capital?", "How is profit shared?"],
      decisionHints: ["Need partner + capital for one project \u2192 project_jv"],
      confidenceFactors: ["Equity defined", "Capital defined", "Roles defined"],
      missingInformationPrompts: ["Confirm equity split", "Confirm capital contribution", "Define partner roles"],
      decisionTree: branch("need_partner", "Need a partner?", [
        {
          answer: "Yes",
          next: branch("need_capital", "Need shared capital?", [
            { answer: "Yes", next: leaf("pjv", "Use Project JV", "project_jv") },
            { answer: "No", next: leaf("alliance", "Use Strategic Alliance", "strategic_alliance") }
          ])
        },
        { answer: "No", next: leaf("task", "Use Task-Based", "task_based") }
      ])
    },
    analytics: {
      primaryKPIs: ["jv_formation_rate", "capital_call_compliance"],
      secondaryKPIs: ["governance_amendments", "dispute_rate"],
      successMetrics: ["project_roi", "on_schedule_execution"],
      timeMetrics: ["days_to_agreement", "project_duration"],
      financialMetrics: ["total_capital", "equity_distribution"],
      dashboardWidgets: [
        ...CORE_DASHBOARD_WIDGETS,
        { id: "capital_raised", label: "Capital Raised", metricKey: "capital_raised" }
      ]
    }
  },
  spv: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Special Purpose Vehicle (SPV)",
      shortDescription: "Corporate vehicle for large structured projects.",
      longDescription: "SPV defines legal form, equity structure, project value, and governance for ring-fenced large projects.",
      businessPurpose: "Isolate project risk and financing within a dedicated legal entity.",
      businessOutcome: "Incorporated SPV with governance and capitalization plan."
    },
    usage: {
      whenToUse: ["Large project value", "Ring-fenced financing required", "Multiple equity investors"],
      whenNotToUse: ["Small subcontract", "Informal alliance"],
      bestFor: ["Sponsors", "Infrastructure funds", "Corporate JVs"],
      typicalIndustries: ["Infrastructure", "Energy", "PPP"],
      exampleScenarios: ["Toll road SPV with lenders and equity partners"]
    },
    dynamicForm: SPV_FORM,
    readiness: readinessFrom(
      ["equityStructure", "spvLegalForm", "governanceStructure"],
      ["projectValue", "projectTitle"],
      [
        { fieldId: "equityStructure", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "spvLegalForm", weight: 15, requiredWeight: 12, recommendedWeight: 3 },
        { fieldId: "governanceStructure", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "projectValue", weight: 25, requiredWeight: 15, recommendedWeight: 10 },
        { fieldId: "projectTitle", weight: 10, requiredWeight: 5, recommendedWeight: 5 }
      ]
    ),
    matching: metrics(
      m("financial_capacity", "Financial Capacity", "Investor and sponsor strength", 30),
      m("capital", "Capital", "Equity and debt capacity", 25),
      m("governance", "Governance", "Board and control structure fit", 25),
      m("equity", "Equity", "Ownership structure alignment", 20)
    ),
    workflow: marketWorkflow({
      supportsMarketplace: false,
      supportsApplications: false,
      supportsAward: false
    }),
    dependencies: jvDeps({ requiresNegotiation: true }),
    lifecycle: {
      typicalStages: ["draft", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "negotiating"
    },
    documents: {
      required: ["spv_constitution", "equity_structure", "governance_charter"],
      optional: ["debt_term_sheet", "regulatory_approvals", "financial_model"]
    },
    confidentiality: confidentialityFrom(
      SPV_FORM.fields,
      ["projectTitle", "spvLegalForm"],
      ["equityStructure", "projectValue", "governanceStructure"]
    ),
    riskProfile: criticalRisk(
      ["Regulatory delay", "Under-capitalization", "Complex liability"],
      ["Regulatory checklist", "Capital adequacy gates", "Independent directors"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: true,
      requiresKyc: true,
      requiresBoardApproval: true
    }),
    commercial: {
      recommendedExchangeModes: ["equity", "profit_sharing", "hybrid"],
      defaultExchangeMode: "equity",
      pricingStrategy: "project_finance",
      commercialTemplate: "spv_shareholders_agreement",
      recommendedCommercialTerms: ["Share classes", "Reserved matters", "Dividend policy"]
    },
    education: {
      whatIsIt: "A dedicated legal vehicle for a structured project.",
      whyUseIt: "Ring-fence risk and raise project finance cleanly.",
      advantages: ["Bankability", "Risk isolation", "Clear ownership"],
      risks: ["High setup cost", "Regulatory complexity"],
      typicalMistakes: ["No governance charter", "Unclear share classes"],
      realWorldExample: "Utility sponsors form an SPV for a solar plant.",
      faq: [faq("Minimum project value?", "Seed validation often expects large ticket sizes.")],
      relatedModels: ["project_jv", "strategic_jv", "consortium"]
    },
    ai: {
      intentKeywords: ["spv", "special purpose", "project finance", "shareholders"],
      recommendedQuestions: ["Legal form?", "Equity structure?", "Project value?"],
      decisionHints: ["Large structured project needing new legal vehicle \u2192 spv"],
      confidenceFactors: ["Legal form set", "Equity structure set", "Governance written"],
      missingInformationPrompts: ["Choose SPV legal form", "Define equity structure", "Describe governance"],
      decisionTree: branch("need_partner", "Need Partner?", [
        {
          answer: "Yes",
          next: branch("need_capital", "Need Capital?", [
            {
              answer: "Yes",
              next: branch("new_vehicle", "Need new legal vehicle?", [
                { answer: "Yes", next: leaf("spv", "Use SPV", "spv") },
                { answer: "No", next: leaf("pjv", "Use Project JV", "project_jv") }
              ])
            },
            { answer: "No", next: leaf("cons", "Use Consortium", "consortium") }
          ])
        },
        { answer: "No", next: leaf("task", "Use Task-Based", "task_based") }
      ])
    },
    analytics: {
      primaryKPIs: ["spv_formation_rate", "capitalization_ratio"],
      secondaryKPIs: ["regulatory_cycle_time", "board_approvals"],
      successMetrics: ["financial_close", "cod_on_time"],
      timeMetrics: ["days_to_incorporation", "days_to_financial_close"],
      financialMetrics: ["project_value", "equity_debt_ratio"],
      dashboardWidgets: [
        ...CORE_DASHBOARD_WIDGETS,
        { id: "equity_structure_mix", label: "Equity Structure Mix", metricKey: "equity_structure_mix" }
      ]
    }
  },
  strategic_jv: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Strategic Joint Venture",
      shortDescription: "Long-horizon equity JV tied to strategic objectives.",
      longDescription: "Strategic JV captures multi-year partnership with equity, contributions, and governance beyond a single project.",
      businessPurpose: "Build lasting shared capability and market position.",
      businessOutcome: "Standing JV entity/relationship with strategic roadmap."
    },
    usage: {
      whenToUse: ["Multi-year shared strategy", "Equity partnership beyond one project"],
      whenNotToUse: ["One-off package", "Service barter without equity"],
      bestFor: ["Corporates entering new markets", "Technology + distribution partners"],
      typicalIndustries: ["Manufacturing", "Technology", "Healthcare"],
      exampleScenarios: ["Local and international firms form strategic JV for KSA market entry"]
    },
    dynamicForm: STRATEGIC_JV_FORM,
    readiness: readinessFrom(
      ["partnerContributions", "equitySplit", "governance"],
      ["jvName", "strategicObjective"],
      [
        { fieldId: "partnerContributions", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "equitySplit", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "governance", weight: 25, requiredWeight: 18, recommendedWeight: 7 },
        { fieldId: "jvName", weight: 10, requiredWeight: 5, recommendedWeight: 5 },
        { fieldId: "strategicObjective", weight: 15, requiredWeight: 8, recommendedWeight: 7 }
      ]
    ),
    matching: metrics(
      m("strategic_fit", "Strategic Fit", "Objective alignment", 30),
      m("equity", "Equity", "Ownership expectations", 25),
      m("governance", "Governance", "Control and veto compatibility", 25),
      m("contribution", "Contribution", "Non-cash and cash contribution balance", 20)
    ),
    workflow: marketWorkflow({ supportsMarketplace: false, supportsApplications: false }),
    dependencies: jvDeps(),
    lifecycle: {
      typicalStages: ["draft", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "negotiating"
    },
    documents: {
      required: ["strategic_objectives", "equity_schedule", "governance_charter"],
      optional: ["business_plan", "ip_schedule", "board_resolution"]
    },
    confidentiality: confidentialityFrom(
      STRATEGIC_JV_FORM.fields,
      ["jvName", "strategicObjective"],
      ["equitySplit", "partnerContributions", "governance"]
    ),
    riskProfile: highRisk(
      ["Strategy drift", "IP leakage", "Exit disputes"],
      ["Annual strategy review", "IP schedules", "Put/call options"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: true,
      requiresKyc: true,
      requiresBoardApproval: true
    }),
    commercial: {
      recommendedExchangeModes: ["equity", "profit_sharing", "hybrid"],
      defaultExchangeMode: "equity",
      pricingStrategy: "long_term_equity",
      commercialTemplate: "strategic_jv_agreement",
      recommendedCommercialTerms: ["Reserved matters", "Non-compete", "Exit valuation"]
    },
    education: {
      whatIsIt: "A long-term equity joint venture around strategic goals.",
      whyUseIt: "Commit partners to a shared multi-year agenda.",
      advantages: ["Deep alignment", "Shared IP and markets"],
      risks: ["Harder exit", "Cultural clash"],
      typicalMistakes: ["No strategic objective clarity", "Weak governance"],
      realWorldExample: "Two industrials form a strategic JV for localization.",
      faq: [faq("Difference from project JV?", "Strategic JV spans multiple initiatives over years.")],
      relatedModels: ["project_jv", "strategic_alliance", "spv"]
    },
    ai: {
      intentKeywords: ["strategic jv", "long term equity", "market entry"],
      recommendedQuestions: ["Strategic objective?", "Equity split?", "Partner contributions?"],
      decisionHints: ["Multi-year equity strategy \u2192 strategic_jv"],
      confidenceFactors: ["Objective written", "Equity set", "Governance set"],
      missingInformationPrompts: ["Write strategic objective", "Define contributions", "Define governance"],
      decisionTree: branch("horizon", "Multi-year equity partnership?", [
        { answer: "Yes", next: leaf("sjv", "Use Strategic JV", "strategic_jv") },
        {
          answer: "No",
          next: branch("one_project", "Single project equity?", [
            { answer: "Yes", next: leaf("pjv", "Use Project JV", "project_jv") },
            { answer: "No", next: leaf("alliance", "Use Strategic Alliance", "strategic_alliance") }
          ])
        }
      ])
    },
    analytics: {
      primaryKPIs: ["strategic_milestone_hit_rate", "jv_longevity"],
      secondaryKPIs: ["amendment_rate", "cross_sell_revenue"],
      successMetrics: ["shared_revenue_growth", "localization_targets"],
      timeMetrics: ["years_active", "days_to_agreement"],
      financialMetrics: ["shared_ebitda", "equity_value"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  strategic_alliance: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Long-Term Strategic Alliance",
      shortDescription: "Non-equity strategic collaboration and service exchange.",
      longDescription: "Strategic Alliance defines multi-year collaboration scope, type, and commercial/financial terms without forming an equity JV.",
      businessPurpose: "Coordinate go-to-market or capability exchange with lighter structure than JV.",
      businessOutcome: "Standing alliance agreement with renewal and governance expectations."
    },
    usage: {
      whenToUse: ["Prefer non-equity partnership", "Long collaboration without SPV"],
      whenNotToUse: ["Capital must be pooled in equity vehicle"],
      bestFor: ["Preferred suppliers", "Technology licensing", "Knowledge sharing"],
      typicalIndustries: ["Professional services", "Technology", "Healthcare"],
      exampleScenarios: ["Vendor and operator form preferred-supplier alliance"]
    },
    dynamicForm: ALLIANCE_FORM,
    readiness: readinessFrom(
      ["scopeOfCollaboration", "duration", "financialTerms"],
      ["allianceTitle", "allianceType"],
      [
        { fieldId: "scopeOfCollaboration", weight: 30, requiredWeight: 25, recommendedWeight: 5 },
        { fieldId: "duration", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "financialTerms", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "allianceTitle", weight: 10, requiredWeight: 5, recommendedWeight: 5 },
        { fieldId: "allianceType", weight: 15, requiredWeight: 8, recommendedWeight: 7 }
      ]
    ),
    matching: metrics(
      m("strategic_fit", "Strategic Fit", "Alliance objective alignment", 30),
      m("capability_exchange", "Capability Exchange", "Complementarity of offerings", 25),
      m("commercial_terms", "Commercial Terms", "Financial term realism", 25),
      m("duration_fit", "Duration Fit", "Horizon compatibility", 20)
    ),
    workflow: marketWorkflow({
      supportsApplications: true,
      supportsMarketplace: true,
      supportsAward: false,
      supportsContract: true
    }),
    dependencies: {
      requiresMarketplace: false,
      requiresMatching: true,
      requiresNegotiation: true,
      requiresCommercialAgreement: true,
      requiresContract: true,
      requiresAward: false
    },
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["alliance_framework", "scope_matrix"],
      optional: ["sla", "nda", "brand_guidelines"]
    },
    confidentiality: confidentialityFrom(
      ALLIANCE_FORM.fields,
      ["allianceTitle", "allianceType", "duration"],
      ["financialTerms"]
    ),
    riskProfile: mediumRisk(
      ["Scope drift", "Exclusivity disputes"],
      ["Quarterly steering committee", "Clear exclusivity clauses"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: false,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["barter", "hybrid", "cash"],
      defaultExchangeMode: "barter",
      pricingStrategy: "framework_rates",
      commercialTemplate: "strategic_alliance_framework",
      recommendedCommercialTerms: ["Preferred pricing", "Exclusivity window", "KPI credits"]
    },
    education: {
      whatIsIt: "A long-term non-equity partnership agreement.",
      whyUseIt: "Collaborate strategically without incorporating a JV.",
      advantages: ["Flexibility", "Lower legal burden than SPV"],
      risks: ["Weaker lock-in", "Ambiguous deliverables"],
      typicalMistakes: ["No financial terms", "Alliance type unclear"],
      realWorldExample: "A software vendor and EPC firm form a delivery alliance.",
      faq: [faq("Can it include cash?", "Yes \u2014 cash, barter, or hybrid modes are allowed.")],
      relatedModels: ["strategic_jv", "mentorship", "task_based"]
    },
    ai: {
      intentKeywords: ["alliance", "preferred supplier", "non equity partnership"],
      recommendedQuestions: ["Alliance type?", "Collaboration scope?", "Duration years?"],
      decisionHints: ["Long collaboration without equity \u2192 strategic_alliance"],
      confidenceFactors: ["Scope set", "Duration \u2265 3 years intent", "Financial terms set"],
      missingInformationPrompts: ["Define collaboration scope", "Set duration", "Describe financial terms"],
      decisionTree: branch("equity", "Need equity?", [
        { answer: "No", next: leaf("alliance", "Use Strategic Alliance", "strategic_alliance") },
        { answer: "Yes", next: leaf("sjv", "Use Strategic JV", "strategic_jv") }
      ])
    },
    analytics: {
      primaryKPIs: ["alliance_renewal_rate", "joint_pipeline_value"],
      secondaryKPIs: ["sla_breach_rate", "referral_volume"],
      successMetrics: ["mutual_revenue", "nps_partners"],
      timeMetrics: ["years_active", "days_to_agreement"],
      financialMetrics: ["framework_spend", "barter_equivalence"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  mentorship: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Mentorship Program",
      shortDescription: "Knowledge and career development exchange.",
      longDescription: "Mentorship pairs mentors and mentees around skill targets and engagement duration, often using barter or light commercial terms.",
      businessPurpose: "Transfer expertise and accelerate professional growth.",
      businessOutcome: "Documented skill progress and mentoring engagement completion."
    },
    usage: {
      whenToUse: ["Skill transfer is primary", "Formal mentoring program"],
      whenNotToUse: ["Need capital partnership", "Need equipment sharing"],
      bestFor: ["Individuals", "Learning programs", "Leadership tracks"],
      typicalIndustries: ["Professional services", "Education", "Technology"],
      exampleScenarios: ["Senior PM mentors early-career PMs for 6 months"]
    },
    dynamicForm: MENTORSHIP_FORM,
    readiness: readinessFrom(
      ["targetSkills", "duration", "mentorshipType"],
      ["mentorshipTitle"],
      [
        { fieldId: "targetSkills", weight: 40, requiredWeight: 30, recommendedWeight: 10 },
        { fieldId: "duration", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "mentorshipType", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "mentorshipTitle", weight: 10, requiredWeight: 4, recommendedWeight: 6 }
      ]
    ),
    matching: metrics(
      m("expertise", "Expertise", "Mentor expertise vs target skills", 35),
      m("experience", "Experience", "Relevant tenure", 25),
      m("availability", "Availability", "Session capacity", 25),
      m("style_fit", "Style Fit", "Mentoring format preferences", 15)
    ),
    workflow: marketWorkflow({
      supportsCommercialAgreement: false,
      supportsContract: false,
      supportsAward: false,
      supportsNegotiation: false
    }),
    dependencies: {
      requiresMarketplace: true,
      requiresMatching: true,
      requiresNegotiation: false,
      requiresCommercialAgreement: false,
      requiresContract: false,
      requiresAward: false
    },
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["learning_objectives"],
      optional: ["mentor_bio", "progress_plan"]
    },
    confidentiality: confidentialityFrom(MENTORSHIP_FORM.fields, ["mentorshipTitle", "mentorshipType", "targetSkills", "duration"], []),
    riskProfile: lowRisk(
      ["Expectation mismatch", "Irregular sessions"],
      ["Written learning plan", "Cadence agreement"]
    ),
    compliance: compliance({
      requiresLegalReview: false,
      requiresFinancialReview: false,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["barter", "cash", "hybrid"],
      defaultExchangeMode: "barter",
      pricingStrategy: "session_or_barter",
      commercialTemplate: "mentorship_engagement",
      recommendedCommercialTerms: ["Session cadence", "Confidentiality", "Cancellation notice"]
    },
    education: {
      whatIsIt: "A structured mentoring engagement for skill growth.",
      whyUseIt: "Transfer tacit knowledge faster than courses alone.",
      advantages: ["Low friction", "Strong talent development"],
      risks: ["Vague objectives", "No time commitment"],
      typicalMistakes: ["No target skills", "No duration"],
      realWorldExample: "A design firm runs a 6-month mentorship track.",
      faq: [faq("Paid mentoring allowed?", "Yes via cash or hybrid exchange modes.")],
      relatedModels: ["strategic_alliance", "consultant_hiring", "professional_hiring"]
    },
    ai: {
      intentKeywords: ["mentor", "coaching", "skill transfer", "career"],
      recommendedQuestions: ["Target skills?", "Mentorship type?", "Duration months?"],
      decisionHints: ["Primary goal is learning \u2192 mentorship"],
      confidenceFactors: ["Skills listed", "Type selected", "Duration set"],
      missingInformationPrompts: ["List target skills", "Choose mentorship type", "Set duration"],
      decisionTree: branch("learning", "Primary goal is learning/coaching?", [
        { answer: "Yes", next: leaf("mentor", "Use Mentorship", "mentorship") },
        { answer: "No", next: leaf("task", "Use Task-Based", "task_based") }
      ])
    },
    analytics: {
      primaryKPIs: ["mentorship_completion_rate", "skill_progress_score"],
      secondaryKPIs: ["session_attendance", "renewal_rate"],
      successMetrics: ["goal_attainment", "satisfaction"],
      timeMetrics: ["avg_engagement_months", "time_to_match"],
      financialMetrics: ["avg_fee", "barter_hours"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  bulk_purchasing: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Bulk Purchasing",
      shortDescription: "Pooled procurement across participants.",
      longDescription: "Bulk Purchasing aggregates demand so multiple parties can negotiate volume pricing and shared delivery timelines.",
      businessPurpose: "Reduce unit cost via demand aggregation.",
      businessOutcome: "Committed participant pool and purchase plan."
    },
    usage: {
      whenToUse: ["Many buyers need same product/service", "Volume discounts matter"],
      whenNotToUse: ["Unique custom work", "Equity partnership"],
      bestFor: ["Associations", "Multi-project owners", "Cooperatives"],
      typicalIndustries: ["Construction materials", "Facilities", "IT hardware"],
      exampleScenarios: ["Pool steel orders across three sites"]
    },
    dynamicForm: BULK_FORM,
    readiness: readinessFrom(
      ["productService", "quantityNeeded", "participantsNeeded"],
      ["deliveryTimeline"],
      [
        { fieldId: "productService", weight: 30, requiredWeight: 25, recommendedWeight: 5 },
        { fieldId: "quantityNeeded", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "participantsNeeded", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "deliveryTimeline", weight: 20, requiredWeight: 10, recommendedWeight: 10 }
      ]
    ),
    matching: metrics(
      m("demand_overlap", "Demand Overlap", "Product and quantity fit", 30),
      m("volume", "Volume", "Scale toward vendor thresholds", 25),
      m("delivery", "Delivery", "Timeline compatibility", 25),
      m("location", "Location", "Delivery geography", 20)
    ),
    workflow: marketWorkflow({ supportsAward: true }),
    dependencies: marketDeps({ requiresContract: true }),
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["bill_of_quantities"],
      optional: ["vendor_quotes", "delivery_plan"]
    },
    confidentiality: confidentialityFrom(BULK_FORM.fields, ["productService", "quantityNeeded", "participantsNeeded"], []),
    riskProfile: mediumRisk(
      ["Commitment shortfall", "Delivery variance"],
      ["Binding commitment window", "Shared logistics plan"]
    ),
    compliance: compliance({
      requiresLegalReview: false,
      requiresFinancialReview: true,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "volume_discount",
      commercialTemplate: "bulk_purchase_agreement",
      recommendedCommercialTerms: ["Commitment quantity", "Price validity", "Delivery SLA"]
    },
    education: {
      whatIsIt: "A pooled purchase initiative across participants.",
      whyUseIt: "Unlock supplier volume pricing.",
      advantages: ["Lower unit cost", "Shared admin"],
      risks: ["Free riders", "Specification mismatches"],
      typicalMistakes: ["No participant target", "No quantity"],
      realWorldExample: "Five schools pool laptop procurement.",
      faq: [faq("Can participants join late?", "Optional \u2014 define cut-off in commercial terms.")],
      relatedModels: ["resource_sharing", "equipment_sharing"]
    },
    ai: {
      intentKeywords: ["bulk", "pool purchase", "volume discount", "procurement"],
      recommendedQuestions: ["Product/service?", "Quantity?", "Participants needed?"],
      decisionHints: ["Aggregate demand \u2192 bulk_purchasing"],
      confidenceFactors: ["Product set", "Quantity set", "Participant target set"],
      missingInformationPrompts: ["Name the product/service", "Set quantity", "Set participants needed"],
      decisionTree: branch("pool", "Pooling purchases?", [
        { answer: "Yes", next: leaf("bulk", "Use Bulk Purchasing", "bulk_purchasing") },
        { answer: "No", next: leaf("resource", "Use Resource Sharing", "resource_sharing") }
      ])
    },
    analytics: {
      primaryKPIs: ["participant_fill_rate", "unit_cost_saving"],
      secondaryKPIs: ["vendor_response_rate", "commitment_rate"],
      successMetrics: ["purchase_completion", "on_time_delivery"],
      timeMetrics: ["days_to_fill_pool", "delivery_lead_time"],
      financialMetrics: ["total_po_value", "savings_vs_list"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  equipment_sharing: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Equipment Sharing",
      shortDescription: "Shared ownership or usage of equipment assets.",
      longDescription: "Equipment Sharing coordinates asset type, location, availability, and usage schedule across parties.",
      businessPurpose: "Improve utilization and reduce capital duplication.",
      businessOutcome: "Bookable shared-asset arrangement with clear usage terms."
    },
    usage: {
      whenToUse: ["Idle equipment capacity", "Short rental needs between peers"],
      whenNotToUse: ["Need permanent hiring of professionals", "Equity project vehicle"],
      bestFor: ["Contractors", "Site-based operators"],
      typicalIndustries: ["Construction", "Oil & gas", "Facilities"],
      exampleScenarios: ["Share a crane across two nearby sites"]
    },
    dynamicForm: EQUIPMENT_FORM,
    readiness: readinessFrom(
      ["assetType", "assetLocation", "availability", "usageSchedule"],
      ["assetDescription"],
      [
        { fieldId: "assetType", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "assetLocation", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "availability", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "usageSchedule", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "assetDescription", weight: 15, requiredWeight: 5, recommendedWeight: 10 }
      ]
    ),
    matching: metrics(
      m("asset_type", "Asset Type", "Equipment category match", 30),
      m("availability", "Availability", "Calendar overlap", 25),
      m("distance", "Distance", "Proximity of sites", 25),
      m("capacity", "Capacity", "Load / capability suitability", 20)
    ),
    workflow: marketWorkflow(),
    dependencies: marketDeps({ requiresCommercialAgreement: true, requiresAward: false }),
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["asset_spec"],
      optional: ["insurance", "maintenance_log", "operator_certification"]
    },
    confidentiality: confidentialityFrom(
      EQUIPMENT_FORM.fields,
      ["assetType", "assetLocation", "availability", "assetDescription"],
      ["usageSchedule"]
    ),
    riskProfile: mediumRisk(
      ["Damage liability", "Downtime", "Transport risk"],
      ["Insurance proof", "Inspection checklist", "Clear custody transfer"]
    ),
    compliance: compliance({
      requiresLegalReview: false,
      requiresFinancialReview: false,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "barter", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "usage_based_rental",
      commercialTemplate: "equipment_share_agreement",
      recommendedCommercialTerms: ["Hourly/daily rates", "Damage deposit", "Operator inclusion"]
    },
    education: {
      whatIsIt: "A model for sharing equipment capacity among peers.",
      whyUseIt: "Raise utilization and cut CapEx.",
      advantages: ["Lower idle cost", "Circular collaboration"],
      risks: ["Maintenance disputes", "Scheduling conflicts"],
      typicalMistakes: ["No location", "No availability window"],
      realWorldExample: "Two MEP contractors rotate a scissor-lift fleet.",
      faq: [faq("Circular topology?", "Yes \u2014 resource_sharing mains often allow circular matching.")],
      relatedModels: ["resource_sharing", "bulk_purchasing"]
    },
    ai: {
      intentKeywords: ["equipment", "crane", "share asset", "rental peer"],
      recommendedQuestions: ["Asset type?", "Where is it located?", "Availability window?"],
      decisionHints: ["Sharing physical equipment \u2192 equipment_sharing"],
      confidenceFactors: ["Type set", "Location set", "Availability set", "Usage terms set"],
      missingInformationPrompts: ["Select asset type", "Set location", "Set availability", "Choose usage schedule"],
      decisionTree: branch("asset", "Sharing physical equipment?", [
        { answer: "Yes", next: leaf("equip", "Use Equipment Sharing", "equipment_sharing") },
        { answer: "No", next: leaf("resource", "Use Resource Sharing", "resource_sharing") }
      ])
    },
    analytics: {
      primaryKPIs: ["utilization_rate", "booking_fill_rate"],
      secondaryKPIs: ["damage_incidents", "distance_km"],
      successMetrics: ["on_time_handover", "repeat_shares"],
      timeMetrics: ["idle_days_saved", "avg_share_duration"],
      financialMetrics: ["rental_revenue", "capex_avoided"],
      dashboardWidgets: [
        ...CORE_DASHBOARD_WIDGETS,
        { id: "utilization", label: "Asset Utilization", metricKey: "utilization_rate" }
      ]
    }
  },
  resource_sharing: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Resource Sharing & Exchange",
      shortDescription: "Peer resource exchange across projects.",
      longDescription: "Resource Sharing covers materials, equipment, labor, services, or knowledge exchanged via sell/buy/rent/barter/donate modes.",
      businessPurpose: "Redistribute surplus resources across the network.",
      businessOutcome: "Matched resource exchange with clear transaction type."
    },
    usage: {
      whenToUse: ["Surplus materials or capacity", "Flexible exchange including barter"],
      whenNotToUse: ["Formal equity JV required"],
      bestFor: ["Project teams", "Circular economy initiatives"],
      typicalIndustries: ["Construction", "Logistics", "Events"],
      exampleScenarios: ["Exchange surplus formwork between sites"]
    },
    dynamicForm: RESOURCE_FORM,
    readiness: readinessFrom(
      ["resourceType", "location", "availability"],
      ["resourceTitle", "transactionType"],
      [
        { fieldId: "resourceType", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "location", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "availability", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "resourceTitle", weight: 10, requiredWeight: 4, recommendedWeight: 6 },
        { fieldId: "transactionType", weight: 15, requiredWeight: 8, recommendedWeight: 7 }
      ]
    ),
    matching: metrics(
      m("resource_type", "Resource Type", "Category match", 30),
      m("availability", "Availability", "Timing fit", 25),
      m("distance", "Distance", "Location proximity", 25),
      m("transaction_fit", "Transaction Fit", "Sell/buy/rent/barter compatibility", 20)
    ),
    workflow: marketWorkflow(),
    dependencies: marketDeps({ requiresAward: false }),
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["resource_description"],
      optional: ["condition_report", "photos", "handover_checklist"]
    },
    confidentiality: confidentialityFrom(
      RESOURCE_FORM.fields,
      ["resourceTitle", "resourceType", "location", "availability", "transactionType"],
      []
    ),
    riskProfile: mediumRisk(
      ["Condition disputes", "Logistics failure"],
      ["Condition photos", "Incoterms-like handover rules"]
    ),
    compliance: compliance({
      requiresLegalReview: false,
      requiresFinancialReview: false,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "barter", "hybrid"],
      defaultExchangeMode: "barter",
      pricingStrategy: "spot_or_barter",
      commercialTemplate: "resource_exchange",
      recommendedCommercialTerms: ["Condition at handover", "Transport party", "Equivalence estimate for barter"]
    },
    education: {
      whatIsIt: "Peer exchange of surplus resources.",
      whyUseIt: "Reduce waste and procurement cost.",
      advantages: ["Circular matching", "Flexible transaction types"],
      risks: ["Quality variance", "Asymmetric barter value"],
      typicalMistakes: ["No location", "No availability"],
      realWorldExample: "Sites swap excess cable trays via barter.",
      faq: [faq("Different from equipment sharing?", "Equipment is asset-centric; resource sharing is broader.")],
      relatedModels: ["equipment_sharing", "bulk_purchasing", "task_based"]
    },
    ai: {
      intentKeywords: ["resource exchange", "surplus", "barter materials", "share labor"],
      recommendedQuestions: ["Resource type?", "Location?", "Availability?", "Transaction type?"],
      decisionHints: ["Surplus exchange across peers \u2192 resource_sharing"],
      confidenceFactors: ["Type", "Location", "Availability"],
      missingInformationPrompts: ["Set resource type", "Set location", "Set availability"],
      decisionTree: branch("surplus", "Exchanging surplus resources?", [
        { answer: "Yes", next: leaf("res", "Use Resource Sharing", "resource_sharing") },
        { answer: "No", next: leaf("task", "Use Task-Based", "task_based") }
      ])
    },
    analytics: {
      primaryKPIs: ["exchange_completion_rate", "circular_match_rate"],
      secondaryKPIs: ["barter_share", "avg_distance"],
      successMetrics: ["repeat_exchanges", "dispute_rate_inverse"],
      timeMetrics: ["time_to_match", "time_to_handover"],
      financialMetrics: ["cash_value_moved", "barter_equivalence_sar"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  professional_hiring: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Professional Hiring",
      shortDescription: "Hire professionals for defined roles.",
      longDescription: "Professional Hiring defines role, experience, compensation band, skills, and start date for employment-like engagements.",
      businessPurpose: "Fill a role with a professional under clear commercial terms.",
      businessOutcome: "Hired professional ready to start on the agreed date."
    },
    usage: {
      whenToUse: ["Need a named role filled", "Ongoing or multi-month engagement"],
      whenNotToUse: ["One deliverable package only \u2014 prefer task_based or consultant"],
      bestFor: ["Employers", "Project PMO staffing"],
      typicalIndustries: ["All sectors", "Especially construction & ICT"],
      exampleScenarios: ["Hire a planning engineer for 12 months"]
    },
    dynamicForm: PROF_FORM,
    readiness: readinessFrom(
      ["jobTitle", "requiredExperience", "salaryRange", "startDate"],
      ["requiredSkills", "contractDuration"],
      [
        { fieldId: "jobTitle", weight: 15, requiredWeight: 12, recommendedWeight: 3 },
        { fieldId: "requiredExperience", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "salaryRange", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "startDate", weight: 15, requiredWeight: 12, recommendedWeight: 3 },
        { fieldId: "requiredSkills", weight: 15, requiredWeight: 8, recommendedWeight: 7 },
        { fieldId: "contractDuration", weight: 10, requiredWeight: 4, recommendedWeight: 6 }
      ]
    ),
    matching: metrics(
      m("experience", "Experience", "Years and role fit", 30),
      m("skills", "Skills", "Skill overlap", 30),
      m("compensation", "Compensation", "Salary/rate band fit", 20),
      m("availability", "Availability", "Start-date readiness", 20)
    ),
    workflow: marketWorkflow(),
    dependencies: marketDeps({ requiresCommercialAgreement: true }),
    lifecycle: {
      typicalStages: [...OPP_STAGES],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["job_description"],
      optional: ["offer_letter_template", "visa_requirements"]
    },
    confidentiality: confidentialityFrom(
      PROF_FORM.fields,
      ["jobTitle", "requiredExperience", "requiredSkills", "startDate"],
      ["salaryRange"]
    ),
    riskProfile: mediumRisk(
      ["Mis-hire", "Compensation disputes", "Notice period issues"],
      ["Structured interview scorecard", "Clear band disclosure to shortlist"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: false,
      requiresKyc: true,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "salary_or_rate_band",
      commercialTemplate: "professional_engagement",
      recommendedCommercialTerms: ["Probation", "Notice period", "Benefits/VAT clarity"]
    },
    education: {
      whatIsIt: "A hiring model for professionals into defined roles.",
      whyUseIt: "Staff critical roles with marketplace reach.",
      advantages: ["Clear role definition", "Compensation transparency for matching"],
      risks: ["Salary band leakage", "Slow onboarding"],
      typicalMistakes: ["No experience bar", "No start date"],
      realWorldExample: "Owner hires a resident engineer for a hospital project.",
      faq: [faq("Different from consultant?", "Hiring skews role/employment; consultant skews scoped advisory.")],
      relatedModels: ["consultant_hiring", "task_based"]
    },
    ai: {
      intentKeywords: ["hire", "job", "role", "salary", "employment"],
      recommendedQuestions: ["Job title?", "Experience years?", "Salary range?", "Start date?"],
      decisionHints: ["Fill a role \u2192 professional_hiring"],
      confidenceFactors: ["Title", "Experience", "Salary", "Start date"],
      missingInformationPrompts: ["Set job title", "Set experience", "Set salary range", "Set start date"],
      decisionTree: branch("role", "Filling an ongoing role?", [
        { answer: "Yes", next: leaf("prof", "Use Professional Hiring", "professional_hiring") },
        { answer: "No", next: leaf("consult", "Use Consultant Hiring", "consultant_hiring") }
      ])
    },
    analytics: {
      primaryKPIs: ["time_to_hire", "offer_accept_rate"],
      secondaryKPIs: ["applicant_quality", "dropoff_rate"],
      successMetrics: ["90_day_retention", "manager_satisfaction"],
      timeMetrics: ["days_to_shortlist", "days_to_start"],
      financialMetrics: ["avg_comp_band", "cost_per_hire"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  consultant_hiring: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Consultant Hiring",
      shortDescription: "Engage consultants for scoped advisory work.",
      longDescription: "Consultant Hiring defines specialty, scope, deliverables, budget, and duration for advisory engagements.",
      businessPurpose: "Obtain expert advice and deliverables without permanent hire.",
      businessOutcome: "Accepted consultant deliverables within budget and duration."
    },
    usage: {
      whenToUse: ["Need expertise package", "Defined deliverables and budget"],
      whenNotToUse: ["Full-time role fill", "Equity JV"],
      bestFor: ["Owners", "PMO", "Compliance programs"],
      typicalIndustries: ["Legal", "Financial", "Technical advisory"],
      exampleScenarios: ["Engage a sustainability consultant for LEED gap analysis"]
    },
    dynamicForm: CONSULT_FORM,
    readiness: readinessFrom(
      ["consultationType", "scopeOfWork", "deliverables", "budget"],
      ["consultationTitle", "duration"],
      [
        { fieldId: "consultationType", weight: 15, requiredWeight: 12, recommendedWeight: 3 },
        { fieldId: "scopeOfWork", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "deliverables", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "budget", weight: 20, requiredWeight: 15, recommendedWeight: 5 },
        { fieldId: "consultationTitle", weight: 5, requiredWeight: 2, recommendedWeight: 3 },
        { fieldId: "duration", weight: 10, requiredWeight: 5, recommendedWeight: 5 }
      ]
    ),
    matching: metrics(
      m("experience", "Experience", "Domain tenure", 25),
      m("expertise", "Expertise", "Specialty alignment", 30),
      m("certifications", "Certifications", "Credential match", 20),
      m("availability", "Availability", "Capacity and timing", 25)
    ),
    workflow: marketWorkflow(),
    dependencies: marketDeps(),
    lifecycle: {
      typicalStages: [...OPP_STAGES],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["scope_of_work", "deliverables_list"],
      optional: ["certificates", "sample_report", "nda"]
    },
    confidentiality: confidentialityFrom(
      CONSULT_FORM.fields,
      ["consultationTitle", "consultationType", "deliverables", "duration"],
      ["budget", "scopeOfWork"]
    ),
    riskProfile: mediumRisk(
      ["Vague deliverables", "Budget overrun"],
      ["Acceptance criteria", "Capped change control"]
    ),
    compliance: compliance({
      requiresLegalReview: false,
      requiresFinancialReview: true,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "barter", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "fixed_fee_or_t_and_m",
      commercialTemplate: "consultancy_agreement",
      recommendedCommercialTerms: ["Deliverable acceptance", "IP ownership", "VAT exclusive + 15%"]
    },
    education: {
      whatIsIt: "A scoped consultancy engagement model.",
      whyUseIt: "Buy expertise for defined outcomes.",
      advantages: ["Outcome clarity", "Flexible commercial modes"],
      risks: ["Scope creep", "Credential inflation"],
      typicalMistakes: ["No deliverables list", "No budget"],
      realWorldExample: "A hospital engages a safety consultant for 8 weeks.",
      faq: [faq("Barter allowed?", "Yes \u2014 cash, barter, and hybrid are allowed.")],
      relatedModels: ["task_based", "professional_hiring", "mentorship"]
    },
    ai: {
      intentKeywords: ["consultant", "advisory", "expertise", "deliverables"],
      recommendedQuestions: ["Specialty?", "Scope?", "Deliverables?", "Budget?"],
      decisionHints: ["Scoped advisory with deliverables \u2192 consultant_hiring"],
      confidenceFactors: ["Type", "Scope", "Deliverables", "Budget"],
      missingInformationPrompts: ["Choose specialty", "Write scope", "List deliverables", "Set budget"],
      decisionTree: branch("advisory", "Need advisory expertise with deliverables?", [
        { answer: "Yes", next: leaf("consult", "Use Consultant Hiring", "consultant_hiring") },
        { answer: "No", next: leaf("prof", "Use Professional Hiring", "professional_hiring") }
      ])
    },
    analytics: {
      primaryKPIs: ["engagement_success_rate", "budget_variance"],
      secondaryKPIs: ["revision_cycles", "certification_match_rate"],
      successMetrics: ["acceptance_first_pass", "client_nps"],
      timeMetrics: ["days_to_award", "engagement_duration"],
      financialMetrics: ["avg_fee", "vat_inclusive_spend"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  },
  competition_rfp: {
    metadata: DEFAULT_KNOWLEDGE_METADATA,
    business: {
      title: "Competition / RFP",
      shortDescription: "Structured competition or request-for-proposal.",
      longDescription: "Competition/RFP publishes submission deadlines, evaluation criteria, award value, and rules for competitive selection.",
      businessPurpose: "Select the best proposal through transparent competition.",
      businessOutcome: "Awarded proposal under published evaluation rules."
    },
    usage: {
      whenToUse: ["Multiple vendors should compete", "Transparent evaluation needed"],
      whenNotToUse: ["Direct hire preferred", "Equity JV negotiation"],
      bestFor: ["Procurement teams", "Innovation challenges"],
      typicalIndustries: ["Public sector", "Corporate procurement", "Design contests"],
      exampleScenarios: ["RFP for facade design concepts"]
    },
    dynamicForm: RFP_FORM,
    readiness: readinessFrom(
      ["submissionDeadline", "evaluationCriteria", "prizeContractValue"],
      ["competitionTitle", "competitionRules"],
      [
        { fieldId: "submissionDeadline", weight: 20, requiredWeight: 18, recommendedWeight: 2 },
        { fieldId: "evaluationCriteria", weight: 30, requiredWeight: 25, recommendedWeight: 5 },
        { fieldId: "prizeContractValue", weight: 25, requiredWeight: 20, recommendedWeight: 5 },
        { fieldId: "competitionTitle", weight: 10, requiredWeight: 5, recommendedWeight: 5 },
        { fieldId: "competitionRules", weight: 15, requiredWeight: 8, recommendedWeight: 7 }
      ]
    ),
    matching: metrics(
      m("proposal_quality", "Proposal Quality", "Alignment to evaluation criteria", 35),
      m("price", "Price", "Commercial competitiveness", 25),
      m("capability", "Capability", "Ability to deliver award", 25),
      m("compliance", "Compliance", "Rule adherence", 15)
    ),
    workflow: marketWorkflow({ supportsApplications: true, supportsAward: true }),
    dependencies: marketDeps({ requiresNegotiation: false }),
    lifecycle: {
      typicalStages: ["draft", "published", "matched", "negotiating", "contracted", "executing", "completed"],
      terminalStages: ["completed", "cancelled"],
      recommendedNextStage: "published"
    },
    documents: {
      required: ["rfp_pack", "evaluation_matrix"],
      optional: ["qa_addendum", "site_visit_notes"]
    },
    confidentiality: confidentialityFrom(
      RFP_FORM.fields,
      ["competitionTitle", "submissionDeadline", "evaluationCriteria"],
      ["prizeContractValue", "competitionRules"]
    ),
    riskProfile: mediumRisk(
      ["Unclear criteria", "Bid challenges", "Unrealistic award value"],
      ["Weighted criteria published", "Independent evaluation panel"]
    ),
    compliance: compliance({
      requiresLegalReview: true,
      requiresFinancialReview: true,
      requiresKyc: false,
      requiresBoardApproval: false
    }),
    commercial: {
      recommendedExchangeModes: ["cash", "hybrid"],
      defaultExchangeMode: "cash",
      pricingStrategy: "competitive_award",
      commercialTemplate: "rfp_award_contract",
      recommendedCommercialTerms: ["Award conditions", "Bond if applicable", "IP of submissions"]
    },
    education: {
      whatIsIt: "A competitive RFP or prize-style selection process.",
      whyUseIt: "Maximize proposal quality and fairness.",
      advantages: ["Transparency", "Market competition"],
      risks: ["Administrative load", "Protest risk"],
      typicalMistakes: ["Missing deadline", "Vague evaluation criteria"],
      realWorldExample: "Municipality runs an RFP for urban design concepts.",
      faq: [faq("Can award be hybrid?", "Yes \u2014 cash and hybrid exchange modes are allowed.")],
      relatedModels: ["task_based", "consortium"]
    },
    ai: {
      intentKeywords: ["rfp", "competition", "tender", "proposal", "award"],
      recommendedQuestions: ["Submission deadline?", "Evaluation criteria?", "Award value?"],
      decisionHints: ["Competitive selection \u2192 competition_rfp"],
      confidenceFactors: ["Deadline", "Criteria", "Award value"],
      missingInformationPrompts: ["Set deadline", "Define evaluation criteria", "Set award value"],
      decisionTree: branch("compete", "Need vendors to compete via RFP?", [
        { answer: "Yes", next: leaf("rfp", "Use Competition / RFP", "competition_rfp") },
        { answer: "No", next: leaf("task", "Use Task-Based", "task_based") }
      ])
    },
    analytics: {
      primaryKPIs: ["proposal_count", "award_rate"],
      secondaryKPIs: ["avg_score", "qa_volume"],
      successMetrics: ["on_time_award", "protest_rate_inverse"],
      timeMetrics: ["days_open", "days_to_award"],
      financialMetrics: ["award_value", "bid_spread"],
      dashboardWidgets: CORE_DASHBOARD_WIDGETS
    }
  }
};

// src/registry/registry-data.ts
var SUB_MODEL_REGISTRY = {
  task_based: {
    key: "task_based",
    name: "Task-Based Engagement",
    description: "Short-term collaboration for specific tasks or deliverables.",
    modelType: "project_based",
    mainCollaborationModel: "cash_subcontracting",
    allowedMatchTopologies: ["one_way"],
    allowedExchangeModes: ["cash", "hybrid", "barter"],
    requiredFields: ["detailedScope", "requiredSkills", "duration", "startDate"],
    recommendedFields: ["taskTitle", "taskType", "paymentTerms", "experienceLevel"],
    attributes: TASK_BASED_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.task_based
  },
  consortium: {
    key: "consortium",
    name: "Consortium",
    description: "Multi-party project delivery with defined member roles.",
    modelType: "project_based",
    mainCollaborationModel: "joint_venture",
    allowedMatchTopologies: ["consortium"],
    allowedExchangeModes: ["cash", "profit_sharing", "hybrid"],
    requiredFields: ["memberRoles", "requiredMembers", "minimumRequirements"],
    recommendedFields: ["projectTitle", "scopeDivision", "tenderDeadline"],
    attributes: CONSORTIUM_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.consortium
  },
  project_jv: {
    key: "project_jv",
    name: "Project-Specific Joint Venture",
    description: "JV formed for a single project with equity and governance terms.",
    modelType: "project_based",
    mainCollaborationModel: "joint_venture",
    allowedMatchTopologies: ["consortium"],
    allowedExchangeModes: ["equity", "profit_sharing", "hybrid", "cash"],
    requiredFields: ["partnerRoles", "equitySplit", "capitalContribution", "profitDistribution"],
    recommendedFields: ["governance", "projectTitle", "riskAllocation"],
    attributes: PROJECT_JV_ATTRIBUTES,
    eligibility: {
      allowedEntityTypes: ["company"],
      reason: "Project-Specific Joint Venture requires a company entity"
    },
    knowledge: SUB_MODEL_KNOWLEDGE.project_jv
  },
  spv: {
    key: "spv",
    name: "Special Purpose Vehicle (SPV)",
    description: "Corporate vehicle for large structured projects.",
    modelType: "project_based",
    mainCollaborationModel: "joint_venture",
    allowedMatchTopologies: ["consortium"],
    allowedExchangeModes: ["equity", "profit_sharing", "hybrid"],
    requiredFields: ["equityStructure", "spvLegalForm", "governanceStructure"],
    recommendedFields: ["projectValue", "debtFinancing", "regulatoryApprovals"],
    attributes: SPV_ATTRIBUTES,
    eligibility: {
      allowedEntityTypes: ["company"],
      reason: "SPV is a corporate structure available to companies only"
    },
    knowledge: SUB_MODEL_KNOWLEDGE.spv
  },
  strategic_jv: {
    key: "strategic_jv",
    name: "Strategic Joint Venture",
    description: "Long-horizon JV with strategic objectives.",
    modelType: "strategic_partnership",
    mainCollaborationModel: "joint_venture",
    allowedMatchTopologies: ["consortium"],
    allowedExchangeModes: ["equity", "profit_sharing", "hybrid"],
    requiredFields: ["partnerContributions", "equitySplit", "governance"],
    recommendedFields: ["jvName", "strategicObjective", "businessScope"],
    attributes: STRATEGIC_JV_ATTRIBUTES,
    eligibility: {
      allowedEntityTypes: ["company"],
      reason: "Strategic Joint Venture requires a company entity"
    },
    knowledge: SUB_MODEL_KNOWLEDGE.strategic_jv
  },
  strategic_alliance: {
    key: "strategic_alliance",
    name: "Long-Term Strategic Alliance",
    description: "Non-equity strategic collaboration and service exchange.",
    modelType: "strategic_partnership",
    mainCollaborationModel: "service_exchange",
    allowedMatchTopologies: ["two_way", "one_way"],
    allowedExchangeModes: ["barter", "hybrid", "cash"],
    requiredFields: ["scopeOfCollaboration", "duration", "financialTerms"],
    recommendedFields: ["allianceTitle", "allianceType", "governance"],
    attributes: STRATEGIC_ALLIANCE_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.strategic_alliance
  },
  mentorship: {
    key: "mentorship",
    name: "Mentorship Program",
    description: "Knowledge and career development exchange.",
    modelType: "strategic_partnership",
    mainCollaborationModel: "service_exchange",
    allowedMatchTopologies: ["two_way", "one_way"],
    allowedExchangeModes: ["barter", "cash", "hybrid"],
    requiredFields: ["targetSkills", "duration", "mentorshipType"],
    recommendedFields: ["mentorshipTitle", "format", "compensation"],
    attributes: MENTORSHIP_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.mentorship
  },
  bulk_purchasing: {
    key: "bulk_purchasing",
    name: "Bulk Purchasing",
    description: "Pooled procurement across participants.",
    modelType: "resource_pooling",
    mainCollaborationModel: "resource_sharing",
    allowedMatchTopologies: ["one_way", "consortium"],
    allowedExchangeModes: ["cash", "hybrid"],
    requiredFields: ["productService", "quantityNeeded", "participantsNeeded"],
    recommendedFields: ["deliveryTimeline", "targetPrice"],
    attributes: BULK_PURCHASING_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.bulk_purchasing
  },
  equipment_sharing: {
    key: "equipment_sharing",
    name: "Equipment Sharing",
    description: "Shared ownership or usage of equipment assets.",
    modelType: "resource_pooling",
    mainCollaborationModel: "resource_sharing",
    allowedMatchTopologies: ["one_way", "circular"],
    allowedExchangeModes: ["cash", "barter", "hybrid"],
    requiredFields: ["assetType", "assetLocation", "availability", "usageSchedule"],
    recommendedFields: ["assetDescription", "ownershipStructure"],
    attributes: EQUIPMENT_SHARING_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.equipment_sharing
  },
  resource_sharing: {
    key: "resource_sharing",
    name: "Resource Sharing & Exchange",
    description: "Peer resource exchange across projects.",
    modelType: "resource_pooling",
    mainCollaborationModel: "resource_sharing",
    allowedMatchTopologies: ["one_way", "circular", "two_way"],
    allowedExchangeModes: ["cash", "barter", "hybrid"],
    requiredFields: ["resourceType", "location", "availability"],
    recommendedFields: ["resourceTitle", "transactionType"],
    attributes: RESOURCE_SHARING_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.resource_sharing
  },
  professional_hiring: {
    key: "professional_hiring",
    name: "Professional Hiring",
    description: "Hire professionals for defined roles.",
    modelType: "hiring",
    mainCollaborationModel: "hiring",
    allowedMatchTopologies: ["one_way"],
    allowedExchangeModes: ["cash", "hybrid"],
    requiredFields: ["jobTitle", "requiredExperience", "salaryRange", "startDate"],
    recommendedFields: ["requiredSkills", "contractDuration", "employmentType"],
    attributes: PROFESSIONAL_HIRING_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.professional_hiring
  },
  consultant_hiring: {
    key: "consultant_hiring",
    name: "Consultant Hiring",
    description: "Engage consultants for scoped advisory work.",
    modelType: "hiring",
    mainCollaborationModel: "hiring",
    allowedMatchTopologies: ["one_way"],
    allowedExchangeModes: ["cash", "barter", "hybrid"],
    requiredFields: ["consultationType", "scopeOfWork", "deliverables", "budget"],
    recommendedFields: ["consultationTitle", "duration", "paymentTerms"],
    attributes: CONSULTANT_HIRING_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.consultant_hiring
  },
  competition_rfp: {
    key: "competition_rfp",
    name: "Competition / RFP",
    description: "Structured competition or request-for-proposal.",
    modelType: "competition",
    mainCollaborationModel: "cash_subcontracting",
    allowedMatchTopologies: ["one_way"],
    allowedExchangeModes: ["cash", "hybrid"],
    requiredFields: ["submissionDeadline", "evaluationCriteria", "prizeContractValue"],
    recommendedFields: ["competitionTitle", "competitionRules", "eligibilityCriteria"],
    attributes: COMPETITION_RFP_ATTRIBUTES,
    knowledge: SUB_MODEL_KNOWLEDGE.competition_rfp
  }
};
var MAIN_MODEL_REGISTRY = {
  cash_subcontracting: {
    key: "cash_subcontracting",
    name: "Cash Subcontracting",
    description: "Paid delivery for a defined scope with clear payment milestones.",
    defaultModelType: "project_based",
    subModelKeys: ["task_based", "competition_rfp"],
    allowedMatchTopologies: ["one_way"],
    allowedExchangeModes: ["cash", "hybrid"]
  },
  service_exchange: {
    key: "service_exchange",
    name: "Service Exchange / Barter",
    description: "Trade services or resources of comparable value instead of cash.",
    defaultModelType: "strategic_partnership",
    subModelKeys: ["strategic_alliance", "mentorship", "task_based"],
    allowedMatchTopologies: ["two_way", "one_way"],
    allowedExchangeModes: ["barter", "hybrid"]
  },
  joint_venture: {
    key: "joint_venture",
    name: "Joint Venture",
    description: "Shared delivery, governance, and outcomes across partners.",
    defaultModelType: "project_based",
    subModelKeys: ["consortium", "project_jv", "spv", "strategic_jv"],
    allowedMatchTopologies: ["consortium"],
    allowedExchangeModes: ["equity", "profit_sharing", "hybrid", "cash"]
  },
  resource_sharing: {
    key: "resource_sharing",
    name: "Resource Sharing",
    description: "Pool equipment, teams, or procurement capacity across projects.",
    defaultModelType: "resource_pooling",
    subModelKeys: ["bulk_purchasing", "equipment_sharing", "resource_sharing"],
    allowedMatchTopologies: ["one_way", "circular", "consortium"],
    allowedExchangeModes: ["cash", "barter", "hybrid"]
  },
  hiring: {
    key: "hiring",
    name: "Hiring / Professional Engagement",
    description: "Engage professionals or consultants for roles and deliverables.",
    defaultModelType: "hiring",
    subModelKeys: ["professional_hiring", "consultant_hiring"],
    allowedMatchTopologies: ["one_way"],
    allowedExchangeModes: ["cash", "barter", "hybrid"]
  }
};
var MODEL_TYPE_REGISTRY = {
  project_based: {
    key: "project_based",
    name: "Project-Based Collaboration",
    subModelKeys: ["task_based", "consortium", "project_jv", "spv"]
  },
  strategic_partnership: {
    key: "strategic_partnership",
    name: "Strategic Partnerships",
    subModelKeys: ["strategic_jv", "strategic_alliance", "mentorship"]
  },
  resource_pooling: {
    key: "resource_pooling",
    name: "Resource Pooling & Sharing",
    subModelKeys: ["bulk_purchasing", "equipment_sharing", "resource_sharing"]
  },
  hiring: {
    key: "hiring",
    name: "Hiring a Resource",
    subModelKeys: ["professional_hiring", "consultant_hiring"]
  },
  competition: {
    key: "competition",
    name: "Call for Competition",
    subModelKeys: ["competition_rfp"]
  }
};

// src/registry/index.ts
function getMainCollaborationModel(key) {
  return MAIN_MODEL_REGISTRY[key];
}
function getCollaborationModel(key) {
  return getMainCollaborationModel(key);
}
function getModelType(key) {
  return MODEL_TYPE_REGISTRY[key];
}
function getSubModel(key) {
  return SUB_MODEL_REGISTRY[key];
}
function listMainCollaborationModels() {
  return Object.values(MAIN_MODEL_REGISTRY);
}
function listModelTypes() {
  return Object.values(MODEL_TYPE_REGISTRY);
}
function listSubModels() {
  return Object.values(SUB_MODEL_REGISTRY);
}
function listSubModelsForMain(mainKey) {
  const main = MAIN_MODEL_REGISTRY[mainKey];
  if (!main) return [];
  return main.subModelKeys.map((key) => SUB_MODEL_REGISTRY[key]).filter((entry) => Boolean(entry));
}
function listSubModelsForModelType(modelType) {
  const model = MODEL_TYPE_REGISTRY[modelType];
  if (!model) return [];
  return model.subModelKeys.map((key) => SUB_MODEL_REGISTRY[key]).filter((entry) => Boolean(entry));
}
function resolveMainCollaborationModelLabel(key) {
  return MAIN_MODEL_REGISTRY[key]?.name ?? key.replace(/_/g, " ");
}
function resolveSubModelLabel(key) {
  return SUB_MODEL_REGISTRY[key]?.name ?? key.replace(/_/g, " ");
}
function resolveModelTypeLabel(key) {
  return MODEL_TYPE_REGISTRY[key]?.name ?? key.replace(/_/g, " ");
}

// src/legacy/normalize.ts
var MATCH_TOPOLOGY_SUBMODEL_ALIASES = /* @__PURE__ */ new Set([
  "one_way",
  "two_way",
  "circular",
  "oneway",
  "twoway",
  "two-way",
  "one-way"
]);
var LEGACY_SUB_MODEL_ALIASES = {
  project: "task_based",
  shared_resources: "resource_sharing",
  resource_pooling: "resource_sharing",
  hiring_resource: "professional_hiring",
  retainer: "task_based"
};
function isMatchTopologyValue(value) {
  if (!value) return false;
  const normalized = value.toLowerCase().replace(/-/g, "_");
  return MATCH_TOPOLOGY_SUBMODEL_ALIASES.has(normalized);
}
function normalizeSubModelType(raw, hints) {
  if (!raw) return void 0;
  const normalized = raw.toLowerCase().replace(/-/g, "_").trim();
  if (isMatchTopologyValue(normalized)) {
    return void 0;
  }
  if (LEGACY_SUB_MODEL_ALIASES[normalized]) {
    return LEGACY_SUB_MODEL_ALIASES[normalized];
  }
  if (normalized === "joint_venture") {
    if (hints?.modelType === "strategic_partnership") return "strategic_jv";
    return "project_jv";
  }
  return normalized;
}
function inferMainCollaborationModel(input) {
  if (input.mainCollaborationModel) {
    return input.mainCollaborationModel;
  }
  const sub = input.subModelType ? normalizeSubModelType(input.subModelType, input) : void 0;
  if (sub) {
    return getSubModel(sub)?.mainCollaborationModel;
  }
  const modelType = input.modelType;
  if (modelType === "hiring") return "hiring";
  if (modelType === "resource_pooling") return "resource_sharing";
  if (modelType === "competition") return "cash_subcontracting";
  if (modelType === "strategic_partnership") return "service_exchange";
  if (modelType === "project_based") return "cash_subcontracting";
  return void 0;
}

// src/validation/index.ts
function normalizeExchangeMode(mode) {
  if (!mode) return void 0;
  return mode.toLowerCase().replace(/-/g, "_").trim();
}
function deriveMatchingTopology(input) {
  const main = inferMainCollaborationModel(input);
  const subKey = normalizeSubModelType(input.subModelType, input);
  const sub = subKey ? getSubModel(subKey) : void 0;
  const exchange = normalizeExchangeMode(input.exchangeMode);
  if (sub?.allowedMatchTopologies.length === 1) {
    const topology = sub.allowedMatchTopologies[0];
    return {
      topology,
      reason: `${sub.name} allows ${topology} matching only`
    };
  }
  if (main === "cash_subcontracting" || subKey === "task_based" || subKey === "competition_rfp") {
    return { topology: "one_way", reason: "Cash subcontracting uses one-way need/offer matching" };
  }
  if (main === "resource_sharing") {
    const transactionType = String(
      input.collaborationAttributes?.transactionType ?? ""
    ).toLowerCase();
    if (transactionType === "barter" || exchange === "barter") {
      return {
        topology: "circular",
        reason: "Multi-party resource barter may form circular exchange rings",
        alternatives: ["one_way"]
      };
    }
    return {
      topology: "one_way",
      reason: "Resource sharing defaults to one-way matching",
      alternatives: ["circular"]
    };
  }
  if (main === "service_exchange" || exchange === "barter") {
    return { topology: "two_way", reason: "Service exchange / barter uses reciprocal two-way matching" };
  }
  if (main === "joint_venture" || subKey === "consortium" || subKey === "project_jv" || subKey === "spv" || subKey === "strategic_jv") {
    return { topology: "consortium", reason: "Joint venture sub-models use consortium group formation" };
  }
  if (main === "hiring" || subKey === "professional_hiring" || subKey === "consultant_hiring") {
    return {
      topology: "one_way",
      reason: "Hiring uses one-way matching (Application path documented separately)"
    };
  }
  if (exchange === "barter") {
    return { topology: "two_way", reason: "Barter exchange mode implies two-way matching" };
  }
  return { topology: "one_way", reason: "Default matching topology" };
}
function validateCollaborationTaxonomy(input) {
  const errors = [];
  const warnings = [];
  const rawSub = input.subModelType;
  if (rawSub && isMatchTopologyValue(rawSub)) {
    errors.push(
      `subModelType must not store matching topology "${rawSub}" \u2014 use preferredMatchingTopology instead`
    );
  }
  const mainKey = inferMainCollaborationModel(input);
  const subKey = normalizeSubModelType(input.subModelType, input);
  const modelType = input.modelType;
  const exchange = normalizeExchangeMode(input.exchangeMode);
  const accepted = (input.acceptedExchangeModes ?? []).map((mode) => normalizeExchangeMode(mode)).filter((mode) => Boolean(mode));
  if (!mainKey) {
    errors.push("mainCollaborationModel could not be resolved");
  }
  if (!subKey) {
    errors.push("subModelType is required and must be a canonical collaboration sub-model");
  } else {
    const sub = getSubModel(subKey);
    if (!sub) {
      errors.push(`Unknown subModelType "${subKey}"`);
    } else {
      if (mainKey && sub.mainCollaborationModel !== mainKey) {
        errors.push(
          `subModelType "${subKey}" belongs to ${sub.mainCollaborationModel}, not ${mainKey}`
        );
      }
      if (modelType && sub.modelType !== modelType) {
        errors.push(
          `subModelType "${subKey}" requires modelType "${sub.modelType}", got "${modelType}"`
        );
      }
      if (exchange && !sub.allowedExchangeModes.includes(exchange)) {
        errors.push(
          `exchangeMode "${exchange}" is not allowed for sub-model "${subKey}"`
        );
      }
      for (const mode of accepted) {
        if (!sub.allowedExchangeModes.includes(mode)) {
          warnings.push(
            `acceptedExchangeModes includes "${mode}" which is not typical for "${subKey}"`
          );
        }
      }
    }
  }
  if (mainKey) {
    const allowedSubs = listSubModelsForMain(mainKey).map((s) => s.key);
    if (subKey && !allowedSubs.includes(subKey)) {
      errors.push(`subModelType "${subKey}" is not valid for main model "${mainKey}"`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function validateSubModelAttributes(subModelType, attributes) {
  const errors = [];
  const subKey = normalizeSubModelType(subModelType);
  const sub = subKey ? getSubModel(subKey) : void 0;
  if (!sub) {
    return { valid: false, errors: [`Unknown subModelType "${subModelType}"`], warnings: [] };
  }
  const data = attributes ?? {};
  for (const fieldKey of sub.requiredFields) {
    const value = data[fieldKey];
    if (value == null || value === "" || Array.isArray(value) && value.length === 0) {
      errors.push(`Missing required collaboration attribute: ${fieldKey}`);
    }
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}
function validateOpportunityCollaborationModel(input) {
  const taxonomy = validateCollaborationTaxonomy(input);
  if (!taxonomy.valid) return taxonomy;
  const subKey = normalizeSubModelType(input.subModelType, input);
  if (!subKey) return taxonomy;
  const attributes = validateSubModelAttributes(
    subKey,
    input.collaborationAttributes
  );
  return {
    valid: taxonomy.valid && attributes.valid,
    errors: [...taxonomy.errors, ...attributes.errors],
    warnings: [...taxonomy.warnings, ...attributes.warnings]
  };
}
function recommendMatchingTopology(input) {
  return deriveMatchingTopology(input).topology;
}

// src/exchange/value-exchange.ts
var VALUE_EXCHANGE_FIELD_GROUPS = {
  cash: {
    mode: "cash",
    requiredFields: ["budget", "paymentSchedule"],
    optionalFields: ["currency", "cashAmount", "cashPaymentTerms", "budgetRange"]
  },
  barter: {
    mode: "barter",
    requiredFields: ["offeredService", "requestedService", "equivalenceEstimate"],
    optionalFields: ["barterOffer", "barterPreferences"]
  },
  profit_sharing: {
    mode: "profit_sharing",
    requiredFields: ["profitSplit", "calculationBasis"],
    optionalFields: ["profitDistribution", "revenueModel"]
  },
  equity: {
    mode: "equity",
    requiredFields: ["equityPercentage", "ownershipTerms"],
    optionalFields: ["equitySplit", "equityStructure", "vestingTerms"]
  },
  hybrid: {
    mode: "hybrid",
    requiredFields: ["cashComponent", "nonCashComponent"],
    optionalFields: ["barterComponent", "equityComponent", "profitComponent"]
  }
};
function buildValueExchangePayload(mode, fields) {
  const group = VALUE_EXCHANGE_FIELD_GROUPS[mode];
  const payload = {
    exchangeMode: mode,
    ...fields
  };
  for (const key of group.requiredFields) {
    if (fields[key] != null) payload[key] = fields[key];
  }
  return payload;
}
function extractCommercialTermsFromExchange(exchangeData, exchangeMode) {
  if (!exchangeData) return {};
  const mode = (exchangeMode ?? exchangeData.exchangeMode ?? "cash").toString().toLowerCase().replace(/-/g, "_");
  const terms = { exchangeMode: mode };
  if (mode === "cash" || mode === "hybrid") {
    if (exchangeData.budgetRange) terms.budget = exchangeData.budgetRange;
    if (exchangeData.paymentSchedule ?? exchangeData.cashPaymentTerms) {
      terms.paymentSchedule = exchangeData.paymentSchedule ?? exchangeData.cashPaymentTerms;
    }
    if (exchangeData.cashAmount) terms.amount = exchangeData.cashAmount;
  }
  if (mode === "barter" || mode === "hybrid") {
    if (exchangeData.barterOffer) terms.offeredService = exchangeData.barterOffer;
    if (exchangeData.barterPreferences) terms.requestedService = exchangeData.barterPreferences;
    if (exchangeData.equivalenceEstimate) terms.equivalenceEstimate = exchangeData.equivalenceEstimate;
  }
  if (mode === "profit_sharing" || mode === "hybrid") {
    if (exchangeData.profitSplit ?? exchangeData.profitDistribution) {
      terms.profitSplit = exchangeData.profitSplit ?? exchangeData.profitDistribution;
    }
    if (exchangeData.calculationBasis) terms.calculationBasis = exchangeData.calculationBasis;
  }
  if (mode === "equity" || mode === "hybrid") {
    if (exchangeData.equityPercentage ?? exchangeData.equitySplit) {
      terms.equityPercentage = exchangeData.equityPercentage ?? exchangeData.equitySplit;
    }
    if (exchangeData.ownershipTerms ?? exchangeData.vestingTerms) {
      terms.ownershipTerms = exchangeData.ownershipTerms ?? exchangeData.vestingTerms;
    }
  }
  return terms;
}

// src/forms/sub-model-form.ts
function resolveSubModelFormFields(subModelType) {
  const sub = getSubModel(subModelType);
  if (!sub) return [];
  const required = new Set(sub.requiredFields);
  const keys = /* @__PURE__ */ new Set([...sub.requiredFields, ...sub.recommendedFields]);
  return sub.attributes.filter((field) => keys.has(field.key)).map((field) => ({
    ...field,
    emphasis: required.has(field.key) ? "required" : "recommended"
  }));
}
function listSubModelFormFieldKeys(subModelType) {
  return resolveSubModelFormFields(subModelType).map((field) => field.key);
}

// src/knowledge/types.ts
var FIELD_GROUP_IDS = [
  "general",
  "commercial",
  "timeline",
  "resources",
  "technical",
  "legal",
  "risk",
  "financial",
  "location",
  "requirements"
];
var KNOWLEDGE_STABILITY_VALUES = [
  "experimental",
  "beta",
  "stable",
  "deprecated"
];
var RISK_LEVEL_VALUES = [
  "low",
  "medium",
  "high",
  "critical"
];

// src/knowledge/field-groups.ts
var FIELD_GROUP_LABELS = {
  general: "General",
  commercial: "Commercial",
  timeline: "Timeline",
  resources: "Resources",
  technical: "Technical",
  legal: "Legal",
  risk: "Risk",
  financial: "Financial",
  location: "Location",
  requirements: "Requirements"
};

// src/knowledge/api.ts
function getDynamicFields(subModelKey) {
  const sub = getSubModel(subModelKey);
  if (!sub) return void 0;
  return [...sub.knowledge.dynamicForm.fields].sort((a, b) => a.displayOrder - b.displayOrder);
}
function getReadinessDefinition(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.readiness;
}
function getMatchingMetrics(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.matching.metrics;
}
function getEducationalContent(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.education;
}
function getWorkflowMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.workflow;
}
function getAnalyticsMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.analytics;
}
function getAiMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.ai;
}
function getCapabilityDependencies(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.dependencies;
}
function getLifecycleMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.lifecycle;
}
function getDocumentsMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.documents;
}
function getConfidentialityMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.confidentiality;
}
function getRiskProfile(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.riskProfile;
}
function getComplianceMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.compliance;
}
function getCommercialMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.commercial;
}
function getKnowledgeMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.metadata;
}
export {
  EXCHANGE_MODE_KEYS,
  FIELD_GROUP_IDS,
  FIELD_GROUP_LABELS,
  KNOWLEDGE_STABILITY_VALUES,
  LEGACY_SUB_MODEL_ALIASES,
  MAIN_COLLABORATION_MODEL_KEYS,
  MAIN_MODEL_REGISTRY,
  MATCH_TOPOLOGY_KEYS,
  MATCH_TOPOLOGY_SUBMODEL_ALIASES,
  MODEL_TYPE_KEYS,
  MODEL_TYPE_REGISTRY,
  RISK_LEVEL_VALUES,
  SUB_MODEL_KNOWLEDGE,
  SUB_MODEL_REGISTRY,
  SUB_MODEL_TYPE_KEYS,
  VALUE_EXCHANGE_FIELD_GROUPS,
  buildValueExchangePayload,
  deriveMatchingTopology,
  extractCommercialTermsFromExchange,
  getAiMetadata,
  getAnalyticsMetadata,
  getCapabilityDependencies,
  getCollaborationModel,
  getCommercialMetadata,
  getComplianceMetadata,
  getConfidentialityMetadata,
  getDocumentsMetadata,
  getDynamicFields,
  getEducationalContent,
  getKnowledgeMetadata,
  getLifecycleMetadata,
  getMainCollaborationModel,
  getMatchingMetrics,
  getModelType,
  getReadinessDefinition,
  getRiskProfile,
  getSubModel,
  getWorkflowMetadata,
  inferMainCollaborationModel,
  isMatchTopologyValue,
  listMainCollaborationModels,
  listModelTypes,
  listSubModelFormFieldKeys,
  listSubModels,
  listSubModelsForMain,
  listSubModelsForModelType,
  normalizeSubModelType,
  recommendMatchingTopology,
  resolveMainCollaborationModelLabel,
  resolveModelTypeLabel,
  resolveSubModelFormFields,
  resolveSubModelLabel,
  validateCollaborationTaxonomy,
  validateOpportunityCollaborationModel,
  validateSubModelAttributes
};
