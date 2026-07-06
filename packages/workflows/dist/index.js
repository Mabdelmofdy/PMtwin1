// src/actions/action-registry.ts
var WORKFLOW_ACTION_REGISTRY = {
  publish_opportunity: {
    key: "publish_opportunity",
    label: "Publish opportunity",
    commandType: "PublishOpportunity",
    requiredRole: "opportunity_owner",
    requiredPermission: "opportunity:publish"
  },
  accept_match: {
    key: "accept_match",
    label: "Accept match",
    commandType: "AcceptPostMatch",
    requiredRole: "participant",
    requiredPermission: "match:accept"
  },
  decline_match: {
    key: "decline_match",
    label: "Decline match",
    commandType: "DeclinePostMatch",
    requiredRole: "participant",
    requiredPermission: "match:decline"
  },
  start_negotiation_from_post_match: {
    key: "start_negotiation_from_post_match",
    label: "Start negotiation",
    commandType: "StartNegotiationFromPostMatch",
    requiredRole: "participant",
    requiredPermission: "negotiation:start"
  },
  start_negotiation_from_application: {
    key: "start_negotiation_from_application",
    label: "Start hiring negotiation",
    commandType: "StartNegotiationFromApplication",
    requiredRole: "hiring_party",
    requiredPermission: "negotiation:start"
  },
  agree_negotiation: {
    key: "agree_negotiation",
    label: "Agree negotiation",
    commandType: "AgreeNegotiation",
    requiredRole: "participant",
    requiredPermission: "negotiation:agree"
  },
  cancel_negotiation: {
    key: "cancel_negotiation",
    label: "Cancel negotiation",
    commandType: "CancelNegotiation",
    requiredRole: "participant",
    requiredPermission: "negotiation:cancel"
  },
  create_deal_from_post_match: {
    key: "create_deal_from_post_match",
    label: "Create deal",
    commandType: "CreateDealFromPostMatch",
    requiredRole: "participant",
    requiredPermission: "deal:create"
  },
  create_deal_from_application: {
    key: "create_deal_from_application",
    label: "Create hiring deal",
    commandType: "CreateDealFromApplication",
    requiredRole: "hiring_party",
    requiredPermission: "deal:create"
  },
  create_deal_from_negotiation: {
    key: "create_deal_from_negotiation",
    label: "Create deal",
    commandType: "CreateDealFromNegotiation",
    requiredRole: "participant",
    requiredPermission: "deal:create"
  },
  create_contract_from_deal: {
    key: "create_contract_from_deal",
    label: "Create contract",
    commandType: "CreateContractFromDeal",
    requiredRole: "participant",
    requiredPermission: "contract:create"
  },
  sign_contract: {
    key: "sign_contract",
    label: "Sign contract",
    commandType: "SignContract",
    requiredRole: "participant",
    requiredPermission: "contract:sign"
  },
  activate_contract: {
    key: "activate_contract",
    label: "Activate contract",
    commandType: "ActivateContract",
    requiredRole: "participant",
    requiredPermission: "contract:activate"
  },
  complete_contract: {
    key: "complete_contract",
    label: "Complete contract",
    commandType: "CompleteContract",
    requiredRole: "participant",
    requiredPermission: "contract:complete"
  }
};
function getActionDefinition(key) {
  return WORKFLOW_ACTION_REGISTRY[key];
}

// src/registry/collaboration-workflows.ts
var COLLABORATION_WORKFLOW_DEFINITIONS = {
  cash_subcontracting: {
    key: "cash_subcontracting",
    label: "Cash subcontracting",
    startEntity: "opportunity",
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "deal", "contract", "completion"],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      "Requires cash or hybrid exchange mode",
      "Cash budget and payment schedule required before publish",
      "Defaults to one-way matching topology"
    ],
    terminalStates: ["completed", "cancelled"]
  },
  service_exchange: {
    key: "service_exchange",
    label: "Service exchange / barter",
    startEntity: "opportunity",
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "deal", "contract", "completion"],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      "Requires barter or hybrid exchange mode",
      "Barter offer and requested service required before publish",
      "Defaults to two-way matching topology"
    ],
    terminalStates: ["completed", "cancelled"]
  },
  joint_venture: {
    key: "joint_venture",
    label: "Joint venture",
    startEntity: "opportunity",
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "deal", "contract", "completion"],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      "Requires equity, profit sharing, or hybrid exchange for commercial terms",
      "Joint venture sub-model attributes required before publish",
      "Defaults to consortium matching topology"
    ],
    terminalStates: ["completed", "cancelled"]
  },
  resource_sharing: {
    key: "resource_sharing",
    label: "Resource sharing",
    startEntity: "opportunity",
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "deal", "contract", "completion"],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      "Resource availability and location required before publish",
      "Barter resource sharing may use circular matching"
    ],
    terminalStates: ["completed", "cancelled"]
  },
  hiring_engagement: {
    key: "hiring_engagement",
    label: "Hiring / professional engagement",
    startEntity: "application",
    steps: ["application", "accepted", "negotiation", "deal", "contract", "completion"],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      "Professional hiring requires salary range and start date",
      "Application path is primary for formal hiring and RFP"
    ],
    terminalStates: ["completed", "cancelled", "rejected"]
  }
};
function resolveCollaborationWorkflowKey(mainCollaborationModel) {
  switch (mainCollaborationModel) {
    case "cash_subcontracting":
      return "cash_subcontracting";
    case "service_exchange":
      return "service_exchange";
    case "joint_venture":
      return "joint_venture";
    case "resource_sharing":
      return "resource_sharing";
    case "hiring":
      return "hiring_engagement";
    default:
      return void 0;
  }
}

