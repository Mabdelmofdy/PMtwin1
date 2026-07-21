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
  send_negotiation_message: {
    key: "send_negotiation_message",
    label: "Send message",
    commandType: "SendNegotiationMessage",
    requiredRole: "participant",
    requiredPermission: "negotiation:message"
  },
  submit_negotiation_offer: {
    key: "submit_negotiation_offer",
    label: "Submit offer",
    commandType: "SubmitNegotiationOffer",
    requiredRole: "participant",
    requiredPermission: "negotiation:offer"
  },
  submit_negotiation_counter_offer: {
    key: "submit_negotiation_counter_offer",
    label: "Submit counter offer",
    commandType: "SubmitNegotiationCounterOffer",
    requiredRole: "participant",
    requiredPermission: "negotiation:counter"
  },
  accept_negotiation_offer: {
    key: "accept_negotiation_offer",
    label: "Accept offer",
    commandType: "AcceptNegotiationOffer",
    requiredRole: "participant",
    requiredPermission: "negotiation:offer:accept"
  },
  reject_negotiation_offer: {
    key: "reject_negotiation_offer",
    label: "Reject offer",
    commandType: "RejectNegotiationOffer",
    requiredRole: "participant",
    requiredPermission: "negotiation:offer:reject"
  },
  view_negotiation_transcript: {
    key: "view_negotiation_transcript",
    label: "View transcript",
    commandType: "LockNegotiationTranscript",
    requiredRole: "auditor",
    requiredPermission: "negotiation:transcript:view"
  },
  create_commercial_agreement_from_post_match: {
    key: "create_commercial_agreement_from_post_match",
    label: "Create commercial agreement",
    commandType: "CreateCommercialAgreementFromPostMatch",
    requiredRole: "participant",
    requiredPermission: "commercial_agreement:create"
  },
  create_commercial_agreement_from_application: {
    key: "create_commercial_agreement_from_application",
    label: "Create hiring commercial agreement",
    commandType: "CreateCommercialAgreementFromApplication",
    requiredRole: "hiring_party",
    requiredPermission: "commercial_agreement:create"
  },
  create_commercial_agreement_from_negotiation: {
    key: "create_commercial_agreement_from_negotiation",
    label: "Create commercial agreement",
    commandType: "CreateCommercialAgreementFromNegotiation",
    requiredRole: "participant",
    requiredPermission: "commercial_agreement:create"
  },
  award_commercial_agreement: {
    key: "award_commercial_agreement",
    label: "Award commercial agreement",
    commandType: "AwardCommercialAgreement",
    requiredRole: "opportunity_owner",
    requiredPermission: "commercial_agreement:award"
  },
  route_contract_decision: {
    key: "route_contract_decision",
    label: "Route contract decision",
    commandType: "RouteContractDecision",
    requiredRole: "participant",
    requiredPermission: "contract:decision:route"
  },
  create_contract_from_commercial_agreement: {
    key: "create_contract_from_commercial_agreement",
    label: "Create contract",
    commandType: "CreateContractFromCommercialAgreement",
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
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "commercial_agreement", "contract", "completion"],
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
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "commercial_agreement", "contract", "completion"],
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
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "commercial_agreement", "contract", "completion"],
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
    steps: ["opportunity", "publish", "matching", "post_match", "negotiation", "commercial_agreement", "contract", "completion"],
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
    steps: ["application", "accepted", "negotiation", "commercial_agreement", "contract", "completion"],
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
  "CreateCommercialAgreementFromApplication",
  "RouteContractDecision",
  "CreateContractFromCommercialAgreement",
  "SignContract",
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
    "commercial_agreement",
    "contract",
    "completion"
  ],
  allowedTransitions: [
    { from: "accepted", to: "negotiation", action: "start_negotiation_from_application", commandType: "StartNegotiationFromApplication" },
    { from: "negotiation", to: "commercial_agreement", action: "agree_negotiation", commandType: "AgreeNegotiation" },
    { from: "negotiation", to: "commercial_agreement", action: "create_commercial_agreement_from_application", commandType: "CreateCommercialAgreementFromApplication" },
    { from: "commercial_agreement", to: "commercial_agreement", action: "route_contract_decision", commandType: "RouteContractDecision" },
    { from: "commercial_agreement", to: "contract", action: "create_contract_from_commercial_agreement", commandType: "CreateContractFromCommercialAgreement" },
    { from: "contract", to: "completion", action: "sign_contract", commandType: "SignContract" },
    { from: "contract", to: "completion", action: "complete_contract", commandType: "CompleteContract" }
  ],
  allowedCommands: [...HIRING_COMMANDS],
  businessRules: [
    "Application must be accepted before starting hiring negotiation",
    "Negotiation must be agreed before creating hiring commercial agreement",
    "Commercial agreement contract route must pass decision engine approval",
    "Commercial agreement must exist before creating contract",
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
  "CreateCommercialAgreementFromPostMatch",
  "CreateCommercialAgreementFromNegotiation",
  "AwardCommercialAgreement",
  "RouteContractDecision",
  "CreateContractFromCommercialAgreement",
  "SignContract",
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
    "commercial_agreement",
    "contract",
    "completion"
  ],
  allowedTransitions: [
    { from: "opportunity", to: "publish", action: "publish_opportunity", commandType: "PublishOpportunity" },
    { from: "post_match", to: "negotiation", action: "start_negotiation_from_post_match", commandType: "StartNegotiationFromPostMatch" },
    { from: "post_match", to: "post_match", action: "accept_match", commandType: "AcceptPostMatch" },
    { from: "post_match", to: "post_match", action: "decline_match", commandType: "DeclinePostMatch" },
    { from: "negotiation", to: "commercial_agreement", action: "agree_negotiation", commandType: "AgreeNegotiation" },
    { from: "negotiation", to: "commercial_agreement", action: "create_commercial_agreement_from_post_match", commandType: "CreateCommercialAgreementFromPostMatch" },
    { from: "negotiation", to: "commercial_agreement", action: "create_commercial_agreement_from_negotiation", commandType: "CreateCommercialAgreementFromNegotiation" },
    { from: "commercial_agreement", to: "contract", action: "award_commercial_agreement", commandType: "AwardCommercialAgreement" },
    { from: "commercial_agreement", to: "commercial_agreement", action: "route_contract_decision", commandType: "RouteContractDecision" },
    { from: "commercial_agreement", to: "contract", action: "create_contract_from_commercial_agreement", commandType: "CreateContractFromCommercialAgreement" },
    { from: "contract", to: "completion", action: "sign_contract", commandType: "SignContract" },
    { from: "contract", to: "completion", action: "complete_contract", commandType: "CompleteContract" }
  ],
  allowedCommands: [...MARKETPLACE_COMMANDS],
  businessRules: [
    "PostMatch must be confirmed before starting negotiation",
    "Negotiation must be agreed before creating a commercial agreement",
    "Commercial agreement contract route must pass decision engine approval",
    "Commercial agreement must exist before creating a contract",
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
    commercial_agreement: {
      canonicalStates: [
        "draft",
        "review",
        "signing",
        "executing",
        "completed",
        "cancelled"
      ],
      aliasesFile: "aliases/commercial_agreement.json"
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
var commercial_agreement_default = {
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
  commercial_agreement: commercial_agreement_default,
  contract: contract_default
};
var ENTITY_TYPE_LEGACY_ALIASES = Object.freeze({
  deal: "commercial_agreement"
});
function resolveEntityType(entityType) {
  return ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType;
}
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
  const resolvedEntityType = resolveEntityType(entityType);
  const key = String(status).toLowerCase();
  const map = registry.resolveMap[resolvedEntityType];
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
  commercial_agreement: {
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
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType;
  const canonical = toCanonical(resolvedEntityType, status);
  if (!canonical) {
    return false;
  }
  const fsm = transitions_default[resolvedEntityType];
  if (!fsm) {
    return false;
  }
  return fsm.terminalStates.includes(canonical);
}
function allowedTransitions(entityType, fromStatus) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType;
  const from = toCanonical(resolvedEntityType, fromStatus);
  if (!from) {
    return Object.freeze([]);
  }
  const fsm = transitions_default[resolvedEntityType];
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
function findParticipant(participants, userId, options) {
  if (!userId || !participants) return void 0;
  return participants.find((participant) => {
    if (participant.userId === userId) return true;
    if (participant.representativeUserIds?.includes(userId)) return true;
    if (options?.activePartyId && participant.partyId && participant.partyId === options.activePartyId) {
      return true;
    }
    return false;
  });
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
function hasActiveContractForCommercialAgreement(context) {
  const contracts = context.linkage?.contractsForCommercialAgreement ?? context.linkage?.contractsForDeal ?? [];
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
var EQUITY_VISIBLE_FIELD_IDS = /* @__PURE__ */ new Set([
  "equitySplit",
  "equityStructure",
  "equityPercentage",
  "ownershipTerms",
  "vestingTerms",
  "equityComponent"
]);
function inferFieldWidth(type) {
  if (type === "textarea" || type === "array-objects" || type === "array-percentages" || type === "currency-range" || type === "date-range" || type === "attachment") {
    return "full";
  }
  return "half";
}
function mapLegacyConditional(attr) {
  if (!attr.conditional) return void 0;
  const value = attr.conditional.value;
  if (Array.isArray(value)) {
    return { field: attr.conditional.field, op: "in", value };
  }
  return { field: attr.conditional.field, op: "eq", value };
}
function equityVisibleWhen(fieldId) {
  if (!EQUITY_VISIBLE_FIELD_IDS.has(fieldId)) return void 0;
  return {
    field: "exchangeMode",
    op: "notIn",
    value: ["cash", "barter", "profit_sharing", "hybrid"]
  };
}
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
  return attributes.map((attr, index) => {
    const type = mapLegacyFieldType(attr.type);
    const displayOrder = (index + 1) * 10;
    const placeholder = `Enter ${attr.label.toLowerCase()}`;
    const description = attr.description ?? `${attr.label} for this collaboration model.`;
    const legacyConditional = mapLegacyConditional(attr);
    const equityConditional = equityVisibleWhen(attr.key);
    const visibleWhen = legacyConditional ?? equityConditional;
    return {
      id: attr.key,
      label: attr.label,
      description,
      type,
      required: required.has(attr.key) || attr.required,
      placeholder,
      helpText: attr.description,
      validation: {
        ...required.has(attr.key) || attr.required ? { required: true } : {},
        ...attr.min != null ? { min: attr.min } : {},
        ...attr.maxLength != null ? { maxLength: attr.maxLength } : {}
      },
      displayOrder,
      group: inferFieldGroup(attr),
      ...attr.options ? { options: attr.options } : {},
      ui: {
        width: inferFieldWidth(type),
        order: displayOrder,
        hint: attr.description,
        placeholder
      },
      ...visibleWhen ? { visibleWhen } : {}
    };
  });
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
function canPartyOwnSubModel(partyType, applicability) {
  if (!applicability) return true;
  if (!applicability.allowedPartyTypes?.length) return true;
  return applicability.allowedPartyTypes.includes(partyType);
}
function getRelationshipType(ownerType, participantType) {
  if (ownerType === "company" && participantType === "company") return "B2B";
  if (ownerType === "company" && participantType === "individual") return "B2P";
  if (ownerType === "individual" && participantType === "company") return "P2B";
  return "P2P";
}
function resolvePrimaryRelationship(applicability) {
  if (applicability.primaryRelationship) return applicability.primaryRelationship;
  return applicability.supportedRelationships[0];
}
function relationshipFlagsFromSupported(supported) {
  return {
    supportsB2B: supported.includes("B2B"),
    supportsB2P: supported.includes("B2P"),
    supportsP2B: supported.includes("P2B"),
    supportsP2P: supported.includes("P2P")
  };
}
function isRelationshipSupported(applicability, relationship) {
  if (applicability.supportedRelationships.includes(relationship)) return true;
  switch (relationship) {
    case "B2B":
      return applicability.supportsB2B === true;
    case "B2P":
      return applicability.supportsB2P === true;
    case "P2B":
      return applicability.supportsP2B === true;
    case "P2P":
      return applicability.supportsP2P === true;
    default:
      return false;
  }
}
function canPartyParticipate(ownerType, participantType, applicability) {
  if (!applicability) return true;
  const relationship = getRelationshipType(ownerType, participantType);
  return isRelationshipSupported(applicability, relationship);
}
function validatePartyEligibility(context, applicability) {
  const errors = [];
  const warnings = [];
  if (!applicability) {
    return { valid: true, errors, warnings };
  }
  if (!canPartyOwnSubModel(context.ownerPartyType, applicability)) {
    errors.push(
      applicability.reason ?? `Party type "${context.ownerPartyType}" cannot own this collaboration sub-model`
    );
  }
  if (context.participantPartyType) {
    if (!canPartyParticipate(
      context.ownerPartyType,
      context.participantPartyType,
      applicability
    )) {
      const relationship = getRelationshipType(
        context.ownerPartyType,
        context.participantPartyType
      );
      errors.push(
        `Relationship ${relationship} is not supported for this collaboration sub-model`
      );
    }
  }
  const primary = resolvePrimaryRelationship(applicability);
  if (primary && context.participantPartyType) {
    const actual = getRelationshipType(context.ownerPartyType, context.participantPartyType);
    if (actual !== primary) {
      warnings.push(
        `Primary relationship for this sub-model is ${primary}; current pairing is ${actual}`
      );
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function buildApplicability(supportedRelationships, ownershipPolicy, participantConstraints, options = {}) {
  return {
    allowedPartyTypes: options.allowedPartyTypes,
    primaryRelationship: options.primaryRelationship ?? supportedRelationships[0],
    supportedRelationships,
    ...relationshipFlagsFromSupported(supportedRelationships),
    ownershipPolicy,
    participantConstraints,
    reason: options.reason
  };
}
var ALL = ["B2B", "B2P", "P2B", "P2P"];
var B2B_ONLY = ["B2B"];
var HIRING = ["B2P", "P2B"];
var B2B_B2P_P2B = ["B2B", "B2P", "P2B"];
var SUB_MODEL_APPLICABILITY = {
  task_based: buildApplicability(
    ALL,
    { mode: "single", transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 1, recommendedParticipants: 1 },
    { primaryRelationship: "B2B" }
  ),
  consortium: buildApplicability(
    B2B_ONLY,
    { mode: "multi", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 4 },
    { allowedPartyTypes: ["company"], primaryRelationship: "B2B" }
  ),
  project_jv: buildApplicability(
    B2B_ONLY,
    { mode: "shared", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 2 },
    {
      allowedPartyTypes: ["company"],
      primaryRelationship: "B2B",
      reason: "Project-Specific Joint Venture requires a company entity"
    }
  ),
  spv: buildApplicability(
    B2B_ONLY,
    { mode: "shared", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 3 },
    {
      allowedPartyTypes: ["company"],
      primaryRelationship: "B2B",
      reason: "SPV is a corporate structure available to companies only"
    }
  ),
  strategic_jv: buildApplicability(
    B2B_ONLY,
    { mode: "shared", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 2 },
    {
      allowedPartyTypes: ["company"],
      primaryRelationship: "B2B",
      reason: "Strategic Joint Venture requires a company entity"
    }
  ),
  strategic_alliance: buildApplicability(
    ALL,
    { mode: "shared", transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 2 },
    { primaryRelationship: "B2B" }
  ),
  mentorship: buildApplicability(
    ["P2P", "B2P", "P2B"],
    { mode: "single", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 2, recommendedParticipants: 1 },
    { primaryRelationship: "P2P" }
  ),
  bulk_purchasing: buildApplicability(
    ["B2B", "B2P"],
    { mode: "multi", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 3 },
    { primaryRelationship: "B2B" }
  ),
  equipment_sharing: buildApplicability(
    ALL,
    { mode: "shared", transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 2 },
    { primaryRelationship: "B2B" }
  ),
  resource_sharing: buildApplicability(
    ALL,
    { mode: "shared", transferable: true, requiresPrimaryOwner: false },
    { minimumParticipants: 2, maximumParticipants: "unlimited", recommendedParticipants: 2 },
    { primaryRelationship: "B2P" }
  ),
  professional_hiring: buildApplicability(
    HIRING,
    { mode: "single", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: 1, recommendedParticipants: 1 },
    { allowedPartyTypes: ["company"], primaryRelationship: "B2P" }
  ),
  consultant_hiring: buildApplicability(
    B2B_B2P_P2B,
    { mode: "single", transferable: true, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: "unlimited", recommendedParticipants: 1 },
    { primaryRelationship: "B2P" }
  ),
  competition_rfp: buildApplicability(
    ALL,
    { mode: "single", transferable: false, requiresPrimaryOwner: true },
    { minimumParticipants: 1, maximumParticipants: "unlimited", recommendedParticipants: 3 },
    { primaryRelationship: "B2B" }
  )
};
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
    applicability: SUB_MODEL_APPLICABILITY.task_based,
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
    applicability: SUB_MODEL_APPLICABILITY.consortium,
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
    applicability: SUB_MODEL_APPLICABILITY.project_jv,
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
    applicability: SUB_MODEL_APPLICABILITY.spv,
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
    applicability: SUB_MODEL_APPLICABILITY.strategic_jv,
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
    applicability: SUB_MODEL_APPLICABILITY.strategic_alliance,
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
    applicability: SUB_MODEL_APPLICABILITY.mentorship,
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
    applicability: SUB_MODEL_APPLICABILITY.bulk_purchasing,
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
    applicability: SUB_MODEL_APPLICABILITY.equipment_sharing,
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
    applicability: SUB_MODEL_APPLICABILITY.resource_sharing,
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
    applicability: SUB_MODEL_APPLICABILITY.professional_hiring,
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
    applicability: SUB_MODEL_APPLICABILITY.consultant_hiring,
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
    applicability: SUB_MODEL_APPLICABILITY.competition_rfp,
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
function validateOpportunityCollaborationModel(input, partyContext) {
  const taxonomy = validateCollaborationTaxonomy(input);
  if (!taxonomy.valid) return taxonomy;
  const subKey = normalizeSubModelType(input.subModelType, input);
  if (!subKey) return taxonomy;
  const attributes = validateSubModelAttributes(
    subKey,
    input.collaborationAttributes
  );
  const errors = [...taxonomy.errors, ...attributes.errors];
  const warnings = [...taxonomy.warnings, ...attributes.warnings];
  if (partyContext) {
    const sub = getSubModel(subKey);
    const eligibility = validatePartyEligibility(partyContext, sub?.applicability);
    if (!eligibility.valid) {
      errors.push(...eligibility.errors);
    }
    warnings.push(...eligibility.warnings);
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
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
var REQUIRED_WEIGHT_EACH = 8;
var RECOMMENDED_WEIGHT_EACH = 4;
var CORE_FIELDS = [
  { id: "title", label: "Title", category: "general", priority: "required" },
  { id: "intent", label: "Intent", category: "general", priority: "required" },
  { id: "categoryProfession", label: "Category / Profession", category: "general", priority: "required" },
  { id: "roleIntent", label: "Role Needed or Role Offered", category: "requirements", priority: "required" },
  { id: "skillsIntent", label: "Skills Required or Offered", category: "requirements", priority: "required" },
  { id: "servicesIntent", label: "Services Required or Offered", category: "requirements", priority: "required" },
  { id: "location", label: "Location or Service Area", category: "location", priority: "required" },
  { id: "timeline", label: "Timeline / Availability", category: "timeline", priority: "required" },
  { id: "collaborationModel", label: "Collaboration Model", category: "commercial", priority: "required" },
  { id: "descriptionScope", label: "Description / Scope", category: "technical", priority: "required" },
  { id: "budgetValueTerms", label: "Budget / Value Terms", category: "financial", priority: "recommended" },
  { id: "preferredPartnerType", label: "Preferred Partner Type", category: "requirements", priority: "recommended" },
  { id: "attachments", label: "Attachments / Portfolio References", category: "requirements", priority: "recommended" },
  { id: "compliance", label: "Compliance Requirements", category: "legal", priority: "recommended" },
  { id: "deliveryMilestones", label: "Delivery Milestones", category: "timeline", priority: "recommended" }
];
var OPPORTUNITY_CORE_READINESS = {
  requiredFields: CORE_FIELDS.filter((f) => f.priority === "required").map((f) => f.id),
  optionalFields: CORE_FIELDS.filter((f) => f.priority === "recommended").map((f) => f.id),
  minimumPublishFields: CORE_FIELDS.filter((f) => f.priority === "required").map((f) => f.id),
  fields: CORE_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    category: field.category,
    priority: field.priority,
    weight: field.priority === "required" ? REQUIRED_WEIGHT_EACH : RECOMMENDED_WEIGHT_EACH,
    requiredWeight: field.priority === "required" ? REQUIRED_WEIGHT_EACH : 0,
    recommendedWeight: field.priority === "recommended" ? RECOMMENDED_WEIGHT_EACH : 0
  }))
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

// ../decision-engine/dist/index.js
function isDecisionStatusApproved(status) {
  return status === "approved";
}

// src/engine/next-actions.ts
var MATCH_ENTITY = "match";
var APPLICATION_ENTITY = "application";
var NEGOTIATION_ENTITY = "negotiation";
var COMMERCIAL_AGREEMENT_ENTITY = "commercial_agreement";
var CONTRACT_ENTITY = "contract";
var OPPORTUNITY_ENTITY = "opportunity";
var COMMERCIAL_AGREEMENT_STATUSES_ALLOWING_CONTRACT = /* @__PURE__ */ new Set(["draft", "review", "signing"]);
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
  const participant = findParticipant(match?.participants, userId, {
    activePartyId: context.user.activePartyId
  });
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
  const participant = findParticipant(match?.participants, userId, {
    activePartyId: context.user.activePartyId
  });
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
  const hasCommercialAgreement = Boolean(
    context.linkage?.commercialAgreementForApplication?.id || context.linkage?.dealForApplication?.id || application?.commercialAgreementId || application?.dealId
  );
  const enabled = visible && userCanMutate(context) && !blocked && !hasCommercialAgreement;
  return buildAction(context, "start_negotiation_from_application", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Accepted application can start hiring negotiation" : "Start hiring negotiation requires an accepted application",
    disabledReason: hasCommercialAgreement ? "A commercial agreement already exists for this application" : blocked ? "A hiring negotiation already exists for this application" : !userCanMutate(context) ? "You do not have permission to start hiring negotiation" : void 0,
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
var AUDITOR_ROLES = /* @__PURE__ */ new Set(["auditor", "admin", "moderator"]);
function isNegotiationRoomWritable(context) {
  const negotiation = context.negotiation;
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status);
  return Boolean(
    negotiation?.id && (status === "active" || status === "countered")
  );
}
function isAuditorViewer(context) {
  const roles = context.user.roles ?? [];
  return roles.some((role) => AUDITOR_ROLES.has(role));
}
function canViewNegotiationTranscript(context) {
  const negotiation = context.negotiation;
  if (!negotiation?.id) return false;
  if (context.user.isParticipant) return true;
  if (isAuditorViewer(context)) return true;
  return Boolean(context.user.canMutate && context.user.userId);
}
function evaluateSendNegotiationMessage(context) {
  const negotiation = context.negotiation;
  const writable = isNegotiationRoomWritable(context);
  const visible = Boolean(negotiation?.id && writable);
  const enabled = visible && userCanMutate(context) && Boolean(context.user.isParticipant);
  return buildAction(context, "send_negotiation_message", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Negotiation room is open for discussion" : "Discussion is only available for active negotiations",
    disabledReason: !context.user.isParticipant ? "Only negotiation participants can send messages" : !userCanMutate(context) ? "You do not have permission to send messages" : void 0,
    aggregateId: negotiation?.id
  });
}
function evaluateSubmitNegotiationOffer(context) {
  const negotiation = context.negotiation;
  const writable = isNegotiationRoomWritable(context);
  const visible = Boolean(negotiation?.id && writable);
  const enabled = visible && userCanMutate(context) && Boolean(context.user.isParticipant);
  return buildAction(context, "submit_negotiation_offer", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Negotiation room accepts initial offers" : "Offer submission requires an active negotiation",
    disabledReason: !context.user.isParticipant ? "Only negotiation participants can submit offers" : void 0,
    aggregateId: negotiation?.id
  });
}
function evaluateSubmitNegotiationCounterOffer(context) {
  const negotiation = context.negotiation;
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status);
  const visible = Boolean(
    negotiation?.id && (status === "active" || status === "countered")
  );
  const enabled = visible && userCanMutate(context) && Boolean(context.user.isParticipant);
  return buildAction(context, "submit_negotiation_counter_offer", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Counter offers can be submitted while negotiation is open" : "Counter offers require an active or countered negotiation",
    disabledReason: !context.user.isParticipant ? "Only negotiation participants can submit counter offers" : void 0,
    aggregateId: negotiation?.id
  });
}
function evaluateAcceptNegotiationOffer(context) {
  const negotiation = context.negotiation;
  const writable = isNegotiationRoomWritable(context);
  const visible = Boolean(negotiation?.id && writable);
  const enabled = visible && userCanMutate(context) && Boolean(context.user.isParticipant);
  return buildAction(context, "accept_negotiation_offer", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Submitted offers can be accepted" : "Accept offer is only available for open negotiations",
    disabledReason: !context.user.isParticipant ? "Only negotiation participants can accept offers" : void 0,
    aggregateId: negotiation?.id
  });
}
function evaluateRejectNegotiationOffer(context) {
  const accept = evaluateAcceptNegotiationOffer(context);
  return buildAction(context, "reject_negotiation_offer", {
    visible: accept.visible,
    enabled: accept.enabled,
    visibilityReason: accept.visibilityReason,
    disabledReason: accept.disabledReason,
    aggregateId: accept.aggregateId
  });
}
function evaluateViewNegotiationTranscript(context) {
  const negotiation = context.negotiation;
  const visible = canViewNegotiationTranscript(context);
  const enabled = visible;
  return buildAction(context, "view_negotiation_transcript", {
    visible: Boolean(negotiation?.id && visible),
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Negotiation transcript is available for review" : "Transcript view requires participant or auditor access",
    aggregateId: negotiation?.id
  });
}
function evaluateCreateCommercialAgreementFromNegotiation(context) {
  const negotiation = context.negotiation;
  const status = canonicalEntityStatus(NEGOTIATION_ENTITY, negotiation?.status);
  const existingCommercialAgreement = context.linkage?.commercialAgreementForNegotiation ?? context.linkage?.dealForNegotiation;
  const hasAcceptedOffer = Boolean(
    context.linkage?.negotiationAcceptedOfferId || status === "agreed" && context.negotiation?.commercialTerms && Object.keys(context.negotiation.commercialTerms).length > 0
  );
  const visible = Boolean(negotiation?.id && status === "agreed");
  const enabled = visible && userCanMutate(context) && !existingCommercialAgreement?.id && hasAcceptedOffer;
  return buildAction(context, "create_commercial_agreement_from_negotiation", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Agreed negotiation can create a commercial agreement" : "Create commercial agreement requires an agreed negotiation",
    disabledReason: !hasAcceptedOffer ? "An accepted negotiation offer is required before creating a commercial agreement" : existingCommercialAgreement?.id ? "A commercial agreement already exists for this negotiation" : !userCanMutate(context) ? "You do not have permission to create a commercial agreement" : void 0,
    aggregateId: negotiation?.id,
    metadata: negotiation?.id ? { negotiationId: negotiation.id } : void 0
  });
}
function evaluateCreateCommercialAgreementFromPostMatch(context) {
  const base = evaluateCreateCommercialAgreementFromNegotiation(context);
  const match = context.postMatch;
  const visible = base.visible && Boolean(match?.id && negotiationLinkedToPostMatch(context));
  return buildAction(context, "create_commercial_agreement_from_post_match", {
    visible,
    enabled: base.enabled && visible,
    visibilityReason: visible ? "Agreed PostMatch negotiation can create a commercial agreement" : "Create commercial agreement from PostMatch requires agreed negotiation linked to match",
    disabledReason: base.disabledReason,
    aggregateId: match?.id ?? base.aggregateId,
    metadata: {
      negotiationId: context.negotiation?.id,
      postMatchId: match?.id
    }
  });
}
function evaluateCreateCommercialAgreementFromApplication(context) {
  const application = context.application;
  const agreed = findAgreedApplicationNegotiation(context);
  const existingCommercialAgreement = context.linkage?.commercialAgreementForApplication ?? context.linkage?.dealForApplication;
  const legacyEnabled = context.linkage?.legacyApplicationsEnabled !== false;
  const visible = legacyEnabled && Boolean(application?.id && agreed?.id);
  const enabled = visible && userCanMutate(context) && !existingCommercialAgreement?.id && !application?.commercialAgreementId && !application?.dealId;
  return buildAction(context, "create_commercial_agreement_from_application", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Agreed hiring negotiation can create a commercial agreement" : "Create hiring commercial agreement requires an agreed application-linked negotiation",
    disabledReason: existingCommercialAgreement?.id || application?.commercialAgreementId || application?.dealId ? "A commercial agreement already exists for this application" : !userCanMutate(context) ? "You do not have permission to create a hiring commercial agreement" : void 0,
    aggregateId: application?.id,
    workflowKey: "hiring",
    metadata: agreed?.id ? { negotiationId: agreed.id } : void 0
  });
}
function evaluateCreateContractFromCommercialAgreement(context) {
  const commercialAgreement = context.commercialAgreement ?? context.deal;
  const status = canonicalEntityStatus(COMMERCIAL_AGREEMENT_ENTITY, commercialAgreement?.status);
  const visible = Boolean(
    commercialAgreement?.id && COMMERCIAL_AGREEMENT_STATUSES_ALLOWING_CONTRACT.has(status) && (commercialAgreement.negotiationId || commercialAgreement.postMatchId || commercialAgreement.applicationId)
  );
  const hasContract = hasActiveContractForCommercialAgreement(context);
  const decisionRequired = context.linkage?.contractDecisionRequired !== false;
  const decisionApproved = isDecisionStatusApproved(
    context.linkage?.contractDecisionStatus
  );
  const enabled = visible && userCanMutate(context) && !hasContract && (!decisionRequired || decisionApproved);
  return buildAction(context, "create_contract_from_commercial_agreement", {
    visible,
    enabled: Boolean(enabled),
    visibilityReason: visible ? "Commercial agreement is ready for contract creation" : "Create contract requires a draft, review, or signing commercial agreement",
    disabledReason: hasContract ? "An active contract already exists for this commercial agreement" : decisionRequired && !decisionApproved ? "Decision review must be approved before creating a contract" : !userCanMutate(context) ? "You do not have permission to create a contract" : void 0,
    aggregateId: commercialAgreement?.id,
    metadata: commercialAgreement?.id ? { commercialAgreementId: commercialAgreement.id } : void 0
  });
}
function evaluateAwardCommercialAgreement(context) {
  const commercialAgreement = context.commercialAgreement ?? context.deal;
  const opportunity = context.opportunity;
  const status = canonicalEntityStatus(COMMERCIAL_AGREEMENT_ENTITY, commercialAgreement?.status);
  const visible = Boolean(
    commercialAgreement?.id && (status === "draft" || status === "active" || status === "signing")
  );
  const enabled = Boolean(
    visible && userCanMutate(context) && context.user.isOpportunityOwner && (opportunity?.visibilityStatus ?? "").toLowerCase() === "published" && (commercialAgreement?.awardStatus ?? "none") === "none"
  );
  return buildAction(context, "award_commercial_agreement", {
    visible,
    enabled,
    visibilityReason: visible ? "Commercial agreement can be awarded by opportunity owner" : "Award is only available for awardable commercial agreements",
    disabledReason: !context.user.isOpportunityOwner ? "Only opportunity owner can award" : void 0,
    aggregateId: commercialAgreement?.id
  });
}
function evaluateRouteContractDecision(context) {
  const commercialAgreement = context.commercialAgreement ?? context.deal;
  const status = canonicalEntityStatus(COMMERCIAL_AGREEMENT_ENTITY, commercialAgreement?.status);
  const visible = Boolean(
    commercialAgreement?.id && COMMERCIAL_AGREEMENT_STATUSES_ALLOWING_CONTRACT.has(status)
  );
  const hasContract = hasActiveContractForCommercialAgreement(context);
  const decisionApproved = isDecisionStatusApproved(context.linkage?.contractDecisionStatus);
  const enabled = visible && userCanMutate(context) && !hasContract && !decisionApproved;
  return buildAction(context, "route_contract_decision", {
    visible,
    enabled,
    visibilityReason: visible ? "Commercial agreement can be routed to decision engine review" : "Decision routing requires a draft, review, or signing commercial agreement",
    disabledReason: hasContract ? "Contract already exists for this commercial agreement" : decisionApproved ? "Decision review already approved" : !userCanMutate(context) ? "You do not have permission to route contract decisions" : void 0,
    aggregateId: commercialAgreement?.id,
    metadata: commercialAgreement?.id ? { commercialAgreementId: commercialAgreement.id } : void 0
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
  send_negotiation_message: evaluateSendNegotiationMessage,
  submit_negotiation_offer: evaluateSubmitNegotiationOffer,
  submit_negotiation_counter_offer: evaluateSubmitNegotiationCounterOffer,
  accept_negotiation_offer: evaluateAcceptNegotiationOffer,
  reject_negotiation_offer: evaluateRejectNegotiationOffer,
  view_negotiation_transcript: evaluateViewNegotiationTranscript,
  create_commercial_agreement_from_post_match: evaluateCreateCommercialAgreementFromPostMatch,
  create_commercial_agreement_from_application: evaluateCreateCommercialAgreementFromApplication,
  create_commercial_agreement_from_negotiation: evaluateCreateCommercialAgreementFromNegotiation,
  award_commercial_agreement: evaluateAwardCommercialAgreement,
  route_contract_decision: evaluateRouteContractDecision,
  create_contract_from_commercial_agreement: evaluateCreateContractFromCommercialAgreement,
  sign_contract: evaluateSignContract,
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
  if (["start_negotiation_from_application", "create_commercial_agreement_from_application"].includes(key) && context.application?.id) {
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
var COMMERCIAL_AGREEMENT_ENTITY2 = "commercial_agreement";
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
    case "create_commercial_agreement_from_negotiation":
    case "create_commercial_agreement_from_post_match": {
      const status = canonicalEntityStatus(NEGOTIATION_ENTITY2, context.negotiation?.status);
      if (status !== "agreed") {
        errors.push("Negotiation must be agreed before creating a commercial agreement");
      }
      if (!context.linkage?.negotiationAcceptedOfferId) {
        const hasLegacyAgreedTerms = Boolean(
          status === "agreed" && context.negotiation?.commercialTerms && Object.keys(context.negotiation.commercialTerms).length > 0
        );
        if (!hasLegacyAgreedTerms) {
          errors.push("An accepted negotiation offer is required before creating a commercial agreement");
        }
      }
      if (context.linkage?.commercialAgreementForNegotiation?.id || context.linkage?.dealForNegotiation?.id) {
        errors.push("A commercial agreement already exists for this negotiation");
      }
      break;
    }
    case "create_commercial_agreement_from_application": {
      const agreed = findAgreedApplicationNegotiation(context);
      if (!agreed?.id) {
        errors.push("An agreed application-linked negotiation is required before creating a commercial agreement");
      }
      if (context.linkage?.commercialAgreementForApplication?.id || context.linkage?.dealForApplication?.id || context.application?.commercialAgreementId || context.application?.dealId) {
        errors.push("A commercial agreement already exists for this application");
      }
      break;
    }
    case "create_contract_from_commercial_agreement": {
      const commercialAgreement = context.commercialAgreement ?? context.deal;
      if (!commercialAgreement?.id) {
        errors.push("Commercial agreement must exist before creating a contract");
      }
      const status = canonicalEntityStatus(COMMERCIAL_AGREEMENT_ENTITY2, commercialAgreement?.status);
      if (!["draft", "review", "signing"].includes(status)) {
        errors.push("Commercial agreement must be in draft, review, or signing to create a contract");
      }
      if (hasActiveContractForCommercialAgreement(context)) {
        errors.push("An active contract already exists for this commercial agreement");
      }
      if (context.linkage?.contractDecisionRequired !== false && context.linkage?.contractDecisionStatus !== "approved") {
        errors.push("Decision review must be approved before creating a contract");
      }
      break;
    }
    case "route_contract_decision": {
      const commercialAgreement = context.commercialAgreement ?? context.deal;
      if (!commercialAgreement?.id) {
        errors.push("Commercial agreement must exist before routing decision review");
      }
      if (hasActiveContractForCommercialAgreement(context)) {
        errors.push("Contract already exists for this commercial agreement");
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
    const hiringAllowed = primary === "hiring" && ["StartNegotiationFromApplication", "CreateCommercialAgreementFromApplication", "AgreeNegotiation", "RouteContractDecision", "CreateContractFromCommercialAgreement", "SignContract", "CompleteContract"].includes(definition.commandType);
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

// src/hooks/action-hooks.ts
var LIFECYCLE_ENTITY_BY_KIND = {
  opportunity: "opportunity",
  application: "application",
  post_match: "match",
  negotiation: "negotiation",
  commercial_agreement: "commercial_agreement",
  deal: "commercial_agreement",
  contract: "contract"
};
var ENTITY_KIND_BY_ACTION = {
  publish_opportunity: "opportunity",
  accept_match: "post_match",
  decline_match: "post_match",
  start_negotiation_from_post_match: "post_match",
  start_negotiation_from_application: "application",
  agree_negotiation: "negotiation",
  cancel_negotiation: "negotiation",
  send_negotiation_message: "negotiation",
  submit_negotiation_offer: "negotiation",
  submit_negotiation_counter_offer: "negotiation",
  accept_negotiation_offer: "negotiation",
  reject_negotiation_offer: "negotiation",
  view_negotiation_transcript: "negotiation",
  create_commercial_agreement_from_post_match: "post_match",
  create_commercial_agreement_from_application: "application",
  create_commercial_agreement_from_negotiation: "negotiation",
  award_commercial_agreement: "commercial_agreement",
  route_contract_decision: "commercial_agreement",
  create_contract_from_commercial_agreement: "commercial_agreement",
  sign_contract: "contract",
  complete_contract: "contract"
};
var AUDIT_ACTION_BY_KEY = {
  publish_opportunity: "opportunity.published",
  accept_match: "match.accepted",
  decline_match: "match.declined",
  start_negotiation_from_post_match: "negotiation.started_from_match",
  start_negotiation_from_application: "negotiation.started_from_application",
  agree_negotiation: "negotiation.agreed",
  cancel_negotiation: "negotiation.cancelled",
  send_negotiation_message: "negotiation.message.sent",
  submit_negotiation_offer: "negotiation.offer.submitted",
  submit_negotiation_counter_offer: "negotiation.counter.submitted",
  accept_negotiation_offer: "negotiation.offer.accepted",
  reject_negotiation_offer: "negotiation.offer.rejected",
  view_negotiation_transcript: "negotiation.transcript.viewed",
  create_commercial_agreement_from_post_match: "commercial_agreement.created_from_match",
  create_commercial_agreement_from_application: "commercial_agreement.created_from_application",
  create_commercial_agreement_from_negotiation: "commercial_agreement.created_from_negotiation",
  award_commercial_agreement: "commercial_agreement.awarded",
  route_contract_decision: "decision.routed",
  create_contract_from_commercial_agreement: "contract.created",
  sign_contract: "contract.signed",
  complete_contract: "contract.completed"
};
var NOTIFICATION_TYPE_BY_KEY = {
  publish_opportunity: "opportunity.published",
  accept_match: "match.response",
  decline_match: "match.response",
  start_negotiation_from_post_match: "negotiation.started",
  start_negotiation_from_application: "hiring.negotiation.started",
  agree_negotiation: "negotiation.agreed",
  create_commercial_agreement_from_negotiation: "commercial_agreement.created",
  create_commercial_agreement_from_application: "commercial_agreement.created",
  award_commercial_agreement: "commercial_agreement.awarded",
  route_contract_decision: "decision.review.required",
  create_contract_from_commercial_agreement: "contract.created",
  sign_contract: "contract.signature_required",
  complete_contract: "contract.completed"
};
function resolveEntitySnapshot(context, actionKey) {
  switch (ENTITY_KIND_BY_ACTION[actionKey]) {
    case "opportunity":
      return context.opportunity;
    case "application":
      return context.application;
    case "post_match":
      return context.postMatch;
    case "negotiation":
      return context.negotiation;
    case "commercial_agreement":
      return context.commercialAgreement ?? context.deal;
    case "deal":
      return context.deal ?? context.commercialAgreement;
    case "contract":
      return context.contract;
    default:
      return void 0;
  }
}
function buildWorkflowActionHook(input) {
  const { context, action, afterState, actorId } = input;
  const { primary } = resolveWorkflowKeys(context);
  const entityKind = ENTITY_KIND_BY_ACTION[action.key];
  const entity = resolveEntitySnapshot(context, action.key);
  const entityId = action.aggregateId ?? entity?.id ?? "";
  const definition = getActionDefinition(action.key);
  const beforeState = entity?.status ? canonicalEntityStatus(LIFECYCLE_ENTITY_BY_KIND[entityKind], entity.status) : entity?.status;
  return {
    actionKey: action.key,
    commandType: definition.commandType,
    entityType: entityKind,
    entityId,
    workflowKey: action.workflowKey ?? primary,
    beforeState,
    afterState,
    actorId: actorId ?? context.user.userId ?? null,
    auditAction: AUDIT_ACTION_BY_KEY[action.key],
    notificationType: NOTIFICATION_TYPE_BY_KEY[action.key]
  };
}
function buildWorkflowActionHooks(context, actions, options) {
  return actions.map(
    (action) => buildWorkflowActionHook({
      context,
      action,
      actorId: options?.actorId
    })
  );
}
export {
  COLLABORATION_WORKFLOW_DEFINITIONS,
  HIRING_WORKFLOW,
  MARKETPLACE_WORKFLOW,
  WORKFLOW_ACTION_REGISTRY,
  WORKFLOW_REGISTRY,
  buildWorkflowActionHook,
  buildWorkflowActionHooks,
  canEntityTransition,
  canonicalEntityStatus,
  findAgreedApplicationNegotiation,
  findParticipant,
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
