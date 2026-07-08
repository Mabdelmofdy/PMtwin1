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

// src/registry/registry-data.ts
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
    attributes: TASK_BASED_ATTRIBUTES
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
    attributes: CONSORTIUM_ATTRIBUTES
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
    }
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
    }
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
    }
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
    attributes: STRATEGIC_ALLIANCE_ATTRIBUTES
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
    attributes: MENTORSHIP_ATTRIBUTES
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
    attributes: BULK_PURCHASING_ATTRIBUTES
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
    attributes: EQUIPMENT_SHARING_ATTRIBUTES
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
    attributes: RESOURCE_SHARING_ATTRIBUTES
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
    attributes: PROFESSIONAL_HIRING_ATTRIBUTES
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
    attributes: CONSULTANT_HIRING_ATTRIBUTES
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
    attributes: COMPETITION_RFP_ATTRIBUTES
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
export {
  EXCHANGE_MODE_KEYS,
  LEGACY_SUB_MODEL_ALIASES,
  MAIN_COLLABORATION_MODEL_KEYS,
  MAIN_MODEL_REGISTRY,
  MATCH_TOPOLOGY_KEYS,
  MATCH_TOPOLOGY_SUBMODEL_ALIASES,
  MODEL_TYPE_KEYS,
  MODEL_TYPE_REGISTRY,
  SUB_MODEL_REGISTRY,
  SUB_MODEL_TYPE_KEYS,
  VALUE_EXCHANGE_FIELD_GROUPS,
  buildValueExchangePayload,
  deriveMatchingTopology,
  extractCommercialTermsFromExchange,
  getMainCollaborationModel,
  getModelType,
  getSubModel,
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