// src/registry/hiring-workflow.ts
var HIRING_COMMANDS = [
  "StartNegotiationFromApplication",
  "AgreeNegotiation",
  "CreateDealFromApplication",
  "CreateContractFromDeal",
  "SignContract",
  "ActivateContract",
  "CompleteContract"
];
var HIRING_WORKFLOW = {
  key: "hiring",
  label: "Hiring / RFP application",
  startEntity: "application",
  steps: [
    "application",
    "accepted",
    "negotiation",
    "deal",
    "contract",
    "completion"
  ],
  allowedTransitions: [
    { from: "accepted", to: "negotiation", action: "start_negotiation_from_application", commandType: "StartNegotiationFromApplication" },
    { from: "negotiation", to: "deal", action: "agree_negotiation", commandType: "AgreeNegotiation" },
    { from: "negotiation", to: "deal", action: "create_deal_from_application", commandType: "CreateDealFromApplication" },
    { from: "deal", to: "contract", action: "create_contract_from_deal", commandType: "CreateContractFromDeal" },
    { from: "contract", to: "completion", action: "sign_contract", commandType: "SignContract" },
    { from: "contract", to: "completion", action: "activate_contract", commandType: "ActivateContract" },
    { from: "contract", to: "completion", action: "complete_contract", commandType: "CompleteContract" }
  ],
  allowedCommands: [...HIRING_COMMANDS],
  businessRules: [
    "Application must be accepted before starting hiring negotiation",
    "Negotiation must be agreed before creating hiring deal",
    "Deal must exist before creating contract",
    "Hiring path does not require PostMatch"
  ],
  terminalStates: ["completed", "cancelled", "rejected", "withdrawn"]
};

// src/registry/marketplace-workflow.ts
var MARKETPLACE_COMMANDS = [
  "PublishOpportunity",
  "AcceptPostMatch",
  "DeclinePostMatch",
  "StartNegotiationFromPostMatch",
  "AgreeNegotiation",
  "CancelNegotiation",
  "CreateDealFromPostMatch",
  "CreateDealFromNegotiation",
  "CreateContractFromDeal",
  "SignContract",
  "ActivateContract",
  "CompleteContract"
];
var MARKETPLACE_WORKFLOW = {
  key: "marketplace",
  label: "Marketplace collaboration",
  startEntity: "opportunity",
  steps: [
    "opportunity",
    "publish",
    "matching",
    "post_match",
    "negotiation",
    "deal",
    "contract",
    "completion"
  ],
  allowedTransitions: [
    { from: "opportunity", to: "publish", action: "publish_opportunity", commandType: "PublishOpportunity" },
    { from: "post_match", to: "negotiation", action: "start_negotiation_from_post_match", commandType: "StartNegotiationFromPostMatch" },
    { from: "post_match", to: "post_match", action: "accept_match", commandType: "AcceptPostMatch" },
    { from: "post_match", to: "post_match", action: "decline_match", commandType: "DeclinePostMatch" },
    { from: "negotiation", to: "deal", action: "agree_negotiation", commandType: "AgreeNegotiation" },
    { from: "negotiation", to: "deal", action: "create_deal_from_post_match", commandType: "CreateDealFromPostMatch" },
    { from: "negotiation", to: "deal", action: "create_deal_from_negotiation", commandType: "CreateDealFromNegotiation" },
    { from: "deal", to: "contract", action: "create_contract_from_deal", commandType: "CreateContractFromDeal" },
    { from: "contract", to: "completion", action: "sign_contract", commandType: "SignContract" },
    { from: "contract", to: "completion", action: "activate_contract", commandType: "ActivateContract" },
    { from: "contract", to: "completion", action: "complete_contract", commandType: "CompleteContract" }
  ],
  allowedCommands: [...MARKETPLACE_COMMANDS],
  businessRules: [
    "PostMatch must be confirmed before starting negotiation",
    "Negotiation must be agreed before creating a deal",
    "Deal must exist before creating a contract",
    "Collaboration taxonomy must be valid before publish"
  ],
  terminalStates: ["completed", "cancelled", "closed", "terminated"]
};

// src/registry/index.ts
var WORKFLOW_REGISTRY = {
  marketplace: MARKETPLACE_WORKFLOW,
  hiring: HIRING_WORKFLOW,
  ...COLLABORATION_WORKFLOW_DEFINITIONS
};
function getWorkflowDefinition(key) {
  return WORKFLOW_REGISTRY[key];
}
function listWorkflowKeys() {
  return Object.keys(WORKFLOW_REGISTRY);
}

