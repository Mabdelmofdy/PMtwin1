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

// src/registry/aliases/deal.json
var deal_default = {
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
function isEntityType(entityType) {
  return Object.prototype.hasOwnProperty.call(manifest_default.entities, entityType);
}
function getCanonicalStates(entityType) {
  const states = registry.canonicalStates[entityType];
  if (!states) {
    return [];
  }
  return states;
}
function isCanonicalState(entityType, status) {
  if (status == null || status === "") {
    return false;
  }
  const states = registry.canonicalStates[entityType];
  if (!states) {
    return false;
  }
  return states.includes(String(status).toLowerCase());
}
function getLegacyAliases(entityType) {
  return registry.legacyAliases[entityType] ?? Object.freeze({});
}
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

// src/api/get-fsm.js
function getFsm(entityType) {
  if (!isEntityType(entityType)) {
    return null;
  }
  const fsm = transitions_default[entityType];
  if (!fsm) {
    return null;
  }
  const frozenTransitions = {};
  for (const [from, targets] of Object.entries(fsm.transitions)) {
    frozenTransitions[from] = Object.freeze([...targets]);
  }
  return Object.freeze({
    entityType,
    states: getCanonicalStates(entityType),
    terminalStates: Object.freeze([...fsm.terminalStates]),
    transitions: Object.freeze(frozenTransitions)
  });
}
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
function forbiddenTransitions(entityType, fromStatus) {
  const from = toCanonical(entityType, fromStatus);
  if (!from) {
    return Object.freeze([]);
  }
  const allowed = new Set(allowedTransitions(entityType, from));
  return Object.freeze(
    getCanonicalStates(entityType).filter(
      (state) => state !== from && !allowed.has(state)
    )
  );
}
export {
  CANONICAL_STATES,
  ENTITY_TYPES,
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
