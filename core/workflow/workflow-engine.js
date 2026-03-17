/**
 * Centralized Workflow Engine
 * Validates and enforces state transitions for entities: post_match, deal, contract, opportunity.
 */

class WorkflowError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkflowError";
  }
}

class WorkflowValidationError extends WorkflowError {
  constructor(message) {
    super(message);
    this.name = "WorkflowValidationError";
  }
}

class WorkflowTransitionError extends WorkflowError {
  constructor(message, details = {}) {
    super(message);
    this.name = "WorkflowTransitionError";
    this.details = details;
  }
}

const WORKFLOW_RULES = {
  post_match: {
    pending: ["confirmed", "declined", "expired"],
    confirmed: [],
    declined: [],
    expired: []
  },

  deal: {
    negotiating: ["draft"],
    draft: ["review"],
    review: ["signing"],
    signing: ["active"],
    active: ["execution"],
    execution: ["delivery"],
    delivery: ["completed"],
    completed: ["closed"],
    closed: []
  },

  contract: {
    pending: ["active", "terminated"],
    active: ["completed", "terminated"],
    completed: [],
    terminated: []
  },

  opportunity: {
    draft: ["published", "cancelled"],
    published: ["in_negotiation", "closed", "cancelled"],
    in_negotiation: ["contracted"],
    contracted: ["in_execution"],
    in_execution: ["completed"],
    completed: ["closed"],
    closed: [],
    cancelled: []
  }
};

const ENTITY_TYPES = ["post_match", "deal", "contract", "opportunity"];

/**
 * Checks whether a status is defined for the given entity type.
 * @param {string} entityType - One of: post_match, deal, contract, opportunity
 * @param {string} status - Status to check
 * @returns {boolean} True if the status exists in the workflow rules for that entity type
 */
function isValidStatus(entityType, status) {
  if (entityType == null || typeof entityType !== "string" || entityType.trim() === "") {
    return false;
  }
  if (status == null || typeof status !== "string" || status.trim() === "") {
    return false;
  }
  const rules = WORKFLOW_RULES[entityType];
  if (!rules || typeof rules !== "object") {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(rules, status);
}

/**
 * Returns allowed next statuses for a given entity type and current status.
 * @param {string} entityType - One of: post_match, deal, contract, opportunity
 * @param {string} currentStatus - Current status of the entity
 * @returns {string[]} Array of allowed next statuses (empty if terminal state)
 * @throws {Error} If entityType or currentStatus is invalid or unknown
 */
function getAllowedTransitions(entityType, currentStatus) {
  if (entityType == null || typeof entityType !== "string" || entityType.trim() === "") {
    throw new WorkflowValidationError("Workflow: entityType is required and must be a non-empty string.");
  }
  const rules = WORKFLOW_RULES[entityType];
  if (!rules) {
    throw new WorkflowValidationError(`Workflow: unknown entity type "${entityType}". Allowed: ${ENTITY_TYPES.join(", ")}.`);
  }
  if (currentStatus == null || typeof currentStatus !== "string") {
    throw new WorkflowValidationError("Workflow: currentStatus is required and must be a string.");
  }
  if (!isValidStatus(entityType, currentStatus)) {
    throw new WorkflowValidationError(`Workflow: unknown current status "${currentStatus}" for entity type "${entityType}".`);
  }
  const allowed = rules[currentStatus];
  return Array.isArray(allowed) ? [...allowed] : [];
}

/**
 * Validates that a transition from currentStatus to nextStatus is allowed for the entity type.
 * @param {string} entityType - One of: post_match, deal, contract, opportunity
 * @param {string} currentStatus - Current status
 * @param {string} nextStatus - Desired next status
 * @returns {true} If transition is valid
 * @throws {Error} If entityType is unknown or transition is not allowed
 */
function validateTransition(entityType, currentStatus, nextStatus) {
  if (entityType == null || typeof entityType !== "string" || entityType.trim() === "") {
    throw new WorkflowValidationError("Workflow: entityType is required and must be a non-empty string.");
  }
  const rules = WORKFLOW_RULES[entityType];
  if (!rules) {
    throw new WorkflowValidationError(
      `Workflow: unknown entity type "${entityType}". Allowed: post_match, deal, contract, opportunity.`
    );
  }
  if (currentStatus == null || typeof currentStatus !== "string") {
    throw new WorkflowValidationError("Workflow: currentStatus is required and must be a string.");
  }
  if (nextStatus == null || typeof nextStatus !== "string" || nextStatus.trim() === "") {
    throw new WorkflowValidationError("Workflow: nextStatus is required and must be a non-empty string.");
  }
  if (!isValidStatus(entityType, nextStatus)) {
    throw new WorkflowValidationError(
      `Workflow: nextStatus "${nextStatus}" is not a defined status for entity type "${entityType}".`
    );
  }
  const allowed = rules[currentStatus];
  if (allowed === undefined) {
    throw new WorkflowValidationError(`Workflow: unknown current status "${currentStatus}" for entity type "${entityType}".`);
  }
  if (!Array.isArray(allowed) || !allowed.includes(nextStatus)) {
    const allowedStr = Array.isArray(allowed) ? allowed.join(", ") : "none";
    throw new WorkflowTransitionError(
      `Workflow: transition from "${currentStatus}" to "${nextStatus}" is not allowed for "${entityType}". Allowed: [${allowedStr}].`,
      { entityType, currentStatus, nextStatus, allowed: Array.isArray(allowed) ? [...allowed] : [] }
    );
  }
  return true;
}

/**
 * Validates the transition, updates entity.status to nextStatus, and returns the updated entity.
 * Does not mutate the original entity if entity is an object; returns a new object with updated status.
 * @param {string} entityType - One of: post_match, deal, contract, opportunity
 * @param {object} entity - Entity object with at least a status property
 * @param {string} nextStatus - Desired next status
 * @param {{ log?: boolean, logger?: (message: string, data?: object) => void }} [options] - Optional: set log true for console.log, or pass logger for custom logging
 * @returns {object} Entity with status set to nextStatus
 * @throws {Error} If validation fails or entity is invalid
 */
function enforceTransition(entityType, entity, nextStatus, options = {}) {
  if (entity == null || typeof entity !== "object") {
    throw new WorkflowValidationError("Workflow: entity is required and must be an object.");
  }
  const currentStatus = entity.status;
  validateTransition(entityType, currentStatus, nextStatus);

  const shouldLog = options && (options.log === true || typeof options.logger === "function");
  if (shouldLog) {
    const logData = { entityType, currentStatus, nextStatus, entityId: entity.id };
    const message = `Workflow: ${entityType} ${entity.id != null ? `(id: ${entity.id}) ` : ""}${currentStatus} → ${nextStatus}`;
    if (typeof options.logger === "function") {
      options.logger(message, logData);
    } else {
      console.log(message, logData);
    }
  }

  return { ...entity, status: nextStatus };
}

export {
  WorkflowError,
  WorkflowValidationError,
  WorkflowTransitionError,
  validateTransition,
  enforceTransition,
  getAllowedTransitions,
  isValidStatus
};