// ../lifecycle/dist/index.js
var manifest_default = {
  schemaVersion: 1,
  adr: "ADR-001",
  entities: {
    opportunity: {
      canonicalStates: [
        "draft",
        "published",
        "matched",
        "negotiating",
        "contracted",
        "executing",
        "completed",
        "cancelled"
      ],
      aliasesFile: "aliases/opportunity.json"
    },
    application: {
      canonicalStates: [
        "submitted",
        "reviewing",
        "shortlisted",
        "negotiating",
        "accepted",
        "rejected",
        "withdrawn"
      ],
      aliasesFile: "aliases/application.json"
    },
    match: {
      canonicalStates: [
        "discovered",
        "accepted",
        "confirmed",
        "declined",
        "expired",
        "superseded"
      ],
      aliasesFile: "aliases/match.json"
    },
    negotiation: {
      canonicalStates: [
        "active",
        "countered",
        "agreed",
        "expired",
        "cancelled"
      ],
      aliasesFile: "aliases/negotiation.json"
    },
    deal: {
      canonicalStates: [
        "draft",
        "review",
        "signing",
        "executing",
        "completed",
        "cancelled"
      ],
      aliasesFile: "aliases/deal.json"
    },
    contract: {
      canonicalStates: [
        "draft",
        "pending_signature",
        "active",
        "completed",
        "terminated"
      ],
      aliasesFile: "aliases/contract.json"
    }
  }
};
var opportunity_default = {
  in_negotiation: "negotiating",
  in_execution: "executing",
  closed: "completed"
};
var application_default = {
  pending: "submitted",
  in_negotiation: "negotiating"
};
var match_default = {
  pending: "discovered"
};
var negotiation_default = {
  open: "active",
  counter_offered: "countered",
  failed: "cancelled"
};
var deal_default = {
  negotiating: "draft",
  active: "executing",
  execution: "executing",
  delivery: "executing",
  closed: "completed"
};
var contract_default = {
  pending: "pending_signature"
};
var ALIAS_FILES = {
  opportunity: opportunity_default,
  application: application_default,
  match: match_default,
  negotiation: negotiation_default,
  deal: deal_default,
  contract: contract_default
};
function buildStatusMaps(entities, aliasFiles) {
  const canonicalStates = {};
  const legacyAliases = {};
  const resolveMap = {};
  for (const [entityType, entity] of Object.entries(entities)) {
    const states = Object.freeze([...entity.canonicalStates]);
    canonicalStates[entityType] = states;
    const aliases = aliasFiles[entityType] ?? {};
    legacyAliases[entityType] = Object.freeze({ ...aliases });
    const map = {};
    for (const state of states) {
      map[state] = state;
    }
    for (const [legacy, canonical] of Object.entries(aliases)) {
      map[legacy] = canonical;
    }
    resolveMap[entityType] = Object.freeze(map);
  }
  return {
    canonicalStates: Object.freeze(canonicalStates),
    legacyAliases: Object.freeze(legacyAliases),
    resolveMap: Object.freeze(resolveMap)
  };
}
var registry = buildStatusMaps(manifest_default.entities, ALIAS_FILES);
var ENTITY_TYPES = Object.freeze(
  /** @type {EntityType[]} */
  Object.keys(manifest_default.entities)
);
var MANIFEST = Object.freeze(manifest_default);
var CANONICAL_STATES = registry.canonicalStates;
var LEGACY_ALIASES = registry.legacyAliases;
function toCanonical(entityType, status) {
  if (status == null || status === "") {
    return "";
  }
  const key = String(status).toLowerCase();
  const map = registry.resolveMap[entityType];
  if (!map) {
    return key;
  }
  return map[key] ?? key;
}
var transitions_default = {
  application: {
    terminalStates: ["accepted", "rejected", "withdrawn"],
    transitions: {
      submitted: ["reviewing", "rejected", "withdrawn"],
      reviewing: ["shortlisted", "rejected", "withdrawn"],
      shortlisted: ["negotiating", "rejected", "withdrawn"],
      negotiating: ["accepted", "rejected", "withdrawn"],
      accepted: [],
      rejected: [],
      withdrawn: []
    }
  },
  opportunity: {
    terminalStates: ["completed", "cancelled"],
    transitions: {
      draft: ["published", "cancelled"],
      published: ["matched", "negotiating", "cancelled"],
      matched: ["negotiating", "contracted", "cancelled"],
      negotiating: ["contracted", "cancelled"],
      contracted: ["executing", "cancelled"],
      executing: ["completed", "cancelled"],
      completed: [],
      cancelled: []
    }
  },
  match: {
    terminalStates: ["confirmed", "declined", "expired", "superseded"],
    transitions: {
      discovered: ["accepted", "declined", "expired"],
      accepted: ["confirmed", "declined", "expired", "superseded"],
      confirmed: [],
      declined: [],
      expired: [],
      superseded: []
    }
  },
  negotiation: {
    terminalStates: ["agreed", "expired", "cancelled"],
    transitions: {
      active: ["countered", "agreed", "expired", "cancelled"],
      countered: ["active", "agreed", "expired", "cancelled"],
      agreed: [],
      expired: [],
      cancelled: []
    }
  },
  deal: {
    terminalStates: ["completed", "cancelled"],
    transitions: {
      draft: ["review", "cancelled"],
      review: ["signing", "cancelled"],
      signing: ["executing", "cancelled"],
      executing: ["completed", "cancelled"],
      completed: [],
      cancelled: []
    }
  },
  contract: {
    terminalStates: ["completed", "terminated"],
    transitions: {
      draft: ["pending_signature", "terminated"],
      pending_signature: ["active", "terminated"],
      active: ["completed", "terminated"],
      completed: [],
      terminated: []
    }
  }
};
function isTerminal(entityType, status) {
  const canonical = toCanonical(entityType, status);
  if (!canonical) {
    return false;
  }
  const fsm = transitions_default[entityType];
  if (!fsm) {
    return false;
  }
  return fsm.terminalStates.includes(canonical);
}
function allowedTransitions(entityType, fromStatus) {
  const from = toCanonical(entityType, fromStatus);
  if (!from) {
    return Object.freeze([]);
  }
  const fsm = transitions_default[entityType];
  if (!fsm) {
    return Object.freeze([]);
  }
  const allowed = fsm.transitions[from];
  if (!allowed) {
    return Object.freeze([]);
  }
  return Object.freeze([...allowed]);
}

