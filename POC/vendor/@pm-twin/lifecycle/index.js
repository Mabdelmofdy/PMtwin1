// src/registry/manifest.json
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

// src/registry/aliases/opportunity.json
var opportunity_default = {
  in_negotiation: "negotiating",
  in_execution: "executing",
  closed: "completed"
};

// src/registry/aliases/application.json
var application_default = {
  pending: "submitted",
  in_negotiation: "negotiating"
};

// src/registry/aliases/match.json
var match_default = {
  pending: "discovered"
};

// src/registry/aliases/negotiation.json
var negotiation_default = {
  open: "active",
  counter_offered: "countered",
  failed: "cancelled"
};

// src/registry/aliases/commercial_agreement.json
var commercial_agreement_default = {
  negotiating: "draft",
  active: "executing",
  execution: "executing",
  delivery: "executing",
  closed: "completed"
};

// src/registry/aliases/contract.json
var contract_default = {
  pending: "pending_signature"
};

// src/status-map.js
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
function isEntityType(entityType) {
  const resolvedEntityType = resolveEntityType(entityType);
  return Object.prototype.hasOwnProperty.call(manifest_default.entities, resolvedEntityType);
}
function getCanonicalStates(entityType) {
  const resolvedEntityType = resolveEntityType(entityType);
  const states = registry.canonicalStates[resolvedEntityType];
  if (!states) {
    return [];
  }
  return states;
}
function isCanonicalState(entityType, status) {
  if (status == null || status === "") {
    return false;
  }
  const resolvedEntityType = resolveEntityType(entityType);
  const states = registry.canonicalStates[resolvedEntityType];
  if (!states) {
    return false;
  }
  return states.includes(String(status).toLowerCase());
}
function getLegacyAliases(entityType) {
  const resolvedEntityType = resolveEntityType(entityType);
  return registry.legacyAliases[resolvedEntityType] ?? Object.freeze({});
}
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

// src/registry/transitions.json
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

// src/api/get-fsm.js
function getFsm(entityType) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType;
  if (!isEntityType(resolvedEntityType)) {
    return null;
  }
  const fsm = transitions_default[resolvedEntityType];
  if (!fsm) {
    return null;
  }
  const frozenTransitions = {};
  for (const [from, targets] of Object.entries(fsm.transitions)) {
    frozenTransitions[from] = Object.freeze([...targets]);
  }
  return Object.freeze({
    entityType: resolvedEntityType,
    states: getCanonicalStates(resolvedEntityType),
    terminalStates: Object.freeze([...fsm.terminalStates]),
    transitions: Object.freeze(frozenTransitions)
  });
}
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
function forbiddenTransitions(entityType, fromStatus) {
  const resolvedEntityType = ENTITY_TYPE_LEGACY_ALIASES[entityType] ?? entityType;
  const from = toCanonical(resolvedEntityType, fromStatus);
  if (!from) {
    return Object.freeze([]);
  }
  const allowed = new Set(allowedTransitions(entityType, from));
  return Object.freeze(
    getCanonicalStates(resolvedEntityType).filter(
      (state) => state !== from && !allowed.has(state)
    )
  );
}
export {
  CANONICAL_STATES,
  ENTITY_TYPES,
  ENTITY_TYPE_LEGACY_ALIASES,
  LEGACY_ALIASES,
  MANIFEST,
  allowedTransitions,
  forbiddenTransitions,
  getCanonicalStates,
  getFsm,
  getLegacyAliases,
  isCanonicalState,
  isEntityType,
  isTerminal,
  toCanonical
};
