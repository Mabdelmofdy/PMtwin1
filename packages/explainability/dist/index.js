// src/types/engine.ts
var ENGINE_ID = {
  PROFILE: "profile",
  VETTING: "vetting",
  OPPORTUNITY: "opportunity",
  READINESS: "readiness",
  MATCHING: "matching",
  NEGOTIATION: "negotiation",
  AGREEMENT: "agreement",
  CONTRACT: "contract",
  COMMERCIAL: "commercial",
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  AI: "ai"
};

// src/types/health.ts
var HEALTH = {
  EXCELLENT: "excellent",
  GOOD: "good",
  WARNING: "warning",
  CRITICAL: "critical"
};

// src/types/severity.ts
var EXPLANATION_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical"
};
var RECOMMENDATION_PRIORITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
};
var TIMELINE_EVENT_STATUS = {
  COMPLETED: "completed",
  ACTIVE: "active",
  PENDING: "pending",
  BLOCKED: "blocked"
};

// src/reason-codes/agreement.ts
var AGREEMENT_REASON_CODES = {
  TERMS_PENDING: "AGREEMENT_TERMS_PENDING",
  COUNTERPARTY_UNRESPONSIVE: "AGREEMENT_COUNTERPARTY_UNRESPONSIVE",
  AWARD_PENDING: "AGREEMENT_AWARD_PENDING"
};

// src/reason-codes/analytics.ts
var ANALYTICS_REASON_CODES = {
  DATA_INSUFFICIENT: "ANALYTICS_DATA_INSUFFICIENT",
  TREND_NEGATIVE: "ANALYTICS_TREND_NEGATIVE",
  FORECAST_LOW_CONFIDENCE: "ANALYTICS_FORECAST_LOW_CONFIDENCE"
};

// src/reason-codes/commercial.ts
var COMMERCIAL_REASON_CODES = {
  APPROVAL_PENDING: "COMMERCIAL_APPROVAL_PENDING",
  PAYMENT_PENDING: "COMMERCIAL_PAYMENT_PENDING",
  VAT_VALIDATION_REQUIRED: "COMMERCIAL_VAT_VALIDATION_REQUIRED"
};

// src/reason-codes/contract.ts
var CONTRACT_REASON_CODES = {
  SIGNATURE_PENDING: "CONTRACT_SIGNATURE_PENDING",
  TERMS_UNRESOLVED: "CONTRACT_TERMS_UNRESOLVED",
  MILESTONE_BLOCKED: "CONTRACT_MILESTONE_BLOCKED"
};

// src/reason-codes/dashboard.ts
var DASHBOARD_REASON_CODES = {
  ACTION_REQUIRED: "DASHBOARD_ACTION_REQUIRED",
  PIPELINE_STALLED: "DASHBOARD_PIPELINE_STALLED",
  DEADLINE_APPROACHING: "DASHBOARD_DEADLINE_APPROACHING"
};

// src/reason-codes/document.ts
var DOCUMENT_REASON_CODES = {
  CR_EXPIRED: "DOCUMENT_CR_EXPIRED",
  VAT_MISSING: "DOCUMENT_VAT_MISSING",
  CERTIFICATE_EXPIRED: "DOCUMENT_CERTIFICATE_EXPIRED",
  LICENSE_MISSING: "DOCUMENT_LICENSE_MISSING",
  INSURANCE_MISSING: "DOCUMENT_INSURANCE_MISSING",
  ZAKAT_CERTIFICATE_MISSING: "DOCUMENT_ZAKAT_CERTIFICATE_MISSING"
};

// src/reason-codes/match.ts
var MATCH_REASON_CODES = {
  SKILL_LOW: "MATCH_SKILL_LOW",
  LOCATION_LOW: "MATCH_LOCATION_LOW",
  VALUE_LOW: "MATCH_VALUE_LOW",
  AVAILABILITY_LOW: "MATCH_AVAILABILITY_LOW",
  CONSTRAINT_BLOCKED: "MATCH_CONSTRAINT_BLOCKED"
};

// src/reason-codes/negotiation.ts
var NEGOTIATION_REASON_CODES = {
  PRICE_GAP: "NEGOTIATION_PRICE_GAP",
  RESPONSE_DELAY: "NEGOTIATION_RESPONSE_DELAY",
  TERMS_MISMATCH: "NEGOTIATION_TERMS_MISMATCH",
  COUNTER_OFFER_PENDING: "NEGOTIATION_COUNTER_OFFER_PENDING"
};

// src/reason-codes/profile.ts
var PROFILE_REASON_CODES = {
  MISSING_PHONE: "PROFILE_MISSING_PHONE",
  MISSING_SKILLS: "PROFILE_MISSING_SKILLS",
  MISSING_ADDRESS: "PROFILE_MISSING_ADDRESS",
  MISSING_AVATAR: "PROFILE_MISSING_AVATAR",
  INCOMPLETE_VERIFICATION: "PROFILE_INCOMPLETE_VERIFICATION",
  MISSING_EXPERIENCE: "PROFILE_MISSING_EXPERIENCE",
  MISSING_CERTIFICATIONS: "PROFILE_MISSING_CERTIFICATIONS"
};