// src/lifecycle-helpers.ts
function canonicalEntityStatus(entity, status) {
  return toCanonical(entity, status ?? "") ?? (status ?? "").toLowerCase();
}
function isEntityTerminal(entity, status) {
  if (!status) return false;
  return isTerminal(entity, status);
}
function canEntityTransition(entity, currentStatus, targetStatus) {
  if (!currentStatus) return false;
  const allowed = allowedTransitions(entity, currentStatus);
  const target = toCanonical(entity, targetStatus);
  if (!target) return false;
  return allowed.includes(target);
}
function isParticipantPending(participant) {
  const status = (participant?.participantStatus ?? "pending").toLowerCase();
  return status !== "accepted" && status !== "declined";
}
function findParticipant(participants, userId) {
  if (!userId || !participants) return void 0;
  return participants.find((participant) => participant.userId === userId);
}

// src/engine/resolve-workflow.ts
var BLOCKING_NEGOTIATION_STATUSES = /* @__PURE__ */ new Set(["active", "countered", "agreed"]);
function resolvePrimaryWorkflowKey(context) {
  if (context.primaryWorkflow) return context.primaryWorkflow;
  if (context.application?.id) {
    return "hiring";
  }
  return "marketplace";
}
function resolveWorkflowKeys(context) {
  const primary = context.primaryWorkflow ?? resolvePrimaryWorkflowKey(context);
  const collaboration = context.collaborationWorkflow ?? resolveCollaborationWorkflowKey(context.collaboration?.mainCollaborationModel);
  return { primary, collaboration };
}
function hasBlockingPostMatchNegotiation(context) {
  const linked = context.linkage?.negotiationsForPostMatch ?? [];
  return linked.some(
    (negotiation) => BLOCKING_NEGOTIATION_STATUSES.has(
      (negotiation.status ?? "").toLowerCase()
    )
  );
}
function hasBlockingApplicationNegotiation(context) {
  const linked = context.linkage?.negotiationsForApplication ?? [];
  return linked.some((negotiation) => {
    const status = (negotiation.status ?? "").toLowerCase();
    return BLOCKING_NEGOTIATION_STATUSES.has(status);
  });
}
function findAgreedApplicationNegotiation(context) {
  const linked = context.linkage?.negotiationsForApplication ?? [];
  return linked.find((negotiation) => (negotiation.status ?? "").toLowerCase() === "agreed");
}
function hasActiveContractForDeal(context) {
  const contracts = context.linkage?.contractsForDeal ?? [];
  return contracts.some((contract) => {
    const status = (contract.status ?? "").toLowerCase();
    return status !== "completed" && status !== "terminated" && status !== "cancelled";
  });
}

