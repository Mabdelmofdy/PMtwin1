// src/config/defaults.ts
var DEFAULT_VALIDATION_CONFIG = {
  minimumBudget: 1,
  retentionMax: 20,
  maxRetentionPercent: 20,
  vatMax: 100,
  maxVatPercent: 100,
  profitShareMin: 0,
  profitShareMax: 100,
  advancePaymentMaxPercent: 100,
  warningStartWithinHours: 48,
  duplicateSimilarityThreshold: 0.85,
  maxPackageCount: 50,
  titleMaxLength: 150,
  descriptionMaxLength: 2e3,
  skillLevelMinYears: {
    // Creation 3.0 UI levels (StructuredSkillsEditor)
    basic: 0,
    intermediate: 2,
    expert: 5,
    // Legacy aliases
    junior: 0,
    "mid-level": 2,
    mid: 2,
    senior: 5
  }
};
function mergeValidationConfig(override) {
  if (!override) return DEFAULT_VALIDATION_CONFIG;
  return {
    ...DEFAULT_VALIDATION_CONFIG,
    ...override,
    skillLevelMinYears: {
      ...DEFAULT_VALIDATION_CONFIG.skillLevelMinYears,
      ...override.skillLevelMinYears ?? {}
    }
  };
}

// src/rules/codes.ts
var VAL_CODES = {
  FIELD_TITLE_REQUIRED: "VAL_FIELD_TITLE_REQUIRED",
  FIELD_TITLE_TOO_LONG: "VAL_FIELD_TITLE_TOO_LONG",
  FIELD_DESCRIPTION_TOO_LONG: "VAL_FIELD_DESCRIPTION_TOO_LONG",
  FIELD_TARGET_ROLE_REQUIRED: "VAL_FIELD_TARGET_ROLE_REQUIRED",
  FIELD_POSITIVE_NUMBER: "VAL_FIELD_POSITIVE_NUMBER",
  FIELD_PERCENT_RANGE: "VAL_FIELD_PERCENT_RANGE",
  FIELD_ARRAY_EMPTY: "VAL_FIELD_ARRAY_EMPTY",
  DATE_START_IN_PAST: "VAL_DATE_START_IN_PAST",
  DATE_END_BEFORE_START: "VAL_DATE_END_BEFORE_START",
  DATE_DURATION_INVALID: "VAL_DATE_DURATION_INVALID",
  DATE_DELIVERY_AFTER_END: "VAL_DATE_DELIVERY_AFTER_END",
  DATE_START_SOON: "VAL_DATE_START_SOON",
  DATE_DEADLINE_IN_PAST: "VAL_DATE_DEADLINE_IN_PAST",
  DATE_AVAILABILITY_END_IN_PAST: "VAL_DATE_AVAILABILITY_END_IN_PAST",
  DATE_DEADLINE_BEFORE_START: "VAL_DATE_DEADLINE_BEFORE_START",
  DATE_AVAILABILITY_END_BEFORE_START: "VAL_DATE_AVAILABILITY_END_BEFORE_START",
  BUDGET_CASH_REQUIRED: "VAL_BUDGET_CASH_REQUIRED",
  BUDGET_BELOW_MINIMUM: "VAL_BUDGET_BELOW_MINIMUM",
  BUDGET_PROFIT_FIELDS_REQUIRED: "VAL_BUDGET_PROFIT_FIELDS_REQUIRED",
  BUDGET_EQUITY_FIELDS_REQUIRED: "VAL_BUDGET_EQUITY_FIELDS_REQUIRED",
  BUDGET_HYBRID_COMPONENT_REQUIRED: "VAL_BUDGET_HYBRID_COMPONENT_REQUIRED",
  SKILL_REQUIRED_MISSING: "VAL_SKILL_REQUIRED_MISSING",
  SKILL_PROVIDED_MISSING: "VAL_SKILL_PROVIDED_MISSING",
  SKILL_DUPLICATE: "VAL_SKILL_DUPLICATE",
  SKILL_YEARS_NEGATIVE: "VAL_SKILL_YEARS_NEGATIVE",
  SKILL_LEVEL_YEARS_IMPOSSIBLE: "VAL_SKILL_LEVEL_YEARS_IMPOSSIBLE",
  PACKAGE_TITLE_REQUIRED: "VAL_PACKAGE_TITLE_REQUIRED",
  PACKAGE_DESCRIPTION_REQUIRED: "VAL_PACKAGE_DESCRIPTION_REQUIRED",
  PACKAGE_SKILL_REQUIRED: "VAL_PACKAGE_SKILL_REQUIRED",
  PACKAGE_DEADLINE_REQUIRED: "VAL_PACKAGE_DEADLINE_REQUIRED",
  PACKAGE_DEADLINE_AFTER_PROJECT: "VAL_PACKAGE_DEADLINE_AFTER_PROJECT",
  PACKAGE_DUPLICATE_NAME: "VAL_PACKAGE_DUPLICATE_NAME",
  PACKAGE_COUNT_EXCEEDED: "VAL_PACKAGE_COUNT_EXCEEDED",
  COMMERCIAL_RETENTION_RANGE: "VAL_COMMERCIAL_RETENTION_RANGE",
  COMMERCIAL_PROFIT_SHARE_RANGE: "VAL_COMMERCIAL_PROFIT_SHARE_RANGE",
  COMMERCIAL_VAT_RANGE: "VAL_COMMERCIAL_VAT_RANGE",
  COMMERCIAL_ADVANCE_EXCEEDS_BUDGET: "VAL_COMMERCIAL_ADVANCE_EXCEEDS_BUDGET",
  COMMERCIAL_MIN_MAX_CONTRACT: "VAL_COMMERCIAL_MIN_MAX_CONTRACT",
  CAPACITY_REQUIRED_INVALID: "VAL_CAPACITY_REQUIRED_INVALID",
  CAPACITY_AVAILABLE_INVALID: "VAL_CAPACITY_AVAILABLE_INVALID",
  CAPACITY_NEGATIVE: "VAL_CAPACITY_NEGATIVE",
  DOC_CR_REQUIRED: "VAL_DOC_CR_REQUIRED",
  DOC_INSURANCE_REQUIRED: "VAL_DOC_INSURANCE_REQUIRED",
  DOC_PERFORMANCE_BOND_REQUIRED: "VAL_DOC_PERFORMANCE_BOND_REQUIRED",
  DOC_EXPIRED: "VAL_DOC_EXPIRED",
  LOCATION_INCONSISTENT: "VAL_LOCATION_INCONSISTENT",
  LOCATION_ONSITE_REQUIRED: "VAL_LOCATION_ONSITE_REQUIRED",
  DUP_SIMILAR_DRAFT: "VAL_DUP_SIMILAR_DRAFT",
  INTENT_NEED_HAS_AVAILABLE_CAPACITY: "VAL_INTENT_NEED_HAS_AVAILABLE_CAPACITY",
  INTENT_NEED_HAS_PRICING_TABLE: "VAL_INTENT_NEED_HAS_PRICING_TABLE",
  INTENT_OFFER_HAS_REQUIRED_CAPACITY: "VAL_INTENT_OFFER_HAS_REQUIRED_CAPACITY",
  INTENT_OFFER_HAS_MANDATORY_DEADLINE: "VAL_INTENT_OFFER_HAS_MANDATORY_DEADLINE",
  INTENT_OFFER_REQUIRED_BUDGET_NON_CASH: "VAL_INTENT_OFFER_REQUIRED_BUDGET_NON_CASH",
  TAXONOMY_INVALID: "VAL_TAXONOMY_INVALID",
  PUBLISH_PROFILE_INCOMPLETE: "VAL_PUBLISH_PROFILE_INCOMPLETE",
  PUBLISH_VETTING_NOT_APPROVED: "VAL_PUBLISH_VETTING_NOT_APPROVED",
  PUBLISH_READINESS_BELOW_THRESHOLD: "VAL_PUBLISH_READINESS_BELOW_THRESHOLD",
  PUBLISH_FIELD_ERRORS: "VAL_PUBLISH_FIELD_ERRORS",
  PUBLISH_BUSINESS_ERRORS: "VAL_PUBLISH_BUSINESS_ERRORS"
};