// src/reason-codes/readiness.ts
var READINESS_REASON_CODES = {
  MISSING_BUDGET: "READINESS_MISSING_BUDGET",
  MISSING_TIMELINE: "READINESS_MISSING_TIMELINE",
  MISSING_SCOPE: "READINESS_MISSING_SCOPE",
  PUBLISH_BLOCKED: "READINESS_PUBLISH_BLOCKED",
  SCORE_SUMMARY: "READINESS_SCORE_SUMMARY",
  RECOMMENDED_GAPS: "READINESS_RECOMMENDED_GAPS"
};

// src/reason-codes/vetting.ts
var VETTING_REASON_CODES = {
  BACKGROUND_PENDING: "VETTING_BACKGROUND_PENDING",
  REFERENCE_INCOMPLETE: "VETTING_REFERENCE_INCOMPLETE",
  CREDENTIALS_UNVERIFIED: "VETTING_CREDENTIALS_UNVERIFIED",
  SANCTIONS_CHECK_PENDING: "VETTING_SANCTIONS_CHECK_PENDING"
};

// src/reason-codes/index.ts
var REASON_CODE_PREFIX = {
  PROFILE: "PROFILE_",
  DOCUMENT: "DOCUMENT_",
  READINESS: "READINESS_",
  MATCH: "MATCH_",
  NEGOTIATION: "NEGOTIATION_",
  COMMERCIAL: "COMMERCIAL_",
  CONTRACT: "CONTRACT_",
  VETTING: "VETTING_",
  DASHBOARD: "DASHBOARD_",
  ANALYTICS: "ANALYTICS_",
  AGREEMENT: "AGREEMENT_"
};
var STATIC_REASON_CODES = [
  ...Object.values(PROFILE_REASON_CODES),
  ...Object.values(DOCUMENT_REASON_CODES),
  ...Object.values(READINESS_REASON_CODES),
  ...Object.values(MATCH_REASON_CODES),
  ...Object.values(NEGOTIATION_REASON_CODES),
  ...Object.values(COMMERCIAL_REASON_CODES),
  ...Object.values(CONTRACT_REASON_CODES),
  ...Object.values(VETTING_REASON_CODES),
  ...Object.values(DASHBOARD_REASON_CODES),
  ...Object.values(ANALYTICS_REASON_CODES),
  ...Object.values(AGREEMENT_REASON_CODES)
];
var ALL_REASON_CODES = STATIC_REASON_CODES;
var PREFIXES = Object.values(REASON_CODE_PREFIX);
function isReasonCode(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (STATIC_REASON_CODES.includes(value)) {
    return true;
  }
  return PREFIXES.some((prefix) => value.startsWith(prefix));
}
function assertReasonCode(value) {
  if (!isReasonCode(value)) {
    throw new Error(`Invalid reason code: ${String(value)}`);
  }
  return value;
}