// ../collaboration-models/dist/index.js
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
function getSubModel(key) {
  return SUB_MODEL_REGISTRY[key];
}
function listSubModelsForMain(mainKey) {
  const main = MAIN_MODEL_REGISTRY[mainKey];
  if (!main) return [];
  return main.subModelKeys.map((key) => SUB_MODEL_REGISTRY[key]).filter((entry) => Boolean(entry));
}
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
function normalizeExchangeMode(mode) {
  if (!mode) return void 0;
  return mode.toLowerCase().replace(/-/g, "_").trim();
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

// src/engine/collaboration-guards.ts
function normalizeMode(mode) {
  if (!mode) return void 0;
  return mode.toLowerCase().replace(/-/g, "_");
}
function hasField(data, key) {
  if (!data) return false;
  const value = data[key];
  if (value == null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}
function resolveExchangePayload(collaboration) {
  return {
    ...collaboration?.exchangeData ?? {},
    ...collaboration?.collaborationAttributes ?? {}
  };
}
function validateCollaborationPublishRequirements(collaboration) {
  if (!collaboration?.subModelType || !collaboration.exchangeMode) {
    return {
      valid: false,
      errors: ["Collaboration sub-model and exchange mode are required to publish"]
    };
  }
  const taxonomy = validateCollaborationTaxonomy({
    mainCollaborationModel: collaboration.mainCollaborationModel,
    modelType: collaboration.modelType,
    subModelType: collaboration.subModelType,
    exchangeMode: collaboration.exchangeMode,
    acceptedExchangeModes: collaboration.acceptedExchangeModes,
    collaborationAttributes: collaboration.collaborationAttributes
  });
  if (!taxonomy.valid) {
    return { valid: false, errors: taxonomy.errors };
  }
  const full = validateOpportunityCollaborationModel({
    mainCollaborationModel: collaboration.mainCollaborationModel,
    modelType: collaboration.modelType,
    subModelType: collaboration.subModelType,
    exchangeMode: collaboration.exchangeMode,
    acceptedExchangeModes: collaboration.acceptedExchangeModes,
    collaborationAttributes: collaboration.collaborationAttributes
  });
  if (!full.valid) {
    return { valid: false, errors: full.errors };
  }
  const mode = normalizeMode(collaboration.exchangeMode);
  if (!mode) {
    return { valid: false, errors: ["Invalid exchange mode"] };
  }
  const exchangeErrors = validateExchangeModeRequirements(mode, collaboration);
  if (exchangeErrors.length > 0) {
    return { valid: false, errors: exchangeErrors };
  }
  const jvErrors = validateJointVentureCommercialRequirements(collaboration);
  if (jvErrors.length > 0) {
    return { valid: false, errors: jvErrors };
  }
  return { valid: true, errors: [] };
}
function validateExchangeModeRequirements(mode, collaboration) {
  const payload = resolveExchangePayload(collaboration);
  const group = VALUE_EXCHANGE_FIELD_GROUPS[mode];
  const errors = [];
  for (const field of group.requiredFields) {
    if (!hasField(payload, field)) {
      errors.push(`Missing required ${mode} exchange field: ${field}`);
    }
  }
  if (mode === "barter" || mode === "hybrid") {
    const hasBarter = hasField(payload, "barterOffer") || hasField(payload, "offeredService") || hasField(payload, "barterComponent");
    const hasRequest = hasField(payload, "barterPreferences") || hasField(payload, "requestedService");
    if (!hasBarter || !hasRequest) {
      errors.push("Barter exchange requires offered and requested service data");
    }
  }
  return errors;
}
function validateJointVentureCommercialRequirements(collaboration) {
  const main = collaboration?.mainCollaborationModel;
  if (main !== "joint_venture") return [];
  const mode = normalizeMode(collaboration?.exchangeMode);
  const payload = resolveExchangePayload(collaboration);
  const errors = [];
  if (mode === "equity" || mode === "hybrid") {
    if (!hasField(payload, "equitySplit") && !hasField(payload, "equityPercentage") && !hasField(payload, "equityStructure")) {
      errors.push("Joint venture with equity exchange requires equity commercial terms");
    }
  }
  if (mode === "profit_sharing" || mode === "hybrid") {
    if (!hasField(payload, "profitSplit") && !hasField(payload, "profitDistribution")) {
      errors.push("Joint venture with profit sharing requires profit split terms");
    }
  }
  return errors;
}

// src/engine/next-actions.ts
var MATCH_ENTITY = "match";
var APPLICATION_ENTITY = "application";
var NEGOTIATION_ENTITY = "negotiation";
var DEAL_ENTITY = "deal";
var CONTRACT_ENTITY = "contract";
var OPPORTUNITY_ENTITY = "opportunity";
var DEAL_STATUSES_ALLOWING_CONTRACT = /* @__PURE__ */ new Set(["draft", "review", "signing"]);
function userCanMutate(context) {
  if (context.user.canMutate === false) return false;
  if (context.user.canMutate === true) return true;
  return Boolean(context.user.userId);
}
function userHasPermission(context, permission) {
  if (!permission) return true;
  return context.user.permissions?.includes(permission) ?? true;
}
function buildAction(context, key, options) {
  const definition = getActionDefinition(key);
  const { primary } = resolveWorkflowKeys(context);
  return {
    key,
    label: definition.label,
    commandType: definition.commandType,
    visible: options.visible,
    enabled: options.enabled,
    visibilityReason: options.visibilityReason,
    disabledReason: options.disabledReason,
    requiredRole: definition.requiredRole,
    requiredPermission: definition.requiredPermission,
    workflowKey: options.workflowKey ?? primary,
    aggregateId: options.aggregateId,
    metadata: options.metadata
  };
}
function evaluatePublishOpportunity(context) {
  const opportunity = context.opportunity;
  const status = canonicalEntityStatus(OPPORTUNITY_ENTITY, opportunity?.status);
  const visible = Boolean(opportunity?.id && status === "draft");
  const publishValidation = validateCollaborationPublishRequirements(
    context.collaboration
  );
  const enabled = visible && userCanMutate(context) && context.user.isOpportunityOwner && publishValidation.valid;
  return buildAction(context, "publish_opportunity", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Opportunity is in draft and can be published" : "Publish is only available for draft opportunities",
    disabledReason: !userCanMutate(context) ? "You do not have permission to publish this opportunity" : !context.user.isOpportunityOwner ? "Only the opportunity owner can publish" : !publishValidation.valid ? publishValidation.errors.join(". ") : void 0,
    aggregateId: opportunity?.id
  });
}
function evaluateAcceptMatch(context) {
  const match = context.postMatch;
  const userId = context.user.userId;
  const status = canonicalEntityStatus(MATCH_ENTITY, match?.status);
  const participant = findParticipant(match?.participants, userId);
  const visible = Boolean(match?.id) && !isEntityTerminal(MATCH_ENTITY, match?.status) && Boolean(participant) && isParticipantPending(participant);
  const enabled = visible && userCanMutate(context) && !["confirmed", "declined", "expired", "superseded"].includes(status);
  return buildAction(context, "accept_match", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Participant can respond to this match" : "Accept is only available for pending participant responses",
    aggregateId: match?.id,
    metadata: userId ? { userId } : void 0
  });
}
function evaluateDeclineMatch(context) {
  const match = context.postMatch;
  const userId = context.user.userId;
  const participant = findParticipant(match?.participants, userId);
  const response = participant?.participantStatus?.toLowerCase();
  const visible = Boolean(match?.id) && !isEntityTerminal(MATCH_ENTITY, match?.status) && Boolean(participant) && response !== "declined";
  const status = canonicalEntityStatus(MATCH_ENTITY, match?.status);
  const enabled = visible && userCanMutate(context) && !["confirmed", "declined", "expired", "superseded"].includes(status);
  return buildAction(context, "decline_match", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Participant can decline this match" : "Decline is only available for active participant responses",
    aggregateId: match?.id,
    metadata: userId ? { userId } : void 0
  });
}
function evaluateStartNegotiationFromPostMatch(context) {
  const match = context.postMatch;
  const status = canonicalEntityStatus(MATCH_ENTITY, match?.status);
  const visible = Boolean(match?.id && status === "confirmed");
  const blocked = hasBlockingPostMatchNegotiation(context);
  const enabled = visible && userCanMutate(context) && !blocked;
  return buildAction(context, "start_negotiation_from_post_match", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Confirmed match can start marketplace negotiation" : "Start negotiation requires a confirmed PostMatch",
    disabledReason: blocked ? "An active or agreed negotiation already exists for this match" : !userCanMutate(context) ? "You do not have permission to start negotiation" : void 0,
    aggregateId: match?.id
  });
}
function evaluateStartNegotiationFromApplication(context) {
  const application = context.application;
  const status = canonicalEntityStatus(APPLICATION_ENTITY, application?.status);
  const legacyEnabled = context.linkage?.legacyApplicationsEnabled !== false;
  const visible = legacyEnabled && Boolean(application?.id && status === "accepted");
  const blocked = hasBlockingApplicationNegotiation(context);
  const hasDeal = Boolean(context.linkage?.dealForApplication?.id || application?.dealId);
  const enabled = visible && userCanMutate(context) && !blocked && !hasDeal;
  return buildAction(context, "start_negotiation_from_application", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Accepted application can start hiring negotiation" : "Start hiring negotiation requires an accepted application",
    disabledReason: hasDeal ? "A deal already exists for this application" : blocked ? "A hiring negotiation already exists for this application" : !userCanMutate(context) ? "You do not have permission to start hiring negotiation" : void 0,
    aggregateId: application?.id,
    workflowKey: "hiring"
  });
}
function evaluateAgreeNegotiation(context) {
  const negotiation = context.negotiation;
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status);
  const visible = Boolean(
    negotiation?.id && (status === "active" || status === "countered")
  );
  const enabled = visible && userCanMutate(context);
  return buildAction(context, "agree_negotiation", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Negotiation is open and can be agreed" : "Agree is only available for active negotiations",
    aggregateId: negotiation?.id
  });
}
function evaluateCancelNegotiation(context) {
  const agree = evaluateAgreeNegotiation(context);
  return buildAction(context, "cancel_negotiation", {
    visible: agree.visible,
    enabled: agree.enabled,
    visibilityReason: agree.visibilityReason,
    disabledReason: agree.disabledReason,
    aggregateId: agree.aggregateId
  });
}
function evaluateCreateDealFromNegotiation(context) {
  const negotiation = context.negotiation;
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status);
  const existingDeal = context.linkage?.dealForNegotiation;
  const visible = Boolean(negotiation?.id && status === "agreed");
  const enabled = visible && userCanMutate(context) && !existingDeal?.id;
  return buildAction(context, "create_deal_from_negotiation", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Agreed negotiation can create a deal" : "Create deal requires an agreed negotiation",
    disabledReason: existingDeal?.id ? "A deal already exists for this negotiation" : !userCanMutate(context) ? "You do not have permission to create a deal" : void 0,
    aggregateId: negotiation?.id,
    metadata: negotiation?.id ? { negotiationId: negotiation.id } : void 0
  });
}
function evaluateCreateDealFromPostMatch(context) {
  const base = evaluateCreateDealFromNegotiation(context);
  const match = context.postMatch;
  const visible = base.visible && Boolean(match?.id && negotiationLinkedToPostMatch(context));
  return buildAction(context, "create_deal_from_post_match", {
    visible,
    enabled: base.enabled && visible,
    visibilityReason: visible ? "Agreed PostMatch negotiation can create a deal" : "Create deal from PostMatch requires agreed negotiation linked to match",
    disabledReason: base.disabledReason,
    aggregateId: match?.id ?? base.aggregateId,
    metadata: {
      negotiationId: context.negotiation?.id,
      postMatchId: match?.id
    }
  });
}
function evaluateCreateDealFromApplication(context) {
  const application = context.application;
  const agreed = findAgreedApplicationNegotiation(context);
  const existingDeal = context.linkage?.dealForApplication;
  const legacyEnabled = context.linkage?.legacyApplicationsEnabled !== false;
  const visible = legacyEnabled && Boolean(application?.id && agreed?.id);
  const enabled = visible && userCanMutate(context) && !existingDeal?.id && !application?.dealId;
  return buildAction(context, "create_deal_from_application", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Agreed hiring negotiation can create a deal" : "Create hiring deal requires an agreed application-linked negotiation",
    disabledReason: existingDeal?.id || application?.dealId ? "A deal already exists for this application" : !userCanMutate(context) ? "You do not have permission to create a hiring deal" : void 0,
    aggregateId: application?.id,
    workflowKey: "hiring",
    metadata: agreed?.id ? { negotiationId: agreed.id } : void 0
  });
}
function evaluateCreateContractFromDeal(context) {
  const deal = context.deal;
  const status = canonicalEntityStatus(DEAL_ENTITY, deal?.status);
  const visible = Boolean(
    deal?.id && DEAL_STATUSES_ALLOWING_CONTRACT.has(status) && (deal.negotiationId || deal.postMatchId || deal.applicationId)
  );
  const hasContract = hasActiveContractForDeal(context);
  const enabled = visible && userCanMutate(context) && !hasContract;
  return buildAction(context, "create_contract_from_deal", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Deal is ready for contract creation" : "Create contract requires a draft, review, or signing deal",
    disabledReason: hasContract ? "An active contract already exists for this deal" : !userCanMutate(context) ? "You do not have permission to create a contract" : void 0,
    aggregateId: deal?.id,
    metadata: deal?.id ? { dealId: deal.id } : void 0
  });
}
function evaluateSignContract(context) {
  const contract = context.contract;
  const status = canonicalEntityStatus(CONTRACT_ENTITY, contract?.status);
  const visible = Boolean(
    contract?.id && ["draft", "pending_signature"].includes(status)
  );
  const enabled = visible && userCanMutate(context) && userHasPermission(context, "contract:sign");
  return buildAction(context, "sign_contract", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Contract is awaiting signatures" : "Sign contract is only available for draft or signing contracts",
    aggregateId: contract?.id,
    metadata: context.user.userId ? { userId: context.user.userId } : void 0
  });
}
function evaluateActivateContract(context) {
  const contract = context.contract;
  const status = canonicalEntityStatus(CONTRACT_ENTITY, contract?.status);
  const visible = Boolean(contract?.id && status === "signed");
  const enabled = visible && userCanMutate(context);
  return buildAction(context, "activate_contract", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Signed contract can be activated" : "Activate contract requires a signed contract",
    aggregateId: contract?.id
  });
}
function evaluateCompleteContract(context) {
  const contract = context.contract;
  const status = canonicalEntityStatus(CONTRACT_ENTITY, contract?.status);
  const visible = Boolean(contract?.id && status === "active");
  const enabled = visible && userCanMutate(context);
  return buildAction(context, "complete_contract", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Active contract can be completed" : "Complete contract requires an active contract",
    aggregateId: contract?.id
  });
}
function negotiationLinkedToPostMatch(context) {
  const negotiation = context.negotiation;
  const postMatchId = context.postMatch?.id;
  if (!negotiation || !postMatchId) return false;
  return negotiation.postMatchId === postMatchId || negotiation.matchId === postMatchId;
}
var ACTION_EVALUATORS = {
  publish_opportunity: evaluatePublishOpportunity,
  accept_match: evaluateAcceptMatch,
  decline_match: evaluateDeclineMatch,
  start_negotiation_from_post_match: evaluateStartNegotiationFromPostMatch,
  start_negotiation_from_application: evaluateStartNegotiationFromApplication,
  agree_negotiation: evaluateAgreeNegotiation,
  cancel_negotiation: evaluateCancelNegotiation,
  create_deal_from_post_match: evaluateCreateDealFromPostMatch,
  create_deal_from_application: evaluateCreateDealFromApplication,
  create_deal_from_negotiation: evaluateCreateDealFromNegotiation,
  create_contract_from_deal: evaluateCreateContractFromDeal,
  sign_contract: evaluateSignContract,
  activate_contract: evaluateActivateContract,
  complete_contract: evaluateCompleteContract
};
function isActionAllowedForWorkflow(context, key) {
  const { primary, collaboration } = resolveWorkflowKeys(context);
  const primaryDef = getWorkflowDefinition(primary);
  const collaborationDef = collaboration ? getWorkflowDefinition(collaboration) : void 0;
  const commandType = getActionDefinition(key).commandType;
  if (primaryDef.allowedCommands.includes(commandType)) return true;
  if (collaborationDef?.allowedCommands.includes(commandType)) return true;
  if (key === "publish_opportunity" && primary === "marketplace") return true;
  if (["accept_match", "decline_match", "start_negotiation_from_post_match"].includes(key) && context.postMatch?.id) {
    return true;
  }
  if (["start_negotiation_from_application", "create_deal_from_application"].includes(key) && context.application?.id) {
    return true;
  }
  return ACTION_EVALUATORS[key] !== void 0;
}
function getWorkflowNextActions(context) {
  return Object.keys(ACTION_EVALUATORS).filter((key) => isActionAllowedForWorkflow(context, key)).map((key) => ACTION_EVALUATORS[key](context)).filter((action) => action.visible);
}
function findWorkflowAction(context, key) {
  if (!isActionAllowedForWorkflow(context, key)) return void 0;
  const action = ACTION_EVALUATORS[key](context);
  return action.visible ? action : void 0;
}
function isWorkflowActionAvailable(context, key) {
  const action = findWorkflowAction(context, key);
  return Boolean(action?.enabled);
}