// src/messages/catalog.ts
var MESSAGES = {
  [VAL_CODES.FIELD_TITLE_REQUIRED]: "A title is required.",
  [VAL_CODES.FIELD_TITLE_TOO_LONG]: "Title is too long.",
  [VAL_CODES.FIELD_DESCRIPTION_TOO_LONG]: "Description is too long.",
  [VAL_CODES.FIELD_TARGET_ROLE_REQUIRED]: "Target role is required before publishing.",
  [VAL_CODES.FIELD_POSITIVE_NUMBER]: "Value must be a positive number.",
  [VAL_CODES.FIELD_PERCENT_RANGE]: "Percentage must be between 0 and 100.",
  [VAL_CODES.FIELD_ARRAY_EMPTY]: "At least one item is required.",
  [VAL_CODES.DATE_START_IN_PAST]: "Start date cannot be in the past.",
  [VAL_CODES.DATE_END_BEFORE_START]: "End date cannot be before start date.",
  [VAL_CODES.DATE_DURATION_INVALID]: "Duration must be greater than zero.",
  [VAL_CODES.DATE_DELIVERY_AFTER_END]: "Delivery deadline cannot be after the project end date.",
  [VAL_CODES.DATE_START_SOON]: "Start date is within less than 48 hours.",
  [VAL_CODES.DATE_DEADLINE_IN_PAST]: "Deadline cannot be in the past.",
  [VAL_CODES.DATE_AVAILABILITY_END_IN_PAST]: "Availability end date cannot be in the past.",
  [VAL_CODES.DATE_DEADLINE_BEFORE_START]: "Deadline cannot be before Start date.",
  [VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START]: "Availability end date cannot be before Start date.",
  [VAL_CODES.BUDGET_CASH_REQUIRED]: "Budget is required for cash exchange.",
  [VAL_CODES.BUDGET_BELOW_MINIMUM]: "Budget is below the configured minimum.",
  [VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED]: "Profit share percentage, revenue basis, and settlement cycle are required.",
  [VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED]: "Equity percentage, capital contribution, and governance rights are required.",
  [VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED]: "Each selected hybrid component needs complete data.",
  [VAL_CODES.SKILL_REQUIRED_MISSING]: "Add at least one required skill.",
  [VAL_CODES.SKILL_PROVIDED_MISSING]: "Add at least one provided skill.",
  [VAL_CODES.SKILL_DUPLICATE]: "Duplicate skills are not allowed.",
  [VAL_CODES.SKILL_YEARS_NEGATIVE]: "Years of experience cannot be negative.",
  [VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE]: "Experience level and years of experience are inconsistent.",
  [VAL_CODES.PACKAGE_TITLE_REQUIRED]: "Every work package needs a title.",
  [VAL_CODES.PACKAGE_DESCRIPTION_REQUIRED]: "Every work package needs a description.",
  [VAL_CODES.PACKAGE_SKILL_REQUIRED]: "Every work package needs at least one skill.",
  [VAL_CODES.PACKAGE_DEADLINE_REQUIRED]: "Every work package needs a deadline.",
  [VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT]: "Work package deadline cannot be after the project end date.",
  [VAL_CODES.PACKAGE_DUPLICATE_NAME]: "Work package names must be unique.",
  [VAL_CODES.PACKAGE_COUNT_EXCEEDED]: "Too many work packages for the configured limit.",
  [VAL_CODES.COMMERCIAL_RETENTION_RANGE]: "Retention must be between 0% and the configured maximum.",
  [VAL_CODES.COMMERCIAL_PROFIT_SHARE_RANGE]: "Profit share must be within the configured range.",
  [VAL_CODES.COMMERCIAL_VAT_RANGE]: "VAT must be within the configured range.",
  [VAL_CODES.COMMERCIAL_ADVANCE_EXCEEDS_BUDGET]: "Advance payment cannot exceed the budget.",
  [VAL_CODES.COMMERCIAL_MIN_MAX_CONTRACT]: "Minimum contract value cannot exceed maximum contract value.",
  [VAL_CODES.CAPACITY_REQUIRED_INVALID]: "Required capacity must be greater than zero for a need.",
  [VAL_CODES.CAPACITY_AVAILABLE_INVALID]: "Available capacity must be greater than zero for an offer.",
  [VAL_CODES.CAPACITY_NEGATIVE]: "Capacity cannot be negative.",
  [VAL_CODES.DOC_CR_REQUIRED]: "A Commercial Registration (CR) document is required before publishing.",
  [VAL_CODES.DOC_INSURANCE_REQUIRED]: "An insurance document is required before publishing.",
  [VAL_CODES.DOC_PERFORMANCE_BOND_REQUIRED]: "A performance bond is required before publishing.",
  [VAL_CODES.DOC_EXPIRED]: "A mandatory document has expired.",
  [VAL_CODES.LOCATION_INCONSISTENT]: "Location country and city are inconsistent.",
  [VAL_CODES.LOCATION_ONSITE_REQUIRED]: "On-site work requires a location.",
  [VAL_CODES.DUP_SIMILAR_DRAFT]: "A similar draft opportunity already exists.",
  [VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY]: "A need cannot include available capacity.",
  [VAL_CODES.INTENT_NEED_HAS_PRICING_TABLE]: "A need cannot include a pricing table.",
  [VAL_CODES.INTENT_OFFER_HAS_REQUIRED_CAPACITY]: "An offer cannot include required capacity.",
  [VAL_CODES.INTENT_OFFER_HAS_MANDATORY_DEADLINE]: "An offer cannot include a mandatory deadline.",
  [VAL_CODES.INTENT_OFFER_REQUIRED_BUDGET_NON_CASH]: "An offer cannot require budget when exchange mode is not cash.",
  [VAL_CODES.TAXONOMY_INVALID]: "Collaboration model selection is incomplete or inconsistent.",
  [VAL_CODES.PUBLISH_PROFILE_INCOMPLETE]: "Complete your profile before publishing.",
  [VAL_CODES.PUBLISH_VETTING_NOT_APPROVED]: "Vetting must be approved before publishing.",
  [VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD]: "Opportunity readiness must reach the publish threshold.",
  [VAL_CODES.PUBLISH_FIELD_ERRORS]: "Resolve field validation errors before publishing.",
  [VAL_CODES.PUBLISH_BUSINESS_ERRORS]: "Resolve business validation issues before publishing."
};
function messageForCode(code, fallback) {
  return MESSAGES[code] ?? fallback ?? "Please review this field.";
}
function dateMessageForCode(code, intent, fallback) {
  const startLabel = typeof intent === "string" && intent.toLowerCase().trim() === "offer" ? "Availability from" : "Start date";
  switch (code) {
    case VAL_CODES.DATE_START_IN_PAST:
      return `${startLabel} cannot be in the past.`;
    case VAL_CODES.DATE_START_SOON:
      return `${startLabel} is within less than 48 hours.`;
    case VAL_CODES.DATE_DEADLINE_BEFORE_START:
      return `Deadline cannot be before ${startLabel}.`;
    case VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START:
      return `Availability end date cannot be before ${startLabel}.`;
    default:
      return messageForCode(code, fallback);
  }
}
function assertNoCodeInMessage(message, code) {
  return !message.includes(code);
}

// src/engine/run-rules.ts
function normalizeIssues(result) {
  if (result == null) return [];
  if (typeof result === "object" && "length" in result && !("code" in result)) {
    return [...result];
  }
  return [result];
}
function runRules(rules, input, context = {}, options = {}) {
  const config = mergeValidationConfig(context.config);
  const scopes = options.scopes;
  const groups = options.groups;
  const selected = rules.filter((rule) => {
    if (scopes && scopes.length > 0) {
      if (!rule.scope.some((s) => scopes.includes(s))) return false;
    }
    if (groups && groups.length > 0) {
      if (!groups.includes(rule.group)) return false;
    }
    return true;
  });
  const issues = [];
  for (const rule of selected) {
    const produced = rule.execute(input, context, config);
    issues.push(...normalizeIssues(produced));
  }
  return {
    valid: issues.every(
      (i) => i.severity === "valid" || i.severity === "warning"
    ),
    issues
  };
}
function shouldBlockOperation(issues, operationScope) {
  for (const issue of issues) {
    const inScope = issue.scope.includes(operationScope);
    if (!inScope) continue;
    if (issue.severity === "blocker") return true;
    if (issue.severity === "error") return true;
    if (issue.severity === "warning" && issue.blocksPublish && operationScope === "publish") {
      return true;
    }
  }
  return false;
}
function issuesForOperation(issues, operationScope) {
  return issues.filter((i) => i.scope.includes(operationScope));
}
function humanMessages(issues) {
  return issues.map((i) => i.message);
}