// src/validation/bundle-shape.ts
var HEALTH_VALUES = new Set(Object.values(HEALTH));
var ENGINE_VALUES = new Set(Object.values(ENGINE_ID));
var SEVERITY_VALUES = new Set(Object.values(EXPLANATION_SEVERITY));
var PRIORITY_VALUES = new Set(Object.values(RECOMMENDATION_PRIORITY));
var TIMELINE_STATUS_VALUES = new Set(
  Object.values(TIMELINE_EVENT_STATUS)
);
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function isExplanationMetadata(value) {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.generatedAt === "string" && typeof value.engineVersion === "string" && (value.knowledgeVersion === void 0 || isNumber(value.knowledgeVersion)) && (value.locale === void 0 || typeof value.locale === "string") && (value.source === void 0 || typeof value.source === "string") && (value.tags === void 0 || isStringArray(value.tags)) && (value.extensions === void 0 || isRecord(value.extensions));
}
function isScoreBreakdownEntry(value) {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.label === "string" && isNumber(value.weight) && isNumber(value.score) && isNumber(value.maxScore) && Array.isArray(value.reasonCodes) && value.reasonCodes.every((code) => isReasonCode(code));
}
function isExplanationReason(value) {
  if (!isRecord(value)) {
    return false;
  }
  return isReasonCode(value.code) && typeof value.message === "string" && typeof value.severity === "string" && SEVERITY_VALUES.has(value.severity) && (value.category === void 0 || typeof value.category === "string") && (value.relatedEntityId === void 0 || typeof value.relatedEntityId === "string");
}
function isBlockingFactor(value) {
  if (!isRecord(value)) {
    return false;
  }
  return isReasonCode(value.reasonCode) && typeof value.severity === "string" && SEVERITY_VALUES.has(value.severity) && (value.blockingEntity === void 0 || typeof value.blockingEntity === "string") && (value.resolutionHint === void 0 || typeof value.resolutionHint === "string");
}
function isStrengthWeaknessEntry(value) {
  if (!isRecord(value)) {
    return false;
  }
  return isReasonCode(value.code) && typeof value.label === "string" && (value.impactPercent === void 0 || isNumber(value.impactPercent));
}
function isRecommendation(value) {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.id === "string" && typeof value.label === "string" && isReasonCode(value.reasonCode) && typeof value.priority === "string" && PRIORITY_VALUES.has(value.priority) && isNumber(value.impactPercent) && isNumber(value.estimatedScore) && (value.href === void 0 || typeof value.href === "string") && typeof value.category === "string" && typeof value.severity === "string" && SEVERITY_VALUES.has(value.severity) && (value.metadata === void 0 || isExplanationMetadata(value.metadata));
}
function isTimelineEvent(value) {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.type === "string" && typeof value.title === "string" && typeof value.description === "string" && typeof value.timestamp === "string" && typeof value.status === "string" && TIMELINE_STATUS_VALUES.has(value.status) && (value.relatedEntity === void 0 || typeof value.relatedEntity === "string");
}
function isExplanationBundle(value) {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.engine === "string" && ENGINE_VALUES.has(value.engine) && typeof value.entityId === "string" && isNumber(value.score) && typeof value.health === "string" && HEALTH_VALUES.has(value.health) && typeof value.summary === "string" && Array.isArray(value.scoreBreakdown) && value.scoreBreakdown.every(isScoreBreakdownEntry) && Array.isArray(value.reasons) && value.reasons.every(isExplanationReason) && Array.isArray(value.blockers) && value.blockers.every(isBlockingFactor) && Array.isArray(value.strengths) && value.strengths.every(isStrengthWeaknessEntry) && Array.isArray(value.weaknesses) && value.weaknesses.every(isStrengthWeaknessEntry) && Array.isArray(value.recommendations) && value.recommendations.every(isRecommendation) && Array.isArray(value.timeline) && value.timeline.every(isTimelineEvent) && isExplanationMetadata(value.metadata);
}
var EXPLANATION_BUNDLE_KEYS = [
  "engine",
  "entityId",
  "score",
  "health",
  "summary",
  "scoreBreakdown",
  "reasons",
  "blockers",
  "strengths",
  "weaknesses",
  "recommendations",
  "timeline",
  "metadata"
];

// src/ai/serialization.ts
var AI_EXPLANATION_PAYLOAD_VERSION = "1.0.0";
function serializeExplanationBundle(bundle) {
  return JSON.stringify(bundle);
}
function deserializeExplanationBundle(json) {
  const parsed = JSON.parse(json);
  if (!isExplanationBundle(parsed)) {
    throw new Error("Invalid ExplanationBundle payload");
  }
  return parsed;
}
function toAIExplanationPayload(bundle, serializedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  return {
    version: AI_EXPLANATION_PAYLOAD_VERSION,
    bundle,
    serializedAt
  };
}
function fromAIExplanationPayload(payload) {
  if (payload.version !== AI_EXPLANATION_PAYLOAD_VERSION) {
    throw new Error(
      `Unsupported AI explanation payload version: ${payload.version}`
    );
  }
  if (!isExplanationBundle(payload.bundle)) {
    throw new Error("Invalid ExplanationBundle in AIExplanationPayload");
  }
  return payload.bundle;
}
function serializeAIExplanationPayload(payload) {
  return JSON.stringify(payload);
}
function deserializeAIExplanationPayload(json) {
  const parsed = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null || !("version" in parsed) || !("bundle" in parsed) || !("serializedAt" in parsed)) {
    throw new Error("Invalid AIExplanationPayload shape");
  }
  const candidate = parsed;
  if (!isExplanationBundle(candidate.bundle)) {
    throw new Error("Invalid ExplanationBundle in AIExplanationPayload");
  }
  return candidate;
}
export {
  AGREEMENT_REASON_CODES,
  AI_EXPLANATION_PAYLOAD_VERSION,
  ALL_REASON_CODES,
  ANALYTICS_REASON_CODES,
  COMMERCIAL_REASON_CODES,
  CONTRACT_REASON_CODES,
  DASHBOARD_REASON_CODES,
  DOCUMENT_REASON_CODES,
  ENGINE_ID,
  EXPLANATION_BUNDLE_KEYS,
  EXPLANATION_SEVERITY,
  HEALTH,
  MATCH_REASON_CODES,
  NEGOTIATION_REASON_CODES,
  PROFILE_REASON_CODES,
  READINESS_REASON_CODES,
  REASON_CODE_PREFIX,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
  VETTING_REASON_CODES,
  assertReasonCode,
  deserializeAIExplanationPayload,
  deserializeExplanationBundle,
  fromAIExplanationPayload,
  isExplanationBundle,
  isReasonCode,
  serializeAIExplanationPayload,
  serializeExplanationBundle,
  toAIExplanationPayload
};