// src/engine/validate-transition.ts
var NEGOTIATION_ENTITY2 = "negotiation";
var APPLICATION_ENTITY2 = "application";
var MATCH_ENTITY2 = "match";
var DEAL_ENTITY2 = "deal";
function validateActionBusinessRules(context, actionKey) {
  const errors = [];
  switch (actionKey) {
    case "publish_opportunity": {
      const publish = validateCollaborationPublishRequirements(context.collaboration);
      if (!publish.valid) errors.push(...publish.errors);
      if (context.collaboration) {
        const mode = (context.collaboration.exchangeMode ?? "").toLowerCase().replace(/-/g, "_");
        if (mode) {
          errors.push(...validateExchangeModeRequirements(mode, context.collaboration));
        }
        errors.push(...validateJointVentureCommercialRequirements(context.collaboration));
      }
      break;
    }
    case "start_negotiation_from_post_match": {
      const status = canonicalEntityStatus(MATCH_ENTITY2, context.postMatch?.status);
      if (status !== "confirmed") {
        errors.push("PostMatch must be confirmed before starting negotiation");
      }
      if (hasBlockingPostMatchNegotiation(context)) {
        errors.push("An active or agreed negotiation already exists for this PostMatch");
      }
      break;
    }
    case "start_negotiation_from_application": {
      const status = canonicalEntityStatus(APPLICATION_ENTITY2, context.application?.status);
      if (status !== "accepted") {
        errors.push("Application must be accepted before starting hiring negotiation");
      }
      if (hasBlockingApplicationNegotiation(context)) {
        errors.push("A hiring negotiation already exists for this application");
      }
      break;
    }
    case "create_deal_from_negotiation":
    case "create_deal_from_post_match": {
      const status = canonicalEntityStatus(NEGOTIATION_ENTITY2, context.negotiation?.status);
      if (status !== "agreed") {
        errors.push("Negotiation must be agreed before creating a deal");
      }
      if (context.linkage?.dealForNegotiation?.id) {
        errors.push("A deal already exists for this negotiation");
      }
      break;
    }
    case "create_deal_from_application": {
      const agreed = findAgreedApplicationNegotiation(context);
      if (!agreed?.id) {
        errors.push("An agreed application-linked negotiation is required before creating a deal");
      }
      if (context.linkage?.dealForApplication?.id || context.application?.dealId) {
        errors.push("A deal already exists for this application");
      }
      break;
    }
    case "create_contract_from_deal": {
      if (!context.deal?.id) {
        errors.push("Deal must exist before creating a contract");
      }
      const status = canonicalEntityStatus(DEAL_ENTITY2, context.deal?.status);
      if (!["draft", "review", "signing"].includes(status)) {
        errors.push("Deal must be in draft, review, or signing to create a contract");
      }
      if (hasActiveContractForDeal(context)) {
        errors.push("An active contract already exists for this deal");
      }
      break;
    }
    default:
      break;
  }
  return errors;
}
function validateWorkflowTransition(context, actionKey) {
  const errors = [...validateActionBusinessRules(context, actionKey)];
  const warnings = [];
  const action = findWorkflowAction(context, actionKey);
  if (!action) {
    errors.push(`Action "${actionKey}" is not visible in the current workflow context`);
  } else if (!action.enabled) {
    errors.push(action.disabledReason ?? `Action "${actionKey}" is disabled`);
  }
  const { primary } = resolveWorkflowKeys(context);
  const workflow = getWorkflowDefinition(primary);
  const definition = getActionDefinition(actionKey);
  if (!workflow.allowedCommands.includes(definition.commandType)) {
    const hiringAllowed = primary === "hiring" && ["StartNegotiationFromApplication", "CreateDealFromApplication", "AgreeNegotiation", "CreateContractFromDeal", "SignContract", "ActivateContract", "CompleteContract"].includes(definition.commandType);
    const marketplaceAllowed = primary === "marketplace" && workflow.allowedCommands.includes(definition.commandType);
    if (!hiringAllowed && !marketplaceAllowed) {
      errors.push(
        `Command "${definition.commandType}" is not allowed in workflow "${primary}"`
      );
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
export {
  COLLABORATION_WORKFLOW_DEFINITIONS,
  HIRING_WORKFLOW,
  MARKETPLACE_WORKFLOW,
  WORKFLOW_ACTION_REGISTRY,
  WORKFLOW_REGISTRY,
  canEntityTransition,
  canonicalEntityStatus,
  findAgreedApplicationNegotiation,
  findWorkflowAction,
  getActionDefinition,
  getWorkflowDefinition,
  getWorkflowNextActions,
  hasBlockingApplicationNegotiation,
  hasBlockingPostMatchNegotiation,
  isEntityTerminal,
  isWorkflowActionAvailable,
  listWorkflowKeys,
  resolveCollaborationWorkflowKey,
  resolvePrimaryWorkflowKey,
  resolveWorkflowKeys,
  validateCollaborationPublishRequirements,
  validateExchangeModeRequirements,
  validateJointVentureCommercialRequirements,
  validateWorkflowTransition
};