// src/validators/primitives.ts
function toNumber(value) {
  if (value === null || value === void 0 || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function todayIso(now) {
  const d = now ?? /* @__PURE__ */ new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseIsoDate(value) {
  if (!hasText(value)) return null;
  const s = String(value).trim();
  const d = new Date(s.includes("T") ? s : `${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function hoursBetween(a, b) {
  return (b.getTime() - a.getTime()) / (1e3 * 60 * 60);
}
function normalizeIntent(intent) {
  if (!intent) return void 0;
  const v = intent.toLowerCase().trim();
  if (v === "request" || v === "need") return "need";
  if (v === "offer") return "offer";
  if (v === "hybrid") return "hybrid";
  return void 0;
}
function normalizeExchangeMode(mode) {
  if (!mode) return void 0;
  return mode.toLowerCase().replace(/-/g, "_").trim();
}
function skillIdentityPart(value) {
  if (typeof value === "string") return value.toLowerCase().trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}
function skillKey(skill) {
  const id = skillIdentityPart(skill.skillId) || skillIdentityPart(skill.name);
  const role = typeof skill.role === "string" ? skill.role.toLowerCase().trim() : "";
  return `${id}::${role}`;
}
function titleSimilarity(a, b) {
  const left = (a ?? "").toLowerCase().trim();
  const right = (b ?? "").toLowerCase().trim();
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;
  const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
  const rightTokens = right.split(/\s+/).filter(Boolean);
  if (rightTokens.length === 0) return 0;
  let overlap = 0;
  for (const t of rightTokens) {
    if (leftTokens.has(t)) overlap += 1;
  }
  return overlap / Math.max(leftTokens.size, rightTokens.length);
}
function getNestedNumber(obj, keys) {
  if (!obj) return null;
  for (const key of keys) {
    if (key in obj) {
      const n = toNumber(obj[key]);
      if (n !== null) return n;
    }
  }
  return null;
}
function getNestedString(obj, keys) {
  if (!obj) return void 0;
  for (const key of keys) {
    const v = obj[key];
    if (hasText(v)) return String(v);
  }
  return void 0;
}
function hasAttachmentNamed(attachments, needle) {
  if (!attachments) return false;
  const n = needle.toLowerCase();
  return attachments.some((a) => {
    const name = typeof a === "string" ? a : a.name;
    return hasText(name) && String(name).toLowerCase().includes(n);
  });
}
function complianceIncludes(requirements, needle) {
  if (!requirements) return false;
  const n = needle.toLowerCase();
  return requirements.some((r) => String(r).toLowerCase().includes(n));
}

// src/field/rules.ts
var DRAFT_UPDATE_PUBLISH = ["draft", "update", "publish"];
var PUBLISH_ONLY = ["publish"];
function fieldIssue(code, fieldPaths, severity = "error", scope = DRAFT_UPDATE_PUBLISH) {
  return {
    code,
    source: "field",
    severity,
    scope,
    fieldPaths,
    message: messageForCode(code),
    layer: "field",
    group: "field"
  };
}
var fieldTitleRequired = {
  id: "field-title-required",
  code: VAL_CODES.FIELD_TITLE_REQUIRED,
  layer: "field",
  source: "field",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ["title"],
  group: "field",
  execute(input) {
    if (hasText(input.title)) return null;
    return fieldIssue(VAL_CODES.FIELD_TITLE_REQUIRED, ["title"]);
  }
};
var fieldTitleLength = {
  id: "field-title-length",
  code: VAL_CODES.FIELD_TITLE_TOO_LONG,
  layer: "field",
  source: "field",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ["title"],
  group: "field",
  execute(input, _ctx, config) {
    if (!hasText(input.title)) return null;
    if (String(input.title).length <= config.titleMaxLength) return null;
    return fieldIssue(VAL_CODES.FIELD_TITLE_TOO_LONG, ["title"]);
  }
};
var fieldDescriptionLength = {
  id: "field-description-length",
  code: VAL_CODES.FIELD_DESCRIPTION_TOO_LONG,
  layer: "field",
  source: "field",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ["description"],
  group: "field",
  execute(input, _ctx, config) {
    if (!hasText(input.description)) return null;
    if (String(input.description).length <= config.descriptionMaxLength) return null;
    return fieldIssue(VAL_CODES.FIELD_DESCRIPTION_TOO_LONG, ["description"]);
  }
};
var fieldTargetRoleRequired = {
  id: "field-target-role-required",
  code: VAL_CODES.FIELD_TARGET_ROLE_REQUIRED,
  layer: "field",
  source: "field",
  severity: "error",
  scope: PUBLISH_ONLY,
  fieldPaths: ["attributes.targetRole"],
  group: "field",
  execute(input) {
    const attributes = input.attributes ?? {};
    const targetRole = attributes.targetRole;
    if (hasText(typeof targetRole === "string" ? targetRole : void 0)) {
      return null;
    }
    return fieldIssue(
      VAL_CODES.FIELD_TARGET_ROLE_REQUIRED,
      ["attributes.targetRole"],
      "error",
      PUBLISH_ONLY
    );
  }
};
var FIELD_RULES = [
  fieldTitleRequired,
  fieldTitleLength,
  fieldDescriptionLength,
  fieldTargetRoleRequired
];

// src/business/dates.ts
var DRAFT_UPDATE_PUBLISH2 = ["draft", "update", "publish"];
function dateIssue(code, fieldPaths, severity, input) {
  return {
    code,
    source: "business",
    severity,
    scope: DRAFT_UPDATE_PUBLISH2,
    fieldPaths,
    message: dateMessageForCode(code, normalizeIntent(input?.intent)),
    layer: "business",
    group: "dates"
  };
}
function resolveDeadline(input) {
  return input.deliveryDeadline || input.tenderDeadline || void 0;
}
var dateStartInPast = {
  id: "date-start-in-past",
  code: VAL_CODES.DATE_START_IN_PAST,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["startDate"],
  group: "dates",
  execute(input, context) {
    if (context.isExistingDraft) return null;
    const start = parseIsoDate(input.startDate);
    if (!start) return null;
    const today = parseIsoDate(context.today ?? todayIso(context.now));
    if (!today) return null;
    if (start.getTime() >= today.getTime()) return null;
    return dateIssue(VAL_CODES.DATE_START_IN_PAST, ["startDate"], "error", input);
  }
};
var dateEndBeforeStart = {
  id: "date-end-before-start",
  code: VAL_CODES.DATE_END_BEFORE_START,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["endDate", "startDate"],
  group: "dates",
  execute(input) {
    const start = parseIsoDate(input.startDate);
    const end = parseIsoDate(input.endDate);
    if (!start || !end) return null;
    if (end.getTime() >= start.getTime()) return null;
    return dateIssue(VAL_CODES.DATE_END_BEFORE_START, ["endDate"], "error", input);
  }
};
var dateDurationInvalid = {
  id: "date-duration-invalid",
  code: VAL_CODES.DATE_DURATION_INVALID,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["duration"],
  group: "dates",
  execute(input) {
    if (input.duration === void 0 || input.duration === "") return null;
    const n = toNumber(input.duration);
    if (n === null) return null;
    if (n > 0) return null;
    return dateIssue(VAL_CODES.DATE_DURATION_INVALID, ["duration"], "error", input);
  }
};
var dateDeliveryAfterEnd = {
  id: "date-delivery-after-end",
  code: VAL_CODES.DATE_DELIVERY_AFTER_END,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["deliveryDeadline", "endDate"],
  group: "dates",
  execute(input) {
    const delivery = parseIsoDate(resolveDeadline(input));
    const end = parseIsoDate(input.endDate);
    if (!delivery || !end) return null;
    if (delivery.getTime() <= end.getTime()) return null;
    return dateIssue(
      VAL_CODES.DATE_DELIVERY_AFTER_END,
      ["deliveryDeadline"],
      "error",
      input
    );
  }
};
var dateStartSoon = {
  id: "date-start-soon",
  code: VAL_CODES.DATE_START_SOON,
  layer: "business",
  source: "business",
  severity: "warning",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["startDate"],
  group: "dates",
  execute(input, context, config) {
    const start = parseIsoDate(input.startDate);
    if (!start) return null;
    const now = context.now ?? /* @__PURE__ */ new Date();
    const hours = hoursBetween(now, start);
    if (hours < 0 || hours >= config.warningStartWithinHours) return null;
    return dateIssue(VAL_CODES.DATE_START_SOON, ["startDate"], "warning", input);
  }
};
var dateDeadlineInPast = {
  id: "date-deadline-in-past",
  code: VAL_CODES.DATE_DEADLINE_IN_PAST,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["tenderDeadline", "deliveryDeadline"],
  group: "dates",
  execute(input, context) {
    if (context.isExistingDraft) return null;
    const deadline = parseIsoDate(resolveDeadline(input));
    if (!deadline) return null;
    const today = parseIsoDate(context.today ?? todayIso(context.now));
    if (!today) return null;
    if (deadline.getTime() >= today.getTime()) return null;
    const path = input.tenderDeadline ? "tenderDeadline" : "deliveryDeadline";
    return dateIssue(VAL_CODES.DATE_DEADLINE_IN_PAST, [path], "error", input);
  }
};
var dateAvailabilityEndInPast = {
  id: "date-availability-end-in-past",
  code: VAL_CODES.DATE_AVAILABILITY_END_IN_PAST,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["availabilityEndDate"],
  group: "dates",
  execute(input, context) {
    if (context.isExistingDraft) return null;
    const end = parseIsoDate(input.availabilityEndDate);
    if (!end) return null;
    const today = parseIsoDate(context.today ?? todayIso(context.now));
    if (!today) return null;
    if (end.getTime() >= today.getTime()) return null;
    return dateIssue(
      VAL_CODES.DATE_AVAILABILITY_END_IN_PAST,
      ["availabilityEndDate"],
      "error",
      input
    );
  }
};
var dateDeadlineBeforeStart = {
  id: "date-deadline-before-start",
  code: VAL_CODES.DATE_DEADLINE_BEFORE_START,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["tenderDeadline", "deliveryDeadline", "startDate"],
  group: "dates",
  execute(input) {
    const start = parseIsoDate(input.startDate);
    const deadline = parseIsoDate(resolveDeadline(input));
    if (!start || !deadline) return null;
    if (deadline.getTime() >= start.getTime()) return null;
    const path = input.tenderDeadline ? "tenderDeadline" : "deliveryDeadline";
    return dateIssue(
      VAL_CODES.DATE_DEADLINE_BEFORE_START,
      [path],
      "error",
      input
    );
  }
};
var dateAvailabilityEndBeforeStart = {
  id: "date-availability-end-before-start",
  code: VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH2,
  fieldPaths: ["availabilityEndDate", "startDate"],
  group: "dates",
  execute(input) {
    const start = parseIsoDate(input.startDate);
    const end = parseIsoDate(input.availabilityEndDate);
    if (!start || !end) return null;
    if (end.getTime() >= start.getTime()) return null;
    return dateIssue(
      VAL_CODES.DATE_AVAILABILITY_END_BEFORE_START,
      ["availabilityEndDate"],
      "error",
      input
    );
  }
};
var DATE_RULES = [
  dateStartInPast,
  dateEndBeforeStart,
  dateDurationInvalid,
  dateDeliveryAfterEnd,
  dateStartSoon,
  dateDeadlineInPast,
  dateAvailabilityEndInPast,
  dateDeadlineBeforeStart,
  dateAvailabilityEndBeforeStart
];

// src/business/budget.ts
var DRAFT_UPDATE_PUBLISH3 = ["draft", "update", "publish"];
var PUBLISH_ONLY2 = ["publish"];
function budgetIssue(code, fieldPaths, scope = DRAFT_UPDATE_PUBLISH3) {
  return {
    code,
    source: "business",
    severity: "error",
    scope,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "budget"
  };
}
function resolveBudget(input) {
  if (input.budget !== void 0) return toNumber(input.budget);
  const direct = getNestedNumber(input.exchangeData, [
    "budget",
    "cashAmount",
    "cashComponent"
  ]);
  if (direct !== null) return direct;
  const range = input.exchangeData?.budgetRange;
  if (range && typeof range === "object") {
    return getNestedNumber(range, ["min", "max"]);
  }
  for (const source of [input.exchangeData, input.collaborationAttributes]) {
    const structure = source?.commercialStructure;
    if (!structure || typeof structure !== "object") continue;
    const components = structure.components;
    if (!Array.isArray(components)) continue;
    const cash = components.find(
      (component) => component !== null && typeof component === "object" && component.type === "cash" && component.enabled !== false
    );
    if (!cash) continue;
    const amount = getNestedNumber(cash, [
      "fixedAmount",
      "maximumAmount",
      "minimumAmount"
    ]);
    if (amount !== null) return amount;
    const fromSchedule = resolveBudgetFromPaymentSchedule(cash.paymentSchedule);
    if (fromSchedule !== null) return fromSchedule;
    const fromNotes = resolveBudgetFromNotes(cash.notes);
    if (fromNotes !== null) return fromNotes;
  }
  return null;
}
function resolveBudgetFromPaymentSchedule(schedule) {
  if (!Array.isArray(schedule)) return null;
  for (const item of schedule) {
    if (!item || typeof item !== "object") continue;
    const amount = toNumber(item.amount);
    if (amount !== null && amount > 0) return amount;
  }
  return null;
}
function resolveBudgetFromNotes(notes) {
  if (!hasText(notes)) return null;
  const match = String(notes).match(/(\d+(?:[.,]\d+)?)/);
  if (!match?.[1]) return null;
  return toNumber(match[1].replace(/,/g, ""));
}
function hasConfiguredCashCommercial(input) {
  for (const source of [input.exchangeData, input.collaborationAttributes]) {
    const structure = source?.commercialStructure;
    if (!structure || typeof structure !== "object") continue;
    const components = structure.components;
    if (!Array.isArray(components)) continue;
    const cash = components.find(
      (component) => component !== null && typeof component === "object" && component.type === "cash" && component.enabled !== false
    );
    if (!cash) continue;
    if (hasText(cash.notes) || hasText(cash.paymentTerms) || hasText(cash.budgetType)) {
      return true;
    }
    if (Array.isArray(cash.paymentSchedule) && cash.paymentSchedule.length > 0) {
      return true;
    }
  }
  return false;
}
var budgetCashRequired = {
  id: "budget-cash-required",
  code: VAL_CODES.BUDGET_CASH_REQUIRED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: PUBLISH_ONLY2,
  fieldPaths: ["budget", "exchangeData.budget"],
  group: "budget",
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode);
    if (mode !== "cash") return null;
    const budget = resolveBudget(input);
    if (budget !== null && budget > 0) return null;
    if (hasConfiguredCashCommercial(input)) return null;
    return budgetIssue(VAL_CODES.BUDGET_CASH_REQUIRED, ["budget"], PUBLISH_ONLY2);
  }
};
var budgetBelowMinimum = {
  id: "budget-below-minimum",
  code: VAL_CODES.BUDGET_BELOW_MINIMUM,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH3,
  fieldPaths: ["budget"],
  group: "budget",
  execute(input, _ctx, config) {
    const mode = normalizeExchangeMode(input.exchangeMode);
    if (mode !== "cash" && mode !== "hybrid") return null;
    const budget = resolveBudget(input);
    if (budget === null) return null;
    if (budget >= config.minimumBudget) return null;
    return budgetIssue(VAL_CODES.BUDGET_BELOW_MINIMUM, ["budget"]);
  }
};
var budgetProfitFieldsRequired = {
  id: "budget-profit-fields",
  code: VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: PUBLISH_ONLY2,
  fieldPaths: ["exchangeData.profitSplit", "exchangeData.calculationBasis"],
  group: "budget",
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode);
    if (mode !== "profit_sharing") return null;
    const data = input.exchangeData;
    const attrs = input.collaborationAttributes;
    const profit = getNestedNumber(data, ["profitSplit", "profitSharePercentage", "profitPercent"]) ?? getNestedNumber(attrs, ["profitSplit", "profitSharePercentage", "profitPercent"]);
    const basis = getNestedString(data, ["calculationBasis", "revenueBasis", "revenueModel"]) ?? getNestedString(attrs, ["calculationBasis", "revenueBasis", "revenueModel"]);
    const cycle = getNestedString(data, ["settlementCycle", "profitDistribution"]) ?? getNestedString(attrs, ["settlementCycle", "profitDistribution"]);
    if (profit !== null && hasText(basis) && hasText(cycle)) return null;
    return budgetIssue(
      VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED,
      ["exchangeData.profitSplit"],
      PUBLISH_ONLY2
    );
  }
};
var budgetEquityFieldsRequired = {
  id: "budget-equity-fields",
  code: VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: PUBLISH_ONLY2,
  fieldPaths: ["exchangeData.equityPercentage"],
  group: "budget",
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode);
    if (mode !== "equity") return null;
    const data = input.exchangeData;
    const attrs = input.collaborationAttributes;
    const equity = getNestedNumber(data, ["equityPercentage", "equitySplit"]) ?? getNestedNumber(attrs, ["equityPercentage", "equitySplit"]);
    const capital = getNestedString(data, ["capitalContribution", "ownershipTerms"]) ?? getNestedString(attrs, ["capitalContribution", "ownershipTerms"]);
    const governance = getNestedString(data, ["governanceRights", "equityStructure"]) ?? getNestedString(attrs, ["governanceRights", "equityStructure"]);
    if (equity !== null && hasText(capital) && hasText(governance)) return null;
    return budgetIssue(
      VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED,
      ["exchangeData.equityPercentage"],
      PUBLISH_ONLY2
    );
  }
};
var budgetHybridComponents = {
  id: "budget-hybrid-components",
  code: VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH3,
  fieldPaths: ["exchangeData"],
  group: "budget",
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode);
    if (mode !== "hybrid") return null;
    const data = input.exchangeData ?? {};
    const cash = getNestedNumber(data, ["cashComponent", "budget", "cashAmount"]);
    const nonCash = getNestedString(data, ["nonCashComponent"]) ?? getNestedNumber(data, ["equityComponent", "profitComponent", "barterComponent"]);
    const hasEquity = getNestedNumber(data, ["equityComponent", "equityPercentage"]) !== null;
    const hasProfit = getNestedNumber(data, ["profitComponent", "profitSplit"]) !== null;
    const hasBarter = hasText(getNestedString(data, ["barterComponent", "barterOffer"]));
    if (cash !== null && cash > 0 && (nonCash !== null && nonCash !== void 0 || hasEquity || hasProfit || hasBarter)) {
      return null;
    }
    const touched = Object.keys(data).some(
      (k) => /cash|equity|profit|barter|hybrid|nonCash/i.test(k)
    );
    if (!touched) return null;
    return budgetIssue(VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED, ["exchangeData"]);
  }
};
var BUDGET_RULES = [
  budgetCashRequired,
  budgetBelowMinimum,
  budgetProfitFieldsRequired,
  budgetEquityFieldsRequired,
  budgetHybridComponents
];

// src/business/skills.ts
var DRAFT_UPDATE_PUBLISH4 = ["draft", "update", "publish"];
var PUBLISH_ONLY3 = ["publish"];
function skillIssue(code, fieldPaths, scope = DRAFT_UPDATE_PUBLISH4) {
  return {
    code,
    source: "business",
    severity: "error",
    scope,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "skills"
  };
}
function coerceScopeSkill(entry, role) {
  if (typeof entry === "string") {
    const name2 = entry.trim();
    if (!name2) return null;
    return { name: name2, role };
  }
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const record = entry;
  const name = hasText(record.name) ? String(record.name).trim() : hasText(record.skillId) ? String(record.skillId).trim() : "";
  if (!name) return null;
  const entryRole = record.role === "provided" || record.role === "required" ? record.role : role;
  return {
    name,
    role: entryRole,
    skillId: hasText(record.skillId) ? String(record.skillId) : void 0,
    level: hasText(record.level) ? String(record.level) : void 0,
    years: toNumber(record.years) ?? toNumber(record.yearsRequired) ?? void 0
  };
}
function coerceScopeSkillList(value, role) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => coerceScopeSkill(entry, role)).filter((skill) => skill != null);
}
function resolveSkills(input) {
  if (input.structuredSkills && input.structuredSkills.length > 0) {
    return input.structuredSkills;
  }
  const intent = normalizeIntent(input.intent);
  const scope = input.scope ?? {};
  const offered = coerceScopeSkillList(scope.offeredSkills, "provided");
  const requiredListed = coerceScopeSkillList(scope.requiredSkills, "required");
  if ((intent === "offer" || intent === "hybrid") && offered.length === 0 && requiredListed.length > 0) {
    return requiredListed.map((skill) => ({
      ...skill,
      role: "provided"
    }));
  }
  return [...requiredListed, ...offered];
}
var skillRequiredMissing = {
  id: "skill-required-missing",
  code: VAL_CODES.SKILL_REQUIRED_MISSING,
  layer: "business",
  source: "business",
  severity: "error",
  scope: PUBLISH_ONLY3,
  fieldPaths: ["structuredSkills"],
  group: "skills",
  execute(input) {
    const intent = normalizeIntent(input.intent);
    if (intent !== "need" && intent !== "hybrid") return null;
    const skills = resolveSkills(input);
    if (skills.length === 0 && !input.structuredSkills) return null;
    const hasRequired = skills.some((s) => s.role === "required");
    if (hasRequired) return null;
    if (skills.length === 0 && input.structuredSkills) {
      return skillIssue(
        VAL_CODES.SKILL_REQUIRED_MISSING,
        ["structuredSkills"],
        PUBLISH_ONLY3
      );
    }
    if (skills.length > 0 && !hasRequired) {
      return skillIssue(
        VAL_CODES.SKILL_REQUIRED_MISSING,
        ["structuredSkills"],
        PUBLISH_ONLY3
      );
    }
    return null;
  }
};
var skillProvidedMissing = {
  id: "skill-provided-missing",
  code: VAL_CODES.SKILL_PROVIDED_MISSING,
  layer: "business",
  source: "business",
  severity: "error",
  scope: PUBLISH_ONLY3,
  fieldPaths: ["structuredSkills"],
  group: "skills",
  execute(input) {
    const intent = normalizeIntent(input.intent);
    if (intent !== "offer" && intent !== "hybrid") return null;
    const skills = resolveSkills(input);
    if (!input.structuredSkills && skills.length === 0) return null;
    const hasProvided = skills.some((s) => s.role === "provided");
    if (hasProvided) return null;
    return skillIssue(
      VAL_CODES.SKILL_PROVIDED_MISSING,
      ["structuredSkills"],
      PUBLISH_ONLY3
    );
  }
};
var skillDuplicate = {
  id: "skill-duplicate",
  code: VAL_CODES.SKILL_DUPLICATE,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH4,
  fieldPaths: ["structuredSkills"],
  group: "skills",
  execute(input) {
    const skills = resolveSkills(input);
    const seen = /* @__PURE__ */ new Set();
    for (const s of skills) {
      const key = skillKey(s);
      if (!key || key === "::required" || key === "::provided") continue;
      if (seen.has(key)) {
        return skillIssue(VAL_CODES.SKILL_DUPLICATE, ["structuredSkills"]);
      }
      seen.add(key);
    }
    return null;
  }
};
var skillYearsNegative = {
  id: "skill-years-negative",
  code: VAL_CODES.SKILL_YEARS_NEGATIVE,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH4,
  fieldPaths: ["structuredSkills.years"],
  group: "skills",
  execute(input) {
    const skills = input.structuredSkills ?? [];
    for (const s of skills) {
      const years = toNumber(s.years);
      if (years !== null && years < 0) {
        return skillIssue(VAL_CODES.SKILL_YEARS_NEGATIVE, ["structuredSkills.years"]);
      }
    }
    return null;
  }
};
var skillLevelYearsImpossible = {
  id: "skill-level-years-impossible",
  code: VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH4,
  fieldPaths: ["structuredSkills"],
  group: "skills",
  execute(input, _ctx, config) {
    const skills = input.structuredSkills ?? [];
    for (const s of skills) {
      if (!s.level) continue;
      const years = toNumber(s.years);
      if (years === null) continue;
      const levelKey = String(s.level).toLowerCase().trim();
      const minYears = config.skillLevelMinYears[levelKey];
      if (minYears === void 0) continue;
      if (years < minYears) {
        return skillIssue(VAL_CODES.SKILL_LEVEL_YEARS_IMPOSSIBLE, [
          "structuredSkills"
        ]);
      }
    }
    return null;
  }
};
var SKILL_RULES = [
  skillRequiredMissing,
  skillProvidedMissing,
  skillDuplicate,
  skillYearsNegative,
  skillLevelYearsImpossible
];

// src/business/work-packages.ts
var DRAFT_UPDATE_PUBLISH5 = ["draft", "update", "publish"];
function packageIssue(code, fieldPaths) {
  return {
    code,
    source: "business",
    severity: "error",
    scope: DRAFT_UPDATE_PUBLISH5,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "workPackages"
  };
}
function packageHasSkills(pkg) {
  if (pkg.skills?.some((skill) => hasText(skill))) return true;
  const required = pkg.requiredSkills;
  if (!required || required.length === 0) return false;
  return required.some((entry) => {
    if (typeof entry === "string") return hasText(entry);
    if (!entry || typeof entry !== "object") return false;
    return hasText(entry.name) || hasText(entry.skillId);
  });
}
var packageFieldsRequired = {
  id: "package-fields-required",
  code: VAL_CODES.PACKAGE_TITLE_REQUIRED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH5,
  fieldPaths: ["workPackages"],
  group: "workPackages",
  execute(input) {
    const packages = input.workPackages;
    if (!packages || packages.length === 0) return null;
    const issues = [];
    packages.forEach((pkg, index) => {
      const base = `workPackages[${index}]`;
      if (!hasText(pkg.title)) {
        issues.push(packageIssue(VAL_CODES.PACKAGE_TITLE_REQUIRED, [`${base}.title`]));
      }
      if (!hasText(pkg.description)) {
        issues.push(
          packageIssue(VAL_CODES.PACKAGE_DESCRIPTION_REQUIRED, [
            `${base}.description`
          ])
        );
      }
      if (!packageHasSkills(pkg)) {
        issues.push(
          packageIssue(VAL_CODES.PACKAGE_SKILL_REQUIRED, [
            `${base}.requiredSkills`,
            `${base}.skills`
          ])
        );
      }
      if (!hasText(pkg.deadline)) {
        issues.push(
          packageIssue(VAL_CODES.PACKAGE_DEADLINE_REQUIRED, [`${base}.deadline`])
        );
      }
    });
    return issues;
  }
};
var packageDeadlineAfterProject = {
  id: "package-deadline-after-project",
  code: VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH5,
  fieldPaths: ["workPackages.deadline", "endDate"],
  group: "workPackages",
  execute(input) {
    const end = parseIsoDate(input.endDate);
    if (!end || !input.workPackages) return null;
    for (let i = 0; i < input.workPackages.length; i++) {
      const deadline = parseIsoDate(input.workPackages[i]?.deadline);
      if (!deadline) continue;
      if (deadline.getTime() > end.getTime()) {
        return packageIssue(VAL_CODES.PACKAGE_DEADLINE_AFTER_PROJECT, [
          `workPackages[${i}].deadline`
        ]);
      }
    }
    return null;
  }
};
var packageDuplicateName = {
  id: "package-duplicate-name",
  code: VAL_CODES.PACKAGE_DUPLICATE_NAME,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH5,
  fieldPaths: ["workPackages.title"],
  group: "workPackages",
  execute(input) {
    const packages = input.workPackages;
    if (!packages) return null;
    const seen = /* @__PURE__ */ new Set();
    for (const pkg of packages) {
      const title = (pkg.title ?? "").toLowerCase().trim();
      if (!title) continue;
      if (seen.has(title)) {
        return packageIssue(VAL_CODES.PACKAGE_DUPLICATE_NAME, ["workPackages.title"]);
      }
      seen.add(title);
    }
    return null;
  }
};
var packageCountExceeded = {
  id: "package-count-exceeded",
  code: VAL_CODES.PACKAGE_COUNT_EXCEEDED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH5,
  fieldPaths: ["workPackages"],
  group: "workPackages",
  execute(input, _ctx, config) {
    if (!input.workPackages || config.maxPackageCount === void 0) return null;
    if (input.workPackages.length <= config.maxPackageCount) return null;
    return packageIssue(VAL_CODES.PACKAGE_COUNT_EXCEEDED, ["workPackages"]);
  }
};
var WORK_PACKAGE_RULES = [
  packageFieldsRequired,
  packageDeadlineAfterProject,
  packageDuplicateName,
  packageCountExceeded
];

// src/business/commercial.ts
var DRAFT_UPDATE_PUBLISH6 = ["draft", "update", "publish"];
function commercialIssue(code, fieldPaths) {
  return {
    code,
    source: "commercial",
    severity: "error",
    scope: DRAFT_UPDATE_PUBLISH6,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "commercial"
  };
}
var commercialRetentionRange = {
  id: "commercial-retention-range",
  code: VAL_CODES.COMMERCIAL_RETENTION_RANGE,
  layer: "business",
  source: "commercial",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH6,
  fieldPaths: ["exchangeData.retention"],
  group: "commercial",
  execute(input, _ctx, config) {
    const retention = getNestedNumber(input.exchangeData, [
      "retention",
      "retentionPercent"
    ]);
    if (retention === null) return null;
    const max = Math.min(config.retentionMax, config.maxRetentionPercent);
    if (retention >= 0 && retention <= max) return null;
    return commercialIssue(VAL_CODES.COMMERCIAL_RETENTION_RANGE, [
      "exchangeData.retention"
    ]);
  }
};
var commercialProfitShareRange = {
  id: "commercial-profit-share-range",
  code: VAL_CODES.COMMERCIAL_PROFIT_SHARE_RANGE,
  layer: "business",
  source: "commercial",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH6,
  fieldPaths: ["exchangeData.profitSplit"],
  group: "commercial",
  execute(input, _ctx, config) {
    const value = getNestedNumber(input.exchangeData, [
      "profitSplit",
      "profitSharePercentage",
      "profitPercent"
    ]) ?? getNestedNumber(input.collaborationAttributes, [
      "profitSplit",
      "profitSharePercentage"
    ]);
    if (value === null) return null;
    if (value >= config.profitShareMin && value <= config.profitShareMax) {
      return null;
    }
    return commercialIssue(VAL_CODES.COMMERCIAL_PROFIT_SHARE_RANGE, [
      "exchangeData.profitSplit"
    ]);
  }
};
var commercialVatRange = {
  id: "commercial-vat-range",
  code: VAL_CODES.COMMERCIAL_VAT_RANGE,
  layer: "business",
  source: "commercial",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH6,
  fieldPaths: ["exchangeData.vat"],
  group: "commercial",
  execute(input, _ctx, config) {
    const vat = getNestedNumber(input.exchangeData, ["vat", "vatPercent", "vatRate"]);
    if (vat === null) return null;
    const max = Math.min(config.vatMax, config.maxVatPercent);
    if (vat >= 0 && vat <= max) return null;
    return commercialIssue(VAL_CODES.COMMERCIAL_VAT_RANGE, ["exchangeData.vat"]);
  }
};
var commercialAdvanceExceedsBudget = {
  id: "commercial-advance-exceeds-budget",
  code: VAL_CODES.COMMERCIAL_ADVANCE_EXCEEDS_BUDGET,
  layer: "business",
  source: "commercial",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH6,
  fieldPaths: ["exchangeData.advancePayment"],
  group: "commercial",
  execute(input, _ctx, config) {
    const advance = getNestedNumber(input.exchangeData, [
      "advancePayment",
      "advance"
    ]);
    if (advance === null) return null;
    const budget = toNumber(input.budget) ?? getNestedNumber(input.exchangeData, ["budget", "cashAmount"]);
    if (budget === null) return null;
    const maxByPercent = budget * config.advancePaymentMaxPercent / 100;
    if (advance <= budget && advance <= maxByPercent) return null;
    return commercialIssue(VAL_CODES.COMMERCIAL_ADVANCE_EXCEEDS_BUDGET, [
      "exchangeData.advancePayment"
    ]);
  }
};
var commercialMinMaxContract = {
  id: "commercial-min-max-contract",
  code: VAL_CODES.COMMERCIAL_MIN_MAX_CONTRACT,
  layer: "business",
  source: "commercial",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH6,
  fieldPaths: ["exchangeData.minContractValue", "exchangeData.maxContractValue"],
  group: "commercial",
  execute(input) {
    const min = getNestedNumber(input.exchangeData, [
      "minContractValue",
      "minimumContractValue"
    ]);
    const max = getNestedNumber(input.exchangeData, [
      "maxContractValue",
      "maximumContractValue"
    ]);
    if (min === null || max === null) return null;
    if (min <= max) return null;
    return commercialIssue(VAL_CODES.COMMERCIAL_MIN_MAX_CONTRACT, [
      "exchangeData.minContractValue"
    ]);
  }
};
var COMMERCIAL_RULES = [
  commercialRetentionRange,
  commercialProfitShareRange,
  commercialVatRange,
  commercialAdvanceExceedsBudget,
  commercialMinMaxContract
];

// src/business/capacity.ts
var DRAFT_UPDATE_PUBLISH7 = ["draft", "update", "publish"];
function capacityIssue(code, fieldPaths) {
  return {
    code,
    source: "business",
    severity: "error",
    scope: DRAFT_UPDATE_PUBLISH7,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "capacity"
  };
}
var capacityNegative = {
  id: "capacity-negative",
  code: VAL_CODES.CAPACITY_NEGATIVE,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH7,
  fieldPaths: ["capacity"],
  group: "capacity",
  execute(input) {
    if (!input.capacity) return null;
    const required = toNumber(input.capacity.required);
    const available = toNumber(input.capacity.available);
    if (required !== null && required < 0 || available !== null && available < 0) {
      return capacityIssue(VAL_CODES.CAPACITY_NEGATIVE, ["capacity"]);
    }
    return null;
  }
};
var capacityRequiredInvalid = {
  id: "capacity-required-invalid",
  code: VAL_CODES.CAPACITY_REQUIRED_INVALID,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH7,
  fieldPaths: ["capacity.required"],
  group: "capacity",
  execute(input) {
    const intent = normalizeIntent(input.intent);
    if (intent !== "need" && intent !== "hybrid") return null;
    if (!input.capacity || input.capacity.required === void 0) return null;
    const required = toNumber(input.capacity.required);
    if (required !== null && required > 0) return null;
    return capacityIssue(VAL_CODES.CAPACITY_REQUIRED_INVALID, ["capacity.required"]);
  }
};
var capacityAvailableInvalid = {
  id: "capacity-available-invalid",
  code: VAL_CODES.CAPACITY_AVAILABLE_INVALID,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH7,
  fieldPaths: ["capacity.available"],
  group: "capacity",
  execute(input) {
    const intent = normalizeIntent(input.intent);
    if (intent !== "offer" && intent !== "hybrid") return null;
    if (!input.capacity || input.capacity.available === void 0) return null;
    const available = toNumber(input.capacity.available);
    if (available !== null && available > 0) return null;
    return capacityIssue(VAL_CODES.CAPACITY_AVAILABLE_INVALID, [
      "capacity.available"
    ]);
  }
};
var CAPACITY_RULES = [
  capacityNegative,
  capacityRequiredInvalid,
  capacityAvailableInvalid
];

// src/business/documents.ts
var PUBLISH_ONLY4 = ["publish"];
function docIssue(code, fieldPaths) {
  return {
    code,
    source: "document",
    severity: "blocker",
    scope: PUBLISH_ONLY4,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "documents"
  };
}
function requiresDoc(requirements, needles) {
  return needles.some((n) => complianceIncludes(requirements, n));
}
var docCrRequired = {
  id: "doc-cr-required",
  code: VAL_CODES.DOC_CR_REQUIRED,
  layer: "business",
  source: "document",
  severity: "blocker",
  scope: PUBLISH_ONLY4,
  fieldPaths: ["attachments", "complianceRequirements"],
  group: "documents",
  execute(input) {
    if (!requiresDoc(input.complianceRequirements, ["cr", "commercial registration"])) {
      return null;
    }
    if (hasAttachmentNamed(input.attachments, "cr")) return null;
    if (hasAttachmentNamed(input.attachments, "commercial registration")) return null;
    return docIssue(VAL_CODES.DOC_CR_REQUIRED, ["attachments"]);
  }
};
var docInsuranceRequired = {
  id: "doc-insurance-required",
  code: VAL_CODES.DOC_INSURANCE_REQUIRED,
  layer: "business",
  source: "document",
  severity: "blocker",
  scope: PUBLISH_ONLY4,
  fieldPaths: ["attachments"],
  group: "documents",
  execute(input) {
    if (!requiresDoc(input.complianceRequirements, ["insurance"])) return null;
    if (hasAttachmentNamed(input.attachments, "insurance")) return null;
    return docIssue(VAL_CODES.DOC_INSURANCE_REQUIRED, ["attachments"]);
  }
};
var docPerformanceBondRequired = {
  id: "doc-performance-bond-required",
  code: VAL_CODES.DOC_PERFORMANCE_BOND_REQUIRED,
  layer: "business",
  source: "document",
  severity: "blocker",
  scope: PUBLISH_ONLY4,
  fieldPaths: ["attachments"],
  group: "documents",
  execute(input) {
    if (!requiresDoc(input.complianceRequirements, [
      "performance bond",
      "performance_bond"
    ])) {
      return null;
    }
    if (hasAttachmentNamed(input.attachments, "performance bond") || hasAttachmentNamed(input.attachments, "performance_bond")) {
      return null;
    }
    return docIssue(VAL_CODES.DOC_PERFORMANCE_BOND_REQUIRED, ["attachments"]);
  }
};
var docExpired = {
  id: "doc-expired",
  code: VAL_CODES.DOC_EXPIRED,
  layer: "business",
  source: "document",
  severity: "blocker",
  scope: PUBLISH_ONLY4,
  fieldPaths: ["attributes.documentExpiresAt"],
  group: "documents",
  execute(input, context) {
    const expiresRaw = input.attributes?.documentExpiresAt;
    const expires = parseIsoDate(expiresRaw);
    if (!expires) return null;
    const today = parseIsoDate(context.today ?? todayIso(context.now));
    if (!today) return null;
    if (expires.getTime() >= today.getTime()) return null;
    return docIssue(VAL_CODES.DOC_EXPIRED, ["attributes.documentExpiresAt"]);
  }
};
var DOCUMENT_RULES = [
  docCrRequired,
  docInsuranceRequired,
  docPerformanceBondRequired,
  docExpired
];

// src/business/location.ts
var DRAFT_UPDATE_PUBLISH8 = ["draft", "update", "publish"];
var INCONSISTENT_PAIRS = [
  ["saudi", "cairo"],
  ["saudi arabia", "cairo"],
  ["ksa", "cairo"],
  ["egypt", "riyadh"],
  ["uae", "riyadh"]
];
function locationIssue(code, fieldPaths) {
  return {
    code,
    source: "business",
    severity: "error",
    scope: DRAFT_UPDATE_PUBLISH8,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "location"
  };
}
function normalizePlace(value) {
  return (value ?? "").toLowerCase().trim();
}
var locationInconsistent = {
  id: "location-inconsistent",
  code: VAL_CODES.LOCATION_INCONSISTENT,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH8,
  fieldPaths: ["country", "city", "location"],
  group: "location",
  execute(input) {
    const country = normalizePlace(input.country ?? input.location);
    const city = normalizePlace(input.city);
    if (!country || !city) return null;
    for (const [c, cityName] of INCONSISTENT_PAIRS) {
      if (country.includes(c) && city.includes(cityName)) {
        return locationIssue(VAL_CODES.LOCATION_INCONSISTENT, ["city"]);
      }
    }
    return null;
  }
};
var locationOnsiteRequired = {
  id: "location-onsite-required",
  code: VAL_CODES.LOCATION_ONSITE_REQUIRED,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH8,
  fieldPaths: ["location", "workMode"],
  group: "location",
  execute(input) {
    const mode = normalizePlace(input.workMode);
    if (!mode.includes("on-site") && !mode.includes("onsite") && mode !== "on site") {
      return null;
    }
    if (hasText(input.location) || hasText(input.country)) return null;
    return locationIssue(VAL_CODES.LOCATION_ONSITE_REQUIRED, ["location"]);
  }
};
var LOCATION_RULES = [
  locationInconsistent,
  locationOnsiteRequired
];

// src/business/duplicates.ts
var DRAFT_UPDATE_PUBLISH9 = ["draft", "update", "publish"];
var duplicateSimilarDraft = {
  id: "duplicate-similar-draft",
  code: VAL_CODES.DUP_SIMILAR_DRAFT,
  layer: "business",
  source: "business",
  severity: "warning",
  scope: DRAFT_UPDATE_PUBLISH9,
  fieldPaths: ["title"],
  group: "duplicates",
  execute(input, context, config) {
    const drafts = context.existingDrafts;
    if (!drafts || drafts.length === 0) return null;
    const owner = input.ownerId ?? input.creatorId;
    for (const draft of drafts) {
      if (input.id && draft.id === input.id) continue;
      const status = (draft.status ?? "draft").toLowerCase();
      if (status !== "draft") continue;
      const draftOwner = draft.ownerId ?? draft.creatorId;
      if (owner && draftOwner && owner !== draftOwner) continue;
      if (input.mainCollaborationModel && draft.mainCollaborationModel && input.mainCollaborationModel !== draft.mainCollaborationModel) {
        continue;
      }
      if (input.subModelType && draft.subModelType && input.subModelType !== draft.subModelType) {
        continue;
      }
      if (input.location && draft.location && input.location.toLowerCase() !== draft.location.toLowerCase()) {
        continue;
      }
      const similarity = titleSimilarity(input.title, draft.title);
      if (similarity >= config.duplicateSimilarityThreshold) {
        const issue = {
          code: VAL_CODES.DUP_SIMILAR_DRAFT,
          source: "business",
          severity: "warning",
          scope: DRAFT_UPDATE_PUBLISH9,
          fieldPaths: ["title"],
          message: messageForCode(VAL_CODES.DUP_SIMILAR_DRAFT),
          layer: "business",
          group: "duplicates"
        };
        return issue;
      }
    }
    return null;
  }
};
var DUPLICATE_RULES = [duplicateSimilarDraft];

// src/business/need-offer.ts
var DRAFT_UPDATE_PUBLISH10 = ["draft", "update", "publish"];
function intentIssue(code, fieldPaths) {
  return {
    code,
    source: "business",
    severity: "error",
    scope: DRAFT_UPDATE_PUBLISH10,
    fieldPaths,
    message: messageForCode(code),
    layer: "business",
    group: "needOffer"
  };
}
var needHasAvailableCapacity = {
  id: "need-has-available-capacity",
  code: VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH10,
  fieldPaths: ["capacity.available"],
  group: "needOffer",
  execute(input) {
    if (normalizeIntent(input.intent) !== "need") return null;
    if (input.capacity?.available === void 0) return null;
    return intentIssue(VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY, [
      "capacity.available"
    ]);
  }
};
var needHasPricingTable = {
  id: "need-has-pricing-table",
  code: VAL_CODES.INTENT_NEED_HAS_PRICING_TABLE,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH10,
  fieldPaths: ["exchangeData.pricingTable"],
  group: "needOffer",
  execute(input) {
    if (normalizeIntent(input.intent) !== "need") return null;
    if (!input.exchangeData || !("pricingTable" in input.exchangeData)) return null;
    if (input.exchangeData.pricingTable == null) return null;
    return intentIssue(VAL_CODES.INTENT_NEED_HAS_PRICING_TABLE, [
      "exchangeData.pricingTable"
    ]);
  }
};
var offerHasRequiredCapacity = {
  id: "offer-has-required-capacity",
  code: VAL_CODES.INTENT_OFFER_HAS_REQUIRED_CAPACITY,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH10,
  fieldPaths: ["capacity.required"],
  group: "needOffer",
  execute(input) {
    if (normalizeIntent(input.intent) !== "offer") return null;
    if (input.capacity?.required === void 0) return null;
    return intentIssue(VAL_CODES.INTENT_OFFER_HAS_REQUIRED_CAPACITY, [
      "capacity.required"
    ]);
  }
};
var offerHasMandatoryDeadline = {
  id: "offer-has-mandatory-deadline",
  code: VAL_CODES.INTENT_OFFER_HAS_MANDATORY_DEADLINE,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH10,
  fieldPaths: ["attributes.mandatoryDeadline"],
  group: "needOffer",
  execute(input) {
    if (normalizeIntent(input.intent) !== "offer") return null;
    if (!input.attributes || !("mandatoryDeadline" in input.attributes)) return null;
    if (input.attributes.mandatoryDeadline == null) return null;
    return intentIssue(VAL_CODES.INTENT_OFFER_HAS_MANDATORY_DEADLINE, [
      "attributes.mandatoryDeadline"
    ]);
  }
};
var offerRequiredBudgetNonCash = {
  id: "offer-required-budget-non-cash",
  code: VAL_CODES.INTENT_OFFER_REQUIRED_BUDGET_NON_CASH,
  layer: "business",
  source: "business",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH10,
  fieldPaths: ["budget"],
  group: "needOffer",
  execute(input) {
    if (normalizeIntent(input.intent) !== "offer") return null;
    const mode = normalizeExchangeMode(input.exchangeMode);
    if (!mode || mode === "cash") return null;
    const requiredBudgetFlag = input.attributes?.requiredBudget;
    const budget = toNumber(input.budget);
    if (requiredBudgetFlag === true || budget !== null && budget > 0 && requiredBudgetFlag !== false) {
      if (requiredBudgetFlag === true) {
        return intentIssue(VAL_CODES.INTENT_OFFER_REQUIRED_BUDGET_NON_CASH, ["budget"]);
      }
    }
    return null;
  }
};
var NEED_OFFER_RULES = [
  needHasAvailableCapacity,
  needHasPricingTable,
  offerHasRequiredCapacity,
  offerHasMandatoryDeadline,
  offerRequiredBudgetNonCash
];

// src/business/taxonomy.ts
var DRAFT_UPDATE_PUBLISH11 = ["draft", "update", "publish"];
var taxonomyInvalid = {
  id: "taxonomy-invalid",
  code: VAL_CODES.TAXONOMY_INVALID,
  layer: "business",
  source: "taxonomy",
  severity: "error",
  scope: DRAFT_UPDATE_PUBLISH11,
  fieldPaths: ["mainCollaborationModel", "subModelType", "exchangeMode"],
  group: "exchange",
  execute(_input, context) {
    if (context.taxonomyValid === false) {
      const detail = context.taxonomyErrors?.[0];
      const issue = {
        code: VAL_CODES.TAXONOMY_INVALID,
        source: "taxonomy",
        severity: "error",
        scope: DRAFT_UPDATE_PUBLISH11,
        fieldPaths: ["mainCollaborationModel", "subModelType", "exchangeMode"],
        message: detail ? messageForCode(VAL_CODES.TAXONOMY_INVALID) : messageForCode(VAL_CODES.TAXONOMY_INVALID),
        layer: "business",
        group: "exchange"
      };
      return issue;
    }
    return null;
  }
};
var TAXONOMY_RULES = [taxonomyInvalid];

// src/business/index.ts
var BUSINESS_RULES = [
  ...DATE_RULES,
  ...BUDGET_RULES,
  ...SKILL_RULES,
  ...WORK_PACKAGE_RULES,
  ...COMMERCIAL_RULES,
  ...CAPACITY_RULES,
  ...DOCUMENT_RULES,
  ...LOCATION_RULES,
  ...DUPLICATE_RULES,
  ...NEED_OFFER_RULES,
  ...TAXONOMY_RULES
];

// src/api/validate-opportunity.ts
var ALL_FIELD_RULES = FIELD_RULES;
var ALL_BUSINESS_RULES = BUSINESS_RULES;
function validateOpportunityFields(input, context = {}, options = {}) {
  const scopes = options.scopes ?? (context.operationScope ? [context.operationScope] : ["draft", "update", "publish"]);
  return runRules(FIELD_RULES, input, context, { ...options, scopes });
}
function validateOpportunityBusiness(input, context = {}, options = {}) {
  const scopes = options.scopes ?? (context.operationScope ? [context.operationScope] : ["draft", "update", "publish"]);
  return runRules(BUSINESS_RULES, input, context, { ...options, scopes });
}
function validateOpportunityDraft(input, context = {}, options = {}) {
  const ctx = { ...context, operationScope: "draft" };
  const field = validateOpportunityFields(input, ctx, {
    ...options,
    scopes: ["draft"]
  });
  const business = validateOpportunityBusiness(input, ctx, {
    ...options,
    scopes: ["draft"]
  });
  return {
    valid: field.valid && business.valid,
    issues: [...field.issues, ...business.issues]
  };
}

// src/publish/evaluate-publish-validation.ts
var PUBLISH_SCOPE = ["publish"];
function publishIssue(code, fieldPaths = []) {
  return {
    code,
    source: "publish",
    severity: "blocker",
    scope: PUBLISH_SCOPE,
    fieldPaths,
    message: messageForCode(code),
    layer: "publish",
    group: "publish"
  };
}
function evaluatePublishValidation(input) {
  const blockingIssues = [];
  const warnings = [];
  const recommendations = [];
  const { publishReadiness, vettingStatus, fieldResult, businessResult } = input;
  if (!publishReadiness.profileReady) {
    blockingIssues.push(publishIssue(VAL_CODES.PUBLISH_PROFILE_INCOMPLETE, ["profile"]));
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_PROFILE_INCOMPLETE));
    for (const item of publishReadiness.missingProfileRequired ?? []) {
      recommendations.push(`Complete profile field: ${item}`);
    }
  }
  if (!vettingStatus.approved) {
    blockingIssues.push(
      publishIssue(VAL_CODES.PUBLISH_VETTING_NOT_APPROVED, ["vetting"])
    );
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_VETTING_NOT_APPROVED));
  }
  if (!publishReadiness.opportunityPublishReady) {
    blockingIssues.push(
      publishIssue(VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD, ["readiness"])
    );
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD));
    for (const item of publishReadiness.missingOpportunityRequired ?? []) {
      recommendations.push(`Complete opportunity field: ${item}`);
    }
  }
  const fieldBlocking = fieldResult.issues.filter(
    (i) => shouldBlockOperation([i], "publish")
  );
  if (fieldBlocking.length > 0) {
    blockingIssues.push(...fieldBlocking);
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_FIELD_ERRORS));
  }
  const businessBlocking = businessResult.issues.filter(
    (i) => shouldBlockOperation([i], "publish")
  );
  if (businessBlocking.length > 0) {
    blockingIssues.push(...businessBlocking);
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_BUSINESS_ERRORS));
  }
  for (const issue of [...fieldResult.issues, ...businessResult.issues]) {
    if (issue.severity === "warning" && !shouldBlockOperation([issue], "publish")) {
      warnings.push(issue);
    }
  }
  const uniqueRecommendations = [...new Set(recommendations)];
  return {
    status: blockingIssues.length === 0 ? "allowed" : "blocked",
    blockingIssues,
    warnings,
    recommendations: uniqueRecommendations
  };
}
function formatPublishValidationMessages(result) {
  return result.blockingIssues.map((i) => i.message);
}
export {
  ALL_BUSINESS_RULES,
  ALL_FIELD_RULES,
  BUSINESS_RULES,
  DEFAULT_VALIDATION_CONFIG,
  FIELD_RULES,
  VAL_CODES,
  assertNoCodeInMessage,
  dateMessageForCode,
  evaluatePublishValidation,
  formatPublishValidationMessages,
  humanMessages,
  issuesForOperation,
  mergeValidationConfig,
  messageForCode,
  parseIsoDate,
  runRules,
  shouldBlockOperation,
  todayIso,
  validateOpportunityBusiness,
  validateOpportunityDraft,
  validateOpportunityFields
};
