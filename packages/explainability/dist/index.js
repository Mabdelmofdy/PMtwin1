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
  SCORE_SUMMARY: "AGREEMENT_SCORE_SUMMARY",
  STATUS_DRAFT: "AGREEMENT_STATUS_DRAFT",
  STATUS_REVIEW: "AGREEMENT_STATUS_REVIEW",
  STATUS_SIGNING: "AGREEMENT_STATUS_SIGNING",
  STATUS_EXECUTING: "AGREEMENT_STATUS_EXECUTING",
  STATUS_COMPLETED: "AGREEMENT_STATUS_COMPLETED",
  STATUS_CANCELLED: "AGREEMENT_STATUS_CANCELLED",
  TERMS_PENDING: "AGREEMENT_TERMS_PENDING",
  REVIEW_INCOMPLETE: "AGREEMENT_REVIEW_INCOMPLETE",
  SIGNATURES_PENDING: "AGREEMENT_SIGNATURES_PENDING",
  STAGE_GATE_BLOCKED: "AGREEMENT_STAGE_GATE_BLOCKED",
  CONTRACT_MISSING: "AGREEMENT_CONTRACT_MISSING",
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
  DECISION_PENDING: "COMMERCIAL_DECISION_PENDING",
  PAYMENT_PENDING: "COMMERCIAL_PAYMENT_PENDING",
  VAT_VALIDATION_REQUIRED: "COMMERCIAL_VAT_VALIDATION_REQUIRED",
  AWARD_PENDING: "COMMERCIAL_AWARD_PENDING",
  STAGE_GATE_BLOCKED: "COMMERCIAL_STAGE_GATE_BLOCKED"
};

// src/reason-codes/contract.ts
var CONTRACT_REASON_CODES = {
  SCORE_SUMMARY: "CONTRACT_SCORE_SUMMARY",
  STATUS_DRAFT: "CONTRACT_STATUS_DRAFT",
  STATUS_PENDING_SIGNATURE: "CONTRACT_STATUS_PENDING_SIGNATURE",
  STATUS_ACTIVE: "CONTRACT_STATUS_ACTIVE",
  STATUS_COMPLETED: "CONTRACT_STATUS_COMPLETED",
  STATUS_TERMINATED: "CONTRACT_STATUS_TERMINATED",
  SIGNATURE_PENDING: "CONTRACT_SIGNATURE_PENDING",
  SIGNATURES_INCOMPLETE: "CONTRACT_SIGNATURES_INCOMPLETE",
  ACTIVATION_PENDING: "CONTRACT_ACTIVATION_PENDING",
  COMPLETION_READY: "CONTRACT_COMPLETION_READY",
  TERMINATION_AVAILABLE: "CONTRACT_TERMINATION_AVAILABLE",
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
  CR_MISSING: "DOCUMENT_CR_MISSING",
  VAT_MISSING: "DOCUMENT_VAT_MISSING",
  CERTIFICATE_EXPIRED: "DOCUMENT_CERTIFICATE_EXPIRED",
  LICENSE_MISSING: "DOCUMENT_LICENSE_MISSING",
  INSURANCE_MISSING: "DOCUMENT_INSURANCE_MISSING",
  NATIONAL_ID_MISSING: "DOCUMENT_NATIONAL_ID_MISSING",
  ZAKAT_CERTIFICATE_MISSING: "DOCUMENT_ZAKAT_CERTIFICATE_MISSING"
};

// src/reason-codes/match.ts
var MATCH_REASON_CODES = {
  SKILL_LOW: "MATCH_SKILL_LOW",
  LOCATION_LOW: "MATCH_LOCATION_LOW",
  VALUE_LOW: "MATCH_VALUE_LOW",
  BUDGET_LOW: "MATCH_BUDGET_LOW",
  TIMELINE_LOW: "MATCH_TIMELINE_LOW",
  EXCHANGE_LOW: "MATCH_EXCHANGE_LOW",
  REPUTATION_LOW: "MATCH_REPUTATION_LOW",
  SERVICE_OVERLAP_LOW: "MATCH_SERVICE_OVERLAP_LOW",
  AVAILABILITY_LOW: "MATCH_AVAILABILITY_LOW",
  CONSTRAINT_BLOCKED: "MATCH_CONSTRAINT_BLOCKED",
  HARD_GATE_ROLE_INCOMPATIBLE: "MATCH_HARD_GATE_ROLE_INCOMPATIBLE",
  HARD_GATE_SKILL_MISSING: "MATCH_HARD_GATE_SKILL_MISSING",
  HARD_GATE_SERVICE_OVERLAP_LOW: "MATCH_HARD_GATE_SERVICE_OVERLAP_LOW",
  TIER_TOP: "MATCH_TIER_TOP",
  TIER_GOOD: "MATCH_TIER_GOOD",
  TIER_POSSIBLE: "MATCH_TIER_POSSIBLE",
  SCORE_SUMMARY: "MATCH_SCORE_SUMMARY",
  TOPOLOGY_ONE_WAY: "MATCH_TOPOLOGY_ONE_WAY",
  TOPOLOGY_TWO_WAY: "MATCH_TOPOLOGY_TWO_WAY",
  TOPOLOGY_CONSORTIUM: "MATCH_TOPOLOGY_CONSORTIUM",
  TOPOLOGY_CIRCULAR: "MATCH_TOPOLOGY_CIRCULAR"
};

// src/reason-codes/negotiation.ts
var NEGOTIATION_REASON_CODES = {
  PRICE_GAP: "NEGOTIATION_PRICE_GAP",
  RESPONSE_DELAY: "NEGOTIATION_RESPONSE_DELAY",
  TERMS_MISMATCH: "NEGOTIATION_TERMS_MISMATCH",
  COUNTER_PENDING: "NEGOTIATION_COUNTER_PENDING",
  /** @deprecated Use COUNTER_PENDING — retained for backward compatibility */
  COUNTER_OFFER_PENDING: "NEGOTIATION_COUNTER_PENDING",
  STATUS_ACTIVE: "NEGOTIATION_STATUS_ACTIVE",
  STATUS_COUNTERED: "NEGOTIATION_STATUS_COUNTERED",
  STATUS_AGREED: "NEGOTIATION_STATUS_AGREED",
  STATUS_EXPIRED: "NEGOTIATION_STATUS_EXPIRED",
  STATUS_CANCELLED: "NEGOTIATION_STATUS_CANCELLED",
  CHANGES_REQUESTED: "NEGOTIATION_CHANGES_REQUESTED",
  OFFER_ACCEPTED: "NEGOTIATION_OFFER_ACCEPTED",
  NO_OFFERS: "NEGOTIATION_NO_OFFERS",
  SCORE_SUMMARY: "NEGOTIATION_SCORE_SUMMARY"
};

// src/reason-codes/profile.ts
var PROFILE_REASON_CODES = {
  MISSING_FULL_NAME: "PROFILE_MISSING_FULL_NAME",
  MISSING_ROLE: "PROFILE_MISSING_ROLE",
  MISSING_SKILLS: "PROFILE_MISSING_SKILLS",
  MISSING_SERVICES: "PROFILE_MISSING_SERVICES",
  MISSING_LOCATION: "PROFILE_MISSING_LOCATION",
  MISSING_AVAILABILITY: "PROFILE_MISSING_AVAILABILITY",
  MISSING_PORTFOLIO: "PROFILE_MISSING_PORTFOLIO",
  MISSING_EXPERIENCE: "PROFILE_MISSING_EXPERIENCE",
  MISSING_CERTIFICATIONS: "PROFILE_MISSING_CERTIFICATIONS",
  MISSING_PREVIOUS_PROJECTS: "PROFILE_MISSING_PREVIOUS_PROJECTS",
  MISSING_COMPANY_NAME: "PROFILE_MISSING_COMPANY_NAME",
  MISSING_BUSINESS_CATEGORY: "PROFILE_MISSING_BUSINESS_CATEGORY",
  MISSING_PROJECT_CATEGORIES: "PROFILE_MISSING_PROJECT_CATEGORIES",
  MISSING_CONTACT_PERSON: "PROFILE_MISSING_CONTACT_PERSON",
  MISSING_TEAM_SIZE: "PROFILE_MISSING_TEAM_SIZE",
  MISSING_COVERAGE_AREAS: "PROFILE_MISSING_COVERAGE_AREAS",
  MISSING_FINANCIAL_CAPACITY: "PROFILE_MISSING_FINANCIAL_CAPACITY",
  MISSING_PHONE: "PROFILE_MISSING_PHONE",
  MISSING_ADDRESS: "PROFILE_MISSING_ADDRESS",
  MISSING_AVATAR: "PROFILE_MISSING_AVATAR",
  INCOMPLETE_VERIFICATION: "PROFILE_INCOMPLETE_VERIFICATION",
  COMPLETION_LOCKED: "PROFILE_COMPLETION_LOCKED",
  REQUIRED_COMPLETE: "PROFILE_REQUIRED_COMPLETE",
  RECOMMENDED_COMPLETE: "PROFILE_RECOMMENDED_COMPLETE",
  COMPLETE: "PROFILE_COMPLETE",
  SCORE_SUMMARY: "PROFILE_SCORE_SUMMARY"
};

// src/reason-codes/readiness.ts
var READINESS_REASON_CODES = {
  MISSING_TITLE: "READINESS_MISSING_TITLE",
  MISSING_INTENT: "READINESS_MISSING_INTENT",
  MISSING_CATEGORY_PROFESSION: "READINESS_MISSING_CATEGORY_PROFESSION",
  MISSING_ROLE_INTENT: "READINESS_MISSING_ROLE_INTENT",
  MISSING_SKILLS_INTENT: "READINESS_MISSING_SKILLS_INTENT",
  MISSING_SERVICES_INTENT: "READINESS_MISSING_SERVICES_INTENT",
  MISSING_LOCATION: "READINESS_MISSING_LOCATION",
  MISSING_TIMELINE: "READINESS_MISSING_TIMELINE",
  MISSING_COLLABORATION_MODEL: "READINESS_MISSING_COLLABORATION_MODEL",
  MISSING_DESCRIPTION_SCOPE: "READINESS_MISSING_DESCRIPTION_SCOPE",
  MISSING_BUDGET: "READINESS_MISSING_BUDGET",
  MISSING_BUDGET_VALUE_TERMS: "READINESS_MISSING_BUDGET_VALUE_TERMS",
  MISSING_PREFERRED_PARTNER_TYPE: "READINESS_MISSING_PREFERRED_PARTNER_TYPE",
  MISSING_ATTACHMENTS: "READINESS_MISSING_ATTACHMENTS",
  MISSING_COMPLIANCE: "READINESS_MISSING_COMPLIANCE",
  MISSING_DELIVERY_MILESTONES: "READINESS_MISSING_DELIVERY_MILESTONES",
  MISSING_SCOPE: "READINESS_MISSING_SCOPE",
  PUBLISH_BLOCKED: "READINESS_PUBLISH_BLOCKED",
  PUBLISH_READY: "READINESS_PUBLISH_READY",
  REQUIRED_COMPLETE: "READINESS_REQUIRED_COMPLETE",
  RECOMMENDED_COMPLETE: "READINESS_RECOMMENDED_COMPLETE",
  SCORE_SUMMARY: "READINESS_SCORE_SUMMARY",
  RECOMMENDED_GAPS: "READINESS_RECOMMENDED_GAPS",
  COMPLETE: "READINESS_COMPLETE"
};

// src/reason-codes/knowledge.ts
var KNOWLEDGE_REASON_CODES = {
  EDUCATIONAL_HINT: "KNOWLEDGE_EDUCATIONAL_HINT",
  RISK_HINT: "KNOWLEDGE_RISK_HINT",
  COMPLIANCE_HINT: "KNOWLEDGE_COMPLIANCE_HINT",
  LIFECYCLE_HINT: "KNOWLEDGE_LIFECYCLE_HINT",
  FIELD_GUIDANCE: "KNOWLEDGE_FIELD_GUIDANCE"
};

// src/reason-codes/vetting.ts
var VETTING_REASON_CODES = {
  BACKGROUND_PENDING: "VETTING_BACKGROUND_PENDING",
  REFERENCE_INCOMPLETE: "VETTING_REFERENCE_INCOMPLETE",
  CREDENTIALS_UNVERIFIED: "VETTING_CREDENTIALS_UNVERIFIED",
  SANCTIONS_CHECK_PENDING: "VETTING_SANCTIONS_CHECK_PENDING",
  ACTIVE: "VETTING_ACTIVE",
  DOCUMENTS_COMPLETE: "VETTING_DOCUMENTS_COMPLETE",
  REVIEW_PENDING: "VETTING_REVIEW_PENDING",
  REVIEW_NOT_STARTED: "VETTING_REVIEW_NOT_STARTED",
  REVIEW_IN_PROGRESS: "VETTING_REVIEW_IN_PROGRESS",
  REVIEW_CHANGES_REQUESTED: "VETTING_REVIEW_CHANGES_REQUESTED",
  REVIEW_APPROVED: "VETTING_REVIEW_APPROVED",
  COMPLETE: "VETTING_COMPLETE",
  SCORE_SUMMARY: "VETTING_SCORE_SUMMARY"
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
  AGREEMENT: "AGREEMENT_",
  KNOWLEDGE: "KNOWLEDGE_"
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
  ...Object.values(AGREEMENT_REASON_CODES),
  ...Object.values(KNOWLEDGE_REASON_CODES)
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

// src/adapters/profile-field-map.ts
var PROFILE_FIELD_LABEL_TO_REASON_CODE = {
  "Full Name": PROFILE_REASON_CODES.MISSING_FULL_NAME,
  Role: PROFILE_REASON_CODES.MISSING_ROLE,
  Skills: PROFILE_REASON_CODES.MISSING_SKILLS,
  Services: PROFILE_REASON_CODES.MISSING_SERVICES,
  Location: PROFILE_REASON_CODES.MISSING_LOCATION,
  Availability: PROFILE_REASON_CODES.MISSING_AVAILABILITY,
  Portfolio: PROFILE_REASON_CODES.MISSING_PORTFOLIO,
  Experience: PROFILE_REASON_CODES.MISSING_EXPERIENCE,
  Certifications: PROFILE_REASON_CODES.MISSING_CERTIFICATIONS,
  "Previous Projects": PROFILE_REASON_CODES.MISSING_PREVIOUS_PROJECTS,
  "Company Name": PROFILE_REASON_CODES.MISSING_COMPANY_NAME,
  "Business Category": PROFILE_REASON_CODES.MISSING_BUSINESS_CATEGORY,
  "Project Categories": PROFILE_REASON_CODES.MISSING_PROJECT_CATEGORIES,
  "Contact Person": PROFILE_REASON_CODES.MISSING_CONTACT_PERSON,
  "Team Size": PROFILE_REASON_CODES.MISSING_TEAM_SIZE,
  "Coverage Areas": PROFILE_REASON_CODES.MISSING_COVERAGE_AREAS,
  "Financial Capacity": PROFILE_REASON_CODES.MISSING_FINANCIAL_CAPACITY
};
var PROFILE_FIELD_HREF_SLUG = {
  "Full Name": "fullName",
  Role: "role",
  Skills: "skills",
  Services: "services",
  Location: "location",
  Availability: "availability",
  Portfolio: "portfolio",
  Experience: "experience",
  Certifications: "certifications",
  "Previous Projects": "previousProjects",
  "Company Name": "companyName",
  "Business Category": "businessCategory",
  "Project Categories": "projectCategories",
  "Contact Person": "contactPerson",
  "Team Size": "teamSize",
  "Coverage Areas": "coverageAreas",
  "Financial Capacity": "financialCapacity"
};
function toParameterizedCode(label) {
  const slug = label.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  return `PROFILE_MISSING_${slug}`;
}
function profileFieldLabelToReasonCode(label) {
  return PROFILE_FIELD_LABEL_TO_REASON_CODE[label] ?? toParameterizedCode(label);
}
function profileFieldLabelToHref(label) {
  const slug = PROFILE_FIELD_HREF_SLUG[label] ?? label.toLowerCase().replace(/\s+/g, "-");
  return `/profile/edit#${slug}`;
}

// src/adapters/profile-adapter.ts
var PROFILE_ADAPTER_VERSION = "1.0.0";
var PROFILE_ADAPTER_SCORE_WEIGHTS = {
  required: 70,
  recommended: 30
};
function roundScore(value) {
  return Math.round(value * 100) / 100;
}
function resolveGeneratedAt(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function resolveHealth(status) {
  if (status === "ready_for_matching") {
    return HEALTH.EXCELLENT;
  }
  if (status === "needs_review") {
    return HEALTH.WARNING;
  }
  return HEALTH.CRITICAL;
}
function countPresent(total, missingCount) {
  return Math.max(0, total - missingCount);
}
function requiredImpactPercent(input) {
  if (input.requiredTotal === 0) return 0;
  return roundScore(PROFILE_ADAPTER_SCORE_WEIGHTS.required / input.requiredTotal);
}
function recommendedImpactPercent(input) {
  if (input.recommendedTotal === 0) return 0;
  return roundScore(
    PROFILE_ADAPTER_SCORE_WEIGHTS.recommended / input.recommendedTotal
  );
}
function buildSummary(input) {
  if (input.completionLocked) {
    return "Profile completion is locked \u2014 unlock and complete required fields to proceed.";
  }
  if (input.status === "ready_for_matching") {
    return "Profile is complete and ready for matching.";
  }
  if (input.status === "needs_review") {
    const gapCount = input.missingRequired.length + input.missingRecommended.length;
    return `Profile is partially complete \u2014 ${gapCount} field${gapCount === 1 ? "" : "s"} still need attention.`;
  }
  return "Profile is incomplete \u2014 complete required fields to improve matching readiness.";
}
function buildReasons(input) {
  const reasons = [];
  if (input.completionLocked) {
    reasons.push({
      code: PROFILE_REASON_CODES.COMPLETION_LOCKED,
      message: "Profile completion is locked until verification is finished.",
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: "verification"
    });
  }
  for (const label of input.missingRequired) {
    reasons.push({
      code: profileFieldLabelToReasonCode(label),
      message: `Required field missing: ${label}.`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: "required",
      relatedEntityId: input.entityId
    });
  }
  for (const label of input.missingRecommended) {
    reasons.push({
      code: profileFieldLabelToReasonCode(label),
      message: `Recommended field missing: ${label}.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "recommended",
      relatedEntityId: input.entityId
    });
  }
  if (reasons.length === 0) {
    reasons.push({
      code: PROFILE_REASON_CODES.COMPLETE,
      message: "All profile fields are complete.",
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary"
    });
  }
  return reasons;
}
function buildBlockers(input) {
  const blockers = [];
  if (input.completionLocked) {
    blockers.push({
      reasonCode: PROFILE_REASON_CODES.COMPLETION_LOCKED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Complete identity verification to unlock profile editing."
    });
    return blockers;
  }
  for (const label of input.missingRequired) {
    blockers.push({
      reasonCode: profileFieldLabelToReasonCode(label),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: `Add ${label} to meet matching readiness requirements.`
    });
  }
  return blockers;
}
function buildStrengths(input) {
  const strengths = [];
  const requiredPresent = countPresent(
    input.requiredTotal,
    input.missingRequired.length
  );
  if (requiredPresent === input.requiredTotal && input.requiredTotal > 0) {
    strengths.push({
      code: PROFILE_REASON_CODES.REQUIRED_COMPLETE,
      label: "All required fields complete",
      impactPercent: PROFILE_ADAPTER_SCORE_WEIGHTS.required
    });
  }
  const recommendedPresent = countPresent(
    input.recommendedTotal,
    input.missingRecommended.length
  );
  if (recommendedPresent === input.recommendedTotal && input.recommendedTotal > 0) {
    strengths.push({
      code: PROFILE_REASON_CODES.RECOMMENDED_COMPLETE,
      label: "All recommended fields complete",
      impactPercent: PROFILE_ADAPTER_SCORE_WEIGHTS.recommended
    });
  }
  if (input.status === "ready_for_matching") {
    strengths.push({
      code: PROFILE_REASON_CODES.COMPLETE,
      label: "Profile ready for matching",
      impactPercent: 100
    });
  }
  return strengths;
}
function buildWeaknesses(input) {
  const weaknesses = [];
  for (const label of input.missingRequired) {
    weaknesses.push({
      code: profileFieldLabelToReasonCode(label),
      label,
      impactPercent: requiredImpactPercent(input)
    });
  }
  for (const label of input.missingRecommended) {
    weaknesses.push({
      code: profileFieldLabelToReasonCode(label),
      label,
      impactPercent: recommendedImpactPercent(input)
    });
  }
  return weaknesses;
}
function recommendationPriority(isRequired, status) {
  if (isRequired) {
    return status === "incomplete" ? RECOMMENDATION_PRIORITY.CRITICAL : RECOMMENDATION_PRIORITY.HIGH;
  }
  return RECOMMENDATION_PRIORITY.MEDIUM;
}
function buildRecommendationEntry(input, label, isRequired, index) {
  const impactPercent = isRequired ? requiredImpactPercent(input) : recommendedImpactPercent(input);
  const reasonCode = profileFieldLabelToReasonCode(label);
  const slug = reasonCode.replace("PROFILE_MISSING_", "").toLowerCase();
  return {
    id: `profile-rec-${slug}-${index}`,
    label: `Complete ${label}`,
    reasonCode,
    priority: recommendationPriority(isRequired, input.status),
    impactPercent,
    estimatedScore: roundScore(Math.min(100, input.score + impactPercent)),
    href: profileFieldLabelToHref(label),
    category: isRequired ? "required" : "recommended",
    severity: isRequired ? EXPLANATION_SEVERITY.CRITICAL : EXPLANATION_SEVERITY.WARNING
  };
}
function buildRecommendationsFromSnapshot(input) {
  const recommendations = [];
  let index = 0;
  for (const label of input.missingRequired) {
    recommendations.push(buildRecommendationEntry(input, label, true, index));
    index += 1;
  }
  for (const label of input.missingRecommended) {
    recommendations.push(buildRecommendationEntry(input, label, false, index));
    index += 1;
  }
  return recommendations;
}
function buildBreakdownFromSnapshot(input) {
  const requiredPresent = countPresent(
    input.requiredTotal,
    input.missingRequired.length
  );
  const recommendedPresent = countPresent(
    input.recommendedTotal,
    input.missingRecommended.length
  );
  const requiredRatio = input.requiredTotal === 0 ? 1 : requiredPresent / input.requiredTotal;
  const recommendedRatio = input.recommendedTotal === 0 ? 1 : recommendedPresent / input.recommendedTotal;
  return [
    {
      label: "Required fields",
      weight: PROFILE_ADAPTER_SCORE_WEIGHTS.required,
      score: roundScore(requiredRatio * PROFILE_ADAPTER_SCORE_WEIGHTS.required),
      maxScore: PROFILE_ADAPTER_SCORE_WEIGHTS.required,
      reasonCodes: input.missingRequired.map(profileFieldLabelToReasonCode)
    },
    {
      label: "Recommended fields",
      weight: PROFILE_ADAPTER_SCORE_WEIGHTS.recommended,
      score: roundScore(
        recommendedRatio * PROFILE_ADAPTER_SCORE_WEIGHTS.recommended
      ),
      maxScore: PROFILE_ADAPTER_SCORE_WEIGHTS.recommended,
      reasonCodes: input.missingRecommended.map(profileFieldLabelToReasonCode)
    }
  ];
}
function buildTimelineFromSnapshot(input) {
  const events = [];
  if (input.createdAt) {
    events.push({
      type: "profile-created",
      title: "Profile created",
      description: `${input.profileKind === "company" ? "Company" : "Individual"} profile record created.`,
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  events.push({
    type: "profile-evaluated",
    title: "Profile readiness evaluated",
    description: buildSummary(input),
    timestamp: resolveGeneratedAt(input),
    status: input.status === "ready_for_matching" ? TIMELINE_EVENT_STATUS.COMPLETED : input.status === "needs_review" ? TIMELINE_EVENT_STATUS.ACTIVE : TIMELINE_EVENT_STATUS.BLOCKED,
    relatedEntity: input.entityId
  });
  return events;
}
function buildProfileExplanation(input) {
  const generatedAt = resolveGeneratedAt(input);
  return {
    engine: ENGINE_ID.PROFILE,
    entityId: input.entityId,
    score: input.score,
    health: resolveHealth(input.status),
    summary: buildSummary(input),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: PROFILE_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: "profile-readiness-adapter",
      tags: [input.profileKind, input.status],
      extensions: {
        profileKind: input.profileKind,
        readinessStatus: input.status,
        completionLocked: input.completionLocked ?? false
      }
    }
  };
}
var profileExplainabilityAdapter = {
  buildExplanation: buildProfileExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot,
  buildBreakdown: buildBreakdownFromSnapshot,
  buildTimeline: buildTimelineFromSnapshot
};

// src/adapters/vetting-field-map.ts
var VETTING_DOCUMENT_LABEL_TO_REASON_CODE = {
  "Document: Commercial Registration": DOCUMENT_REASON_CODES.CR_MISSING,
  "Document: VAT Certificate": DOCUMENT_REASON_CODES.VAT_MISSING,
  "Document: Insurance Certificate": DOCUMENT_REASON_CODES.INSURANCE_MISSING,
  "Document: License": DOCUMENT_REASON_CODES.LICENSE_MISSING,
  "Document: National ID": DOCUMENT_REASON_CODES.NATIONAL_ID_MISSING
};
var VETTING_DOCUMENT_TYPE_TO_REASON_CODE = {
  commercial_registration: DOCUMENT_REASON_CODES.CR_MISSING,
  vat_certificate: DOCUMENT_REASON_CODES.VAT_MISSING,
  insurance_certificate: DOCUMENT_REASON_CODES.INSURANCE_MISSING,
  license: DOCUMENT_REASON_CODES.LICENSE_MISSING,
  national_id: DOCUMENT_REASON_CODES.NATIONAL_ID_MISSING
};
var VETTING_DOCUMENT_TYPE_HREF_SLUG = {
  commercial_registration: "commercial_registration",
  vat_certificate: "vat_certificate",
  insurance_certificate: "insurance_certificate",
  license: "license",
  national_id: "national_id"
};
var VETTING_REVIEW_GAP_LABEL_TO_REASON_CODE = {
  "Start admin review": VETTING_REASON_CODES.REVIEW_NOT_STARTED,
  "Resolve requested changes and resubmit": VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED
};
var VETTING_REVIEW_PROGRESS_TO_REASON_CODE = {
  not_started: VETTING_REASON_CODES.REVIEW_NOT_STARTED,
  in_review: VETTING_REASON_CODES.REVIEW_IN_PROGRESS,
  changes_requested: VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
  approved: VETTING_REASON_CODES.REVIEW_APPROVED
};
function toParameterizedDocumentCode(label) {
  const slug = label.replace(/^Document:\s*/i, "").trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  return `DOCUMENT_${slug}_MISSING`;
}
function vettingDocumentLabelToReasonCode(label) {
  return VETTING_DOCUMENT_LABEL_TO_REASON_CODE[label] ?? toParameterizedDocumentCode(label);
}
function vettingDocumentTypeToReasonCode(type) {
  const normalized = type.trim().toLowerCase().replace(/\s+/g, "_");
  return VETTING_DOCUMENT_TYPE_TO_REASON_CODE[normalized] ?? `DOCUMENT_${normalized.toUpperCase()}_MISSING`;
}
function vettingReviewGapLabelToReasonCode(label) {
  return VETTING_REVIEW_GAP_LABEL_TO_REASON_CODE[label] ?? VETTING_REASON_CODES.REVIEW_PENDING;
}
function vettingReviewProgressToReasonCode(progress) {
  return VETTING_REVIEW_PROGRESS_TO_REASON_CODE[progress];
}
function vettingDocumentLabelToHref(label) {
  for (const [documentLabel, code] of Object.entries(
    VETTING_DOCUMENT_LABEL_TO_REASON_CODE
  )) {
    if (documentLabel === label) {
      const type = Object.entries(VETTING_DOCUMENT_TYPE_TO_REASON_CODE).find(
        ([, reasonCode]) => reasonCode === code
      )?.[0];
      if (type) {
        return `/vetting/documents#${VETTING_DOCUMENT_TYPE_HREF_SLUG[type] ?? type}`;
      }
    }
  }
  const slug = label.replace(/^Document:\s*/i, "").trim().toLowerCase().replace(/\s+/g, "_");
  return `/vetting/documents#${slug}`;
}
function vettingDocumentTypeToHref(type) {
  const normalized = type.trim().toLowerCase().replace(/\s+/g, "_");
  return `/vetting/documents#${VETTING_DOCUMENT_TYPE_HREF_SLUG[normalized] ?? normalized}`;
}
function vettingReviewGapLabelToHref(label) {
  if (label === "Resolve requested changes and resubmit") {
    return "/vetting/review#resubmit";
  }
  return "/vetting/review#start";
}
function isVettingDocumentGapLabel(label) {
  return label.startsWith("Document: ");
}

// src/adapters/vetting-adapter.ts
var VETTING_ADAPTER_VERSION = "1.0.0";
var VETTING_ADAPTER_SCORE_WEIGHTS = {
  documents: 80,
  review: 20
};
var REQUIRED_DOCUMENT_TYPES = [
  "commercial_registration",
  "vat_certificate",
  "insurance_certificate",
  "license",
  "national_id"
];
var DOCUMENT_TYPE_TO_LABEL = {
  commercial_registration: "Document: Commercial Registration",
  vat_certificate: "Document: VAT Certificate",
  insurance_certificate: "Document: Insurance Certificate",
  license: "Document: License",
  national_id: "Document: National ID"
};
function roundScore2(value) {
  return Math.round(value * 100) / 100;
}
function resolveGeneratedAt2(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function isActiveAccount(input) {
  return input.accountStatus === "active";
}
function resolveHealth2(input) {
  if (isActiveAccount(input) || input.status === "ready_for_matching") {
    return HEALTH.EXCELLENT;
  }
  if (input.status === "needs_review") {
    return HEALTH.WARNING;
  }
  return HEALTH.CRITICAL;
}
function scoreDocumentStatus(status) {
  if (!status) return 0;
  switch (status) {
    case "approved":
      return 1;
    case "pending_review":
      return 0.65;
    case "rejected":
      return 0.15;
    case "expired":
    case "replacement_requested":
      return 0.1;
    default:
      return 0;
  }
}
function resolveDocumentStatus(input, type) {
  const entry = input.documents?.find(
    (document) => document.type.trim().toLowerCase().replace(/\s+/g, "_") === type.trim().toLowerCase().replace(/\s+/g, "_")
  );
  return entry?.status;
}
function resolveDocumentTypes(totalRequired) {
  return REQUIRED_DOCUMENT_TYPES.slice(0, totalRequired);
}
function isDocumentMissing(input, type) {
  const label = DOCUMENT_TYPE_TO_LABEL[type];
  if (!label) return true;
  return input.missingRequired.includes(label);
}
function resolveReviewProgressScore(input) {
  if (isActiveAccount(input) || input.reviewProgress === "approved") {
    return 1;
  }
  if (input.reviewProgress === "in_review") {
    return 0.5;
  }
  if (input.reviewProgress === "changes_requested") {
    return input.changesResolved ? 0.45 : 0.2;
  }
  return 0.1;
}
function documentImpactPercent(input) {
  if (input.documentsProgress.totalRequired === 0) return 0;
  return roundScore2(
    VETTING_ADAPTER_SCORE_WEIGHTS.documents / input.documentsProgress.totalRequired
  );
}
function reviewImpactPercent(input) {
  const reviewGaps = input.missingRecommended.length;
  if (reviewGaps === 0) return 0;
  return roundScore2(VETTING_ADAPTER_SCORE_WEIGHTS.review / reviewGaps);
}
function gapToReasonCode(label) {
  if (isVettingDocumentGapLabel(label)) {
    return vettingDocumentLabelToReasonCode(label);
  }
  return vettingReviewGapLabelToReasonCode(label);
}
function buildSummary2(input) {
  if (isActiveAccount(input)) {
    return "Vetting is complete \u2014 account is active and cleared for matching.";
  }
  if (input.status === "ready_for_matching") {
    return "Vetting documents and admin review are complete.";
  }
  if (input.status === "needs_review") {
    const gapCount = input.missingRequired.length + input.missingRecommended.length;
    return `Vetting is partially complete \u2014 ${gapCount} item${gapCount === 1 ? "" : "s"} still need attention.`;
  }
  return "Vetting is incomplete \u2014 upload required documents and complete admin review.";
}
function buildReasons2(input) {
  const reasons = [];
  if (isActiveAccount(input)) {
    reasons.push({
      code: VETTING_REASON_CODES.ACTIVE,
      message: "Account vetting is active and fully cleared.",
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary"
    });
    return reasons;
  }
  for (const label of input.missingRequired) {
    reasons.push({
      code: vettingDocumentLabelToReasonCode(label),
      message: `Required document missing or unapproved: ${label.replace(/^Document:\s*/, "")}.`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: "required",
      relatedEntityId: input.entityId
    });
  }
  for (const label of input.missingRecommended) {
    reasons.push({
      code: vettingReviewGapLabelToReasonCode(label),
      message: `Review action needed: ${label}.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "recommended",
      relatedEntityId: input.entityId
    });
  }
  if (reasons.length === 0) {
    reasons.push({
      code: VETTING_REASON_CODES.COMPLETE,
      message: "All vetting requirements are satisfied.",
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary"
    });
  }
  return reasons;
}
function buildBlockers2(input) {
  if (isActiveAccount(input)) {
    return [];
  }
  const blockers = [];
  for (const label of input.missingRequired) {
    blockers.push({
      reasonCode: vettingDocumentLabelToReasonCode(label),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: `Upload and get approval for ${label.replace(/^Document:\s*/, "")}.`
    });
  }
  for (const label of input.missingRecommended) {
    if (label === "Resolve requested changes and resubmit") {
      blockers.push({
        reasonCode: VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
        severity: EXPLANATION_SEVERITY.CRITICAL,
        blockingEntity: input.entityId,
        resolutionHint: "Address admin feedback and resubmit documents for review."
      });
    }
  }
  return blockers;
}
function buildStrengths2(input) {
  const strengths = [];
  if (isActiveAccount(input)) {
    strengths.push({
      code: VETTING_REASON_CODES.ACTIVE,
      label: "Active vetted account",
      impactPercent: 100
    });
    return strengths;
  }
  if (input.documentsProgress.approvedRequired === input.documentsProgress.totalRequired && input.documentsProgress.totalRequired > 0) {
    strengths.push({
      code: VETTING_REASON_CODES.DOCUMENTS_COMPLETE,
      label: "All required documents approved",
      impactPercent: VETTING_ADAPTER_SCORE_WEIGHTS.documents
    });
  }
  if (input.reviewProgress === "approved") {
    strengths.push({
      code: VETTING_REASON_CODES.REVIEW_APPROVED,
      label: "Admin review approved",
      impactPercent: VETTING_ADAPTER_SCORE_WEIGHTS.review
    });
  }
  if (input.status === "ready_for_matching") {
    strengths.push({
      code: VETTING_REASON_CODES.COMPLETE,
      label: "Vetting ready for matching",
      impactPercent: 100
    });
  }
  return strengths;
}
function buildWeaknesses2(input) {
  const weaknesses = [];
  for (const label of input.missingRequired) {
    weaknesses.push({
      code: vettingDocumentLabelToReasonCode(label),
      label: label.replace(/^Document:\s*/, ""),
      impactPercent: documentImpactPercent(input)
    });
  }
  for (const label of input.missingRecommended) {
    weaknesses.push({
      code: vettingReviewGapLabelToReasonCode(label),
      label,
      impactPercent: reviewImpactPercent(input)
    });
  }
  return weaknesses;
}
function recommendationPriority2(isDocument, label, status) {
  if (isDocument) {
    return status === "incomplete" ? RECOMMENDATION_PRIORITY.CRITICAL : RECOMMENDATION_PRIORITY.HIGH;
  }
  if (label === "Resolve requested changes and resubmit") {
    return RECOMMENDATION_PRIORITY.CRITICAL;
  }
  return RECOMMENDATION_PRIORITY.MEDIUM;
}
function buildRecommendationEntry2(input, label, isDocument, index) {
  const reasonCode = gapToReasonCode(label);
  const impactPercent = isDocument ? documentImpactPercent(input) : reviewImpactPercent(input);
  const slug = isDocument ? reasonCode.replace("DOCUMENT_", "").toLowerCase() : reasonCode.replace("VETTING_", "").toLowerCase();
  return {
    id: `vetting-rec-${slug}-${index}`,
    label: input.recommendations[index] ?? label,
    reasonCode,
    priority: recommendationPriority2(isDocument, label, input.status),
    impactPercent,
    estimatedScore: roundScore2(Math.min(100, input.score + impactPercent)),
    href: isDocument ? vettingDocumentLabelToHref(label) : vettingReviewGapLabelToHref(label),
    category: isDocument ? "required" : "recommended",
    severity: isDocument ? EXPLANATION_SEVERITY.CRITICAL : label === "Resolve requested changes and resubmit" ? EXPLANATION_SEVERITY.CRITICAL : EXPLANATION_SEVERITY.WARNING
  };
}
function buildRecommendationsFromSnapshot2(input) {
  const recommendations = [];
  let index = 0;
  for (const label of input.missingRequired) {
    recommendations.push(buildRecommendationEntry2(input, label, true, index));
    index += 1;
  }
  for (const label of input.missingRecommended) {
    recommendations.push(buildRecommendationEntry2(input, label, false, index));
    index += 1;
  }
  return recommendations;
}
function buildBreakdownFromSnapshot2(input) {
  const totalRequired = input.documentsProgress.totalRequired || REQUIRED_DOCUMENT_TYPES.length;
  let weightedDocumentScore = 0;
  const documentReasonCodes = input.missingRequired.map(vettingDocumentLabelToReasonCode);
  if (isActiveAccount(input)) {
    weightedDocumentScore = totalRequired;
  } else {
    for (const type of resolveDocumentTypes(totalRequired)) {
      if (input.documents && input.documents.length > 0) {
        weightedDocumentScore += scoreDocumentStatus(resolveDocumentStatus(input, type));
      } else {
        weightedDocumentScore += isDocumentMissing(input, type) ? 0 : 1;
      }
    }
  }
  const documentRatio = totalRequired === 0 ? 1 : weightedDocumentScore / totalRequired;
  const reviewRatio = resolveReviewProgressScore(input);
  const reviewReasonCodes = [];
  if (!isActiveAccount(input) && input.reviewProgress !== "approved") {
    reviewReasonCodes.push(vettingReviewProgressToReasonCode(input.reviewProgress));
  }
  for (const label of input.missingRecommended) {
    const code = vettingReviewGapLabelToReasonCode(label);
    if (!reviewReasonCodes.includes(code)) {
      reviewReasonCodes.push(code);
    }
  }
  return [
    {
      label: "Documents",
      weight: VETTING_ADAPTER_SCORE_WEIGHTS.documents,
      score: roundScore2(documentRatio * VETTING_ADAPTER_SCORE_WEIGHTS.documents),
      maxScore: VETTING_ADAPTER_SCORE_WEIGHTS.documents,
      reasonCodes: documentReasonCodes
    },
    {
      label: "Review",
      weight: VETTING_ADAPTER_SCORE_WEIGHTS.review,
      score: roundScore2(reviewRatio * VETTING_ADAPTER_SCORE_WEIGHTS.review),
      maxScore: VETTING_ADAPTER_SCORE_WEIGHTS.review,
      reasonCodes: reviewReasonCodes
    }
  ];
}
function buildTimelineFromSnapshot2(input) {
  const events = [];
  if (input.createdAt) {
    events.push({
      type: "vetting-started",
      title: "Vetting started",
      description: "Party entered the vetting workflow.",
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (input.documents) {
    for (const document of input.documents) {
      if (!document.uploadedAt) continue;
      events.push({
        type: "vetting-document-uploaded",
        title: `Document uploaded: ${document.type.replace(/_/g, " ")}`,
        description: `Uploaded ${document.type.replace(/_/g, " ")} for vetting review.`,
        timestamp: document.uploadedAt,
        status: document.status === "approved" ? TIMELINE_EVENT_STATUS.COMPLETED : document.status === "rejected" ? TIMELINE_EVENT_STATUS.BLOCKED : TIMELINE_EVENT_STATUS.ACTIVE,
        relatedEntity: input.entityId
      });
    }
  }
  if (input.reviewStartedAt) {
    events.push({
      type: "vetting-review-started",
      title: "Admin review started",
      description: "Vetting documents submitted for admin review.",
      timestamp: input.reviewStartedAt,
      status: input.reviewProgress === "approved" ? TIMELINE_EVENT_STATUS.COMPLETED : TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId
    });
  }
  if (input.changesRequestedAt) {
    events.push({
      type: "vetting-changes-requested",
      title: "Changes requested",
      description: "Admin requested changes to submitted vetting documents.",
      timestamp: input.changesRequestedAt,
      status: input.changesResolved === true ? TIMELINE_EVENT_STATUS.COMPLETED : TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId
    });
  }
  if (input.resubmittedAt) {
    events.push({
      type: "vetting-resubmitted",
      title: "Documents resubmitted",
      description: "Updated documents resubmitted after admin feedback.",
      timestamp: input.resubmittedAt,
      status: TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId
    });
  }
  if (input.reviewApprovedAt) {
    events.push({
      type: "vetting-review-approved",
      title: "Admin review approved",
      description: "Vetting admin review completed successfully.",
      timestamp: input.reviewApprovedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  events.push({
    type: "vetting-evaluated",
    title: "Vetting readiness evaluated",
    description: buildSummary2(input),
    timestamp: resolveGeneratedAt2(input),
    status: isActiveAccount(input) || input.status === "ready_for_matching" ? TIMELINE_EVENT_STATUS.COMPLETED : input.status === "needs_review" ? TIMELINE_EVENT_STATUS.ACTIVE : TIMELINE_EVENT_STATUS.BLOCKED,
    relatedEntity: input.entityId
  });
  return events.sort(
    (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
  );
}
function buildVettingExplanation(input) {
  const generatedAt = resolveGeneratedAt2(input);
  return {
    engine: ENGINE_ID.VETTING,
    entityId: input.entityId,
    score: input.score,
    health: resolveHealth2(input),
    summary: buildSummary2(input),
    scoreBreakdown: buildBreakdownFromSnapshot2(input),
    reasons: buildReasons2(input),
    blockers: buildBlockers2(input),
    strengths: buildStrengths2(input),
    weaknesses: buildWeaknesses2(input),
    recommendations: buildRecommendationsFromSnapshot2(input),
    timeline: buildTimelineFromSnapshot2(input),
    metadata: {
      generatedAt,
      engineVersion: VETTING_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: "vetting-readiness-adapter",
      tags: [input.reviewProgress, input.status],
      extensions: {
        readinessStatus: input.status,
        reviewProgress: input.reviewProgress,
        accountStatus: input.accountStatus ?? null,
        documentsProgress: input.documentsProgress
      }
    }
  };
}
var vettingExplainabilityAdapter = {
  buildExplanation: buildVettingExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot2,
  buildBreakdown: buildBreakdownFromSnapshot2,
  buildTimeline: buildTimelineFromSnapshot2
};

// src/adapters/opportunity-field-map.ts
var OPPORTUNITY_FIELD_ID_TO_REASON_CODE = {
  title: READINESS_REASON_CODES.MISSING_TITLE,
  intent: READINESS_REASON_CODES.MISSING_INTENT,
  categoryProfession: READINESS_REASON_CODES.MISSING_CATEGORY_PROFESSION,
  roleIntent: READINESS_REASON_CODES.MISSING_ROLE_INTENT,
  skillsIntent: READINESS_REASON_CODES.MISSING_SKILLS_INTENT,
  servicesIntent: READINESS_REASON_CODES.MISSING_SERVICES_INTENT,
  location: READINESS_REASON_CODES.MISSING_LOCATION,
  timeline: READINESS_REASON_CODES.MISSING_TIMELINE,
  collaborationModel: READINESS_REASON_CODES.MISSING_COLLABORATION_MODEL,
  descriptionScope: READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE,
  budgetValueTerms: READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS,
  preferredPartnerType: READINESS_REASON_CODES.MISSING_PREFERRED_PARTNER_TYPE,
  attachments: READINESS_REASON_CODES.MISSING_ATTACHMENTS,
  compliance: READINESS_REASON_CODES.MISSING_COMPLIANCE,
  deliveryMilestones: READINESS_REASON_CODES.MISSING_DELIVERY_MILESTONES
};
var OPPORTUNITY_FIELD_HREF_SLUG = {
  title: "title",
  intent: "intent",
  categoryProfession: "category-profession",
  roleIntent: "role-intent",
  skillsIntent: "skills-intent",
  servicesIntent: "services-intent",
  location: "location",
  timeline: "timeline",
  collaborationModel: "collaboration-model",
  descriptionScope: "description-scope",
  budgetValueTerms: "budget-value-terms",
  preferredPartnerType: "preferred-partner-type",
  attachments: "attachments",
  compliance: "compliance",
  deliveryMilestones: "delivery-milestones"
};
var READINESS_CODE_ALIASES = {
  READINESS_MISSING_BUDGET_VALUE_TERMS: READINESS_REASON_CODES.MISSING_BUDGET_VALUE_TERMS,
  READINESS_MISSING_DESCRIPTION_SCOPE: READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE,
  READINESS_MISSING_SCOPE: READINESS_REASON_CODES.MISSING_DESCRIPTION_SCOPE
};
function fieldIdToParameterizedCode(fieldId) {
  const snake = fieldId.replace(/([A-Z])/g, "_$1").replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase().replace(/^_/, "");
  return `READINESS_MISSING_${snake}`;
}
function opportunityFieldIdToReasonCode(fieldId) {
  return OPPORTUNITY_FIELD_ID_TO_REASON_CODE[fieldId] ?? fieldIdToParameterizedCode(fieldId);
}
var READINESS_REASON_CODE_VALUES = new Set(
  Object.values(READINESS_REASON_CODES)
);
function isReadinessReasonCode(code) {
  return READINESS_REASON_CODE_VALUES.has(code);
}
function opportunityReasonCodeToCanonical(code, fieldId) {
  if (code in READINESS_CODE_ALIASES) {
    return READINESS_CODE_ALIASES[code];
  }
  if (isReadinessReasonCode(code)) {
    return code;
  }
  if (code.startsWith("READINESS_MISSING_") && fieldId) {
    return opportunityFieldIdToReasonCode(fieldId);
  }
  if (code.startsWith("READINESS_")) {
    return code;
  }
  if (fieldId) {
    return opportunityFieldIdToReasonCode(fieldId);
  }
  return code;
}
function opportunityFieldIdToHref(fieldId, subModelKey) {
  const slug = OPPORTUNITY_FIELD_HREF_SLUG[fieldId] ?? fieldId.replace(/([A-Z])/g, "-$1").toLowerCase();
  const base = subModelKey ? `/opportunity/edit/${subModelKey}` : "/opportunity/edit";
  return `${base}#${slug}`;
}

// src/adapters/opportunity-adapter.ts
var OPPORTUNITY_ADAPTER_VERSION = "1.0.0";
var OPPORTUNITY_ADAPTER_SCORE_WEIGHTS = {
  required: 80,
  recommended: 20
};
function roundScore3(value) {
  return Math.round(value * 100) / 100;
}
function resolveGeneratedAt3(input) {
  return input.evaluatedAt ?? input.snapshot.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function resolveHealth3(health) {
  switch (health) {
    case "excellent":
      return HEALTH.EXCELLENT;
    case "good":
      return HEALTH.GOOD;
    case "warning":
      return HEALTH.WARNING;
    case "critical":
    default:
      return HEALTH.CRITICAL;
  }
}
function toCanonicalCode(code, fieldId) {
  return opportunityReasonCodeToCanonical(code, fieldId);
}
function mapExplanationSeverity(severity) {
  if (severity === "critical") return EXPLANATION_SEVERITY.CRITICAL;
  if (severity === "warning") return EXPLANATION_SEVERITY.WARNING;
  return EXPLANATION_SEVERITY.INFO;
}
function buildSummary3(input) {
  if (input.publishReady) {
    return "Opportunity is publish-ready \u2014 all required fields are complete.";
  }
  const missingRequired = input.missingRequiredFields.length;
  if (missingRequired > 0) {
    return `Opportunity is incomplete \u2014 ${missingRequired} required field${missingRequired === 1 ? "" : "s"} still missing.`;
  }
  const missingRecommended = input.missingRecommendedFields.length;
  if (missingRecommended > 0) {
    return `Opportunity meets publish requirements \u2014 ${missingRecommended} recommended field${missingRecommended === 1 ? "" : "s"} can improve visibility.`;
  }
  return `Opportunity readiness is ${input.readinessLevel} at ${Math.round(input.score)}%.`;
}
function buildReasons3(input) {
  if (input.explanations.length > 0) {
    return input.explanations.map((explanation) => ({
      code: toCanonicalCode(explanation.code, explanation.fieldId),
      message: explanation.message,
      severity: mapExplanationSeverity(explanation.severity),
      category: explanation.category ?? (explanation.fieldId ? "field" : "summary"),
      relatedEntityId: input.entityId
    }));
  }
  const reasons = [
    {
      code: READINESS_REASON_CODES.SCORE_SUMMARY,
      message: `Readiness ${Math.round(input.score)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary"
    }
  ];
  for (const fieldId of input.missingRequiredFields) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId);
    reasons.push({
      code: opportunityFieldIdToReasonCode(fieldId),
      message: `Missing required: ${contribution?.label ?? fieldId}`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: contribution?.category ?? "required",
      relatedEntityId: input.entityId
    });
  }
  if (input.missingRecommendedFields.length > 0) {
    reasons.push({
      code: READINESS_REASON_CODES.RECOMMENDED_GAPS,
      message: `${input.missingRecommendedFields.length} recommended field(s) remaining`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "recommended"
    });
  }
  return reasons;
}
function buildBlockers3(input) {
  if (input.blockingReasons.length > 0) {
    return input.blockingReasons.map((blocker) => ({
      reasonCode: toCanonicalCode(blocker.code, blocker.fieldId),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: blocker.message
    }));
  }
  if (!input.publishReady) {
    return input.missingRequiredFields.map((fieldId) => {
      const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId);
      return {
        reasonCode: opportunityFieldIdToReasonCode(fieldId),
        severity: EXPLANATION_SEVERITY.CRITICAL,
        blockingEntity: input.entityId,
        resolutionHint: `Complete ${contribution?.label ?? fieldId} to publish.`
      };
    });
  }
  return [];
}
function fieldImpactPercent(contribution, input) {
  if (contribution.requiredWeight > 0) {
    const totalRequired = input.fieldContributions.reduce(
      (sum, entry) => sum + entry.requiredWeight,
      0
    );
    if (totalRequired === 0) return 0;
    return roundScore3(
      contribution.requiredWeight / totalRequired * OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required
    );
  }
  const totalRecommended = input.fieldContributions.reduce(
    (sum, entry) => sum + entry.recommendedWeight,
    0
  );
  if (totalRecommended === 0) return 0;
  return roundScore3(
    contribution.recommendedWeight / totalRecommended * OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended
  );
}
function buildStrengths3(input) {
  const strengths = [];
  const completedRequired = input.completedRequiredFields ?? input.fieldContributions.filter((entry) => entry.requiredWeight > 0 && entry.present).map((entry) => entry.fieldId);
  const completedRecommended = input.completedRecommendedFields ?? input.fieldContributions.filter((entry) => entry.recommendedWeight > 0 && entry.present).map((entry) => entry.fieldId);
  const totalRequired = input.fieldContributions.filter(
    (entry) => entry.requiredWeight > 0
  ).length;
  const totalRecommended = input.fieldContributions.filter(
    (entry) => entry.recommendedWeight > 0
  ).length;
  if (completedRequired.length === totalRequired && totalRequired > 0) {
    strengths.push({
      code: READINESS_REASON_CODES.REQUIRED_COMPLETE,
      label: "All required fields complete",
      impactPercent: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required
    });
  }
  if (completedRecommended.length === totalRecommended && totalRecommended > 0) {
    strengths.push({
      code: READINESS_REASON_CODES.RECOMMENDED_COMPLETE,
      label: "All recommended fields complete",
      impactPercent: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended
    });
  }
  for (const fieldId of completedRequired) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId);
    if (!contribution) continue;
    strengths.push({
      code: `READINESS_COMPLETE_${fieldId.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input)
    });
  }
  for (const fieldId of completedRecommended) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId);
    if (!contribution) continue;
    strengths.push({
      code: `READINESS_COMPLETE_${fieldId.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input)
    });
  }
  if (input.publishReady) {
    strengths.push({
      code: READINESS_REASON_CODES.PUBLISH_READY,
      label: "Publish-ready opportunity",
      impactPercent: 100
    });
  }
  return strengths;
}
function buildWeaknesses3(input) {
  const weaknesses = [];
  for (const fieldId of input.missingRequiredFields) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId);
    if (!contribution) {
      weaknesses.push({
        code: opportunityFieldIdToReasonCode(fieldId),
        label: fieldId,
        impactPercent: 0
      });
      continue;
    }
    weaknesses.push({
      code: opportunityFieldIdToReasonCode(fieldId),
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input)
    });
  }
  for (const fieldId of input.missingRecommendedFields) {
    const contribution = input.fieldContributions.find((entry) => entry.fieldId === fieldId);
    if (!contribution) {
      weaknesses.push({
        code: opportunityFieldIdToReasonCode(fieldId),
        label: fieldId,
        impactPercent: 0
      });
      continue;
    }
    weaknesses.push({
      code: opportunityFieldIdToReasonCode(fieldId),
      label: contribution.label,
      impactPercent: fieldImpactPercent(contribution, input)
    });
  }
  return weaknesses;
}
function recommendationPriority3(priority) {
  return priority === "required" ? RECOMMENDATION_PRIORITY.CRITICAL : RECOMMENDATION_PRIORITY.MEDIUM;
}
function buildRecommendationsFromSnapshot3(input) {
  return input.nextBestActions.map((action, index) => {
    const reasonCode = toCanonicalCode(action.reasonCode, action.fieldId);
    const slug = action.fieldId.replace(/([A-Z])/g, "-$1").toLowerCase();
    return {
      id: `opportunity-rec-${slug}-${index}`,
      label: `Complete ${action.label}`,
      reasonCode,
      priority: recommendationPriority3(action.priority),
      impactPercent: action.impactPercent,
      estimatedScore: action.estimatedScore,
      href: opportunityFieldIdToHref(action.fieldId, input.subModelKey),
      category: action.priority,
      severity: action.priority === "required" ? EXPLANATION_SEVERITY.CRITICAL : EXPLANATION_SEVERITY.WARNING
    };
  });
}
function buildBreakdownFromSnapshot3(input) {
  const requiredReasonCodes = input.missingRequiredFields.map(opportunityFieldIdToReasonCode);
  const recommendedReasonCodes = input.missingRecommendedFields.map(
    opportunityFieldIdToReasonCode
  );
  return [
    {
      label: "Required fields",
      weight: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
      score: roundScore3(
        input.requiredScore / 100 * OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required
      ),
      maxScore: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.required,
      reasonCodes: requiredReasonCodes
    },
    {
      label: "Recommended fields",
      weight: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
      score: roundScore3(
        input.recommendedScore / 100 * OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended
      ),
      maxScore: OPPORTUNITY_ADAPTER_SCORE_WEIGHTS.recommended,
      reasonCodes: recommendedReasonCodes
    }
  ];
}
function buildTimelineFromSnapshot3(input) {
  const events = [];
  if (input.createdAt) {
    events.push({
      type: "opportunity-created",
      title: "Opportunity created",
      description: "Opportunity draft record created.",
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  events.push({
    type: "opportunity-evaluated",
    title: "Opportunity readiness evaluated",
    description: buildSummary3(input),
    timestamp: resolveGeneratedAt3(input),
    status: input.publishReady ? TIMELINE_EVENT_STATUS.COMPLETED : input.missingRequiredFields.length > 0 ? TIMELINE_EVENT_STATUS.BLOCKED : TIMELINE_EVENT_STATUS.ACTIVE,
    relatedEntity: input.entityId
  });
  if (input.publishReady) {
    events.push({
      type: "opportunity-publish-ready",
      title: "Publish-ready milestone reached",
      description: "All required opportunity fields are complete.",
      timestamp: resolveGeneratedAt3(input),
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  return events;
}
function buildOpportunityBundle(input, engine) {
  const generatedAt = resolveGeneratedAt3(input);
  return {
    engine,
    entityId: input.entityId,
    score: input.score,
    health: resolveHealth3(input.health),
    summary: buildSummary3(input),
    scoreBreakdown: buildBreakdownFromSnapshot3(input),
    reasons: buildReasons3(input),
    blockers: buildBlockers3(input),
    strengths: buildStrengths3(input),
    weaknesses: buildWeaknesses3(input),
    recommendations: buildRecommendationsFromSnapshot3(input),
    timeline: buildTimelineFromSnapshot3(input),
    metadata: {
      generatedAt,
      engineVersion: input.snapshot.engineVersion ?? OPPORTUNITY_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: engine === ENGINE_ID.READINESS ? "readiness-adapter" : "opportunity-readiness-adapter",
      tags: [input.readinessLevel, input.health, input.publishReady ? "publish-ready" : "draft"],
      extensions: {
        subModelKey: input.subModelKey ?? null,
        readinessLevel: input.readinessLevel,
        publishReady: input.publishReady,
        requiredScore: input.requiredScore,
        recommendedScore: input.recommendedScore,
        knowledgeVersion: input.snapshot.knowledgeVersion,
        formVersion: input.snapshot.formVersion
      }
    }
  };
}
function buildOpportunityExplanation(input) {
  return buildOpportunityBundle(input, ENGINE_ID.OPPORTUNITY);
}
function buildReadinessExplanation(input) {
  return buildOpportunityBundle(input, ENGINE_ID.READINESS);
}
var opportunityExplainabilityAdapter = {
  buildExplanation: buildOpportunityExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot3,
  buildBreakdown: buildBreakdownFromSnapshot3,
  buildTimeline: buildTimelineFromSnapshot3
};
var readinessExplainabilityAdapter = {
  buildExplanation: buildReadinessExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot3,
  buildBreakdown: buildBreakdownFromSnapshot3,
  buildTimeline: buildTimelineFromSnapshot3
};

// src/adapters/matching-field-map.ts
var MATCH_ADAPTER_SCORE_WEIGHTS = {
  skillMatch: 25,
  exchangeCompatibility: 20,
  valueCompatibility: 20,
  budgetFit: 10,
  timelineFit: 10,
  locationFit: 10,
  reputation: 5,
  attributeOverlap: 0,
  serviceOverlapPct: 0
};
var MATCH_DIMENSION_THRESHOLDS = {
  low: 0.25,
  partial: 0.25,
  good: 0.7
};
var MATCH_DIMENSION_LABELS = {
  skillMatch: "Skill match",
  attributeOverlap: "Attribute overlap",
  serviceOverlapPct: "Service overlap",
  exchangeCompatibility: "Exchange compatibility",
  valueCompatibility: "Value compatibility",
  budgetFit: "Budget fit",
  timelineFit: "Timeline fit",
  locationFit: "Location fit",
  reputation: "Reputation"
};
var MATCH_DIMENSION_TO_REASON_CODE = {
  skillMatch: MATCH_REASON_CODES.SKILL_LOW,
  attributeOverlap: MATCH_REASON_CODES.SKILL_LOW,
  serviceOverlapPct: MATCH_REASON_CODES.SERVICE_OVERLAP_LOW,
  exchangeCompatibility: MATCH_REASON_CODES.EXCHANGE_LOW,
  valueCompatibility: MATCH_REASON_CODES.VALUE_LOW,
  budgetFit: MATCH_REASON_CODES.BUDGET_LOW,
  timelineFit: MATCH_REASON_CODES.TIMELINE_LOW,
  locationFit: MATCH_REASON_CODES.LOCATION_LOW,
  reputation: MATCH_REASON_CODES.REPUTATION_LOW
};
var HARD_GATE_CODE_MAP = {
  role_incompatible: MATCH_REASON_CODES.HARD_GATE_ROLE_INCOMPATIBLE,
  core_skill_missing: MATCH_REASON_CODES.HARD_GATE_SKILL_MISSING,
  service_overlap_low: MATCH_REASON_CODES.HARD_GATE_SERVICE_OVERLAP_LOW,
  role_missing: MATCH_REASON_CODES.CONSTRAINT_BLOCKED
};
var TOPOLOGY_REASON_CODES = {
  one_way: MATCH_REASON_CODES.TOPOLOGY_ONE_WAY,
  two_way: MATCH_REASON_CODES.TOPOLOGY_TWO_WAY,
  consortium: MATCH_REASON_CODES.TOPOLOGY_CONSORTIUM,
  circular: MATCH_REASON_CODES.TOPOLOGY_CIRCULAR
};
function matchDimensionToReasonCode(dimension) {
  return MATCH_DIMENSION_TO_REASON_CODE[dimension];
}
function matchHardGateCodeToReasonCode(code) {
  const normalized = code.trim().toLowerCase();
  return HARD_GATE_CODE_MAP[normalized] ?? MATCH_REASON_CODES.CONSTRAINT_BLOCKED;
}
function matchTopologyToReasonCode(topology) {
  return TOPOLOGY_REASON_CODES[topology];
}
function matchTierToReasonCode(tier) {
  switch (tier) {
    case "top":
      return MATCH_REASON_CODES.TIER_TOP;
    case "good":
      return MATCH_REASON_CODES.TIER_GOOD;
    default:
      return MATCH_REASON_CODES.TIER_POSSIBLE;
  }
}
function labelFromDimensionScore(score) {
  if (score >= 1) return "Match";
  if (score >= MATCH_DIMENSION_THRESHOLDS.partial) return "Partial";
  return "No Match";
}
function isLowDimensionScore(score) {
  return score < MATCH_DIMENSION_THRESHOLDS.low;
}
function dimensionImprovementHint(dimension) {
  switch (dimension) {
    case "skillMatch":
    case "attributeOverlap":
      return "Align required skills and services with the counterpart post.";
    case "serviceOverlapPct":
      return "Increase overlap between required and offered services.";
    case "exchangeCompatibility":
      return "Review exchange model compatibility between posts.";
    case "valueCompatibility":
      return "Negotiate value terms to improve equivalence.";
    case "budgetFit":
      return "Adjust budget ranges to improve overlap.";
    case "timelineFit":
      return "Align availability and deadline windows.";
    case "locationFit":
      return "Clarify location or remote-work preferences.";
    case "reputation":
      return "Improve counterpart reputation signals or choose a higher-rated partner.";
    default:
      return "Review this match dimension with the counterpart.";
  }
}

// src/adapters/matching-adapter.ts
var MATCHING_ADAPTER_VERSION = "1.0.0";
var SCORED_DIMENSIONS = [
  "skillMatch",
  "exchangeCompatibility",
  "valueCompatibility",
  "budgetFit",
  "timelineFit",
  "locationFit",
  "reputation"
];
var SUPPLEMENTARY_DIMENSIONS = [
  "attributeOverlap",
  "serviceOverlapPct"
];
function roundScore4(value) {
  return Math.round(value * 100) / 100;
}
function normalizeMatchScore(score) {
  if (score <= 1) {
    return roundScore4(score * 100);
  }
  return roundScore4(score);
}
function resolveGeneratedAt4(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function resolveHealth4(scorePercent, recommendation) {
  if (recommendation?.tier === "top") return HEALTH.EXCELLENT;
  if (recommendation?.tier === "good") return HEALTH.GOOD;
  if (recommendation?.tier === "possible") return HEALTH.WARNING;
  if (scorePercent >= 85) return HEALTH.EXCELLENT;
  if (scorePercent >= 70) return HEALTH.GOOD;
  if (scorePercent >= 50) return HEALTH.WARNING;
  return HEALTH.CRITICAL;
}
function resolveLabel(dimension, score, breakdown, labels) {
  const explicit = labels?.[dimension];
  if (explicit) return explicit;
  if ((dimension === "attributeOverlap" || dimension === "serviceOverlapPct") && breakdown.skillMatch != null) {
    const skillScore = breakdown.skillMatch;
    if (Math.abs(score - skillScore) < 1e-3) {
      return resolveLabel("skillMatch", skillScore, breakdown, labels);
    }
  }
  return labelFromDimensionScore(score);
}
function dimensionScore(breakdown, dimension) {
  const value = breakdown[dimension];
  if (typeof value !== "number") return void 0;
  return value;
}
function activeDimensions(breakdown) {
  const dimensions = [...SCORED_DIMENSIONS];
  for (const dimension of SUPPLEMENTARY_DIMENSIONS) {
    if (dimensionScore(breakdown, dimension) != null) {
      dimensions.push(dimension);
    }
  }
  return dimensions;
}
function buildSummary4(input, scorePercent) {
  if (input.hardGateFailure) {
    return `Match blocked \u2014 ${input.hardGateFailure.message}`;
  }
  if (input.breakdown.rejected === "skill_floor") {
    return "Match rejected \u2014 skill overlap below minimum threshold.";
  }
  if (input.recommendation?.reason) {
    return input.recommendation.reason;
  }
  const tier = input.recommendation?.tier;
  if (tier === "top") {
    return `Strong match at ${Math.round(scorePercent)}% \u2014 ready for contracting.`;
  }
  if (tier === "good") {
    return `Good match at ${Math.round(scorePercent)}% \u2014 review value terms.`;
  }
  if (tier === "possible") {
    return `Possible match at ${Math.round(scorePercent)}% \u2014 negotiation may be needed.`;
  }
  return `Match score ${Math.round(scorePercent)}%.`;
}
function buildReasons4(input, scorePercent) {
  const reasons = [
    {
      code: MATCH_REASON_CODES.SCORE_SUMMARY,
      message: `Match score ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary",
      relatedEntityId: input.entityId
    }
  ];
  if (input.topology) {
    reasons.push({
      code: matchTopologyToReasonCode(input.topology),
      message: input.topologyReason ?? `Matching topology: ${input.topology.replace("_", " ")}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "topology",
      relatedEntityId: input.entityId
    });
  }
  if (input.recommendation) {
    reasons.push({
      code: matchTierToReasonCode(input.recommendation.tier),
      message: input.recommendation.reason,
      severity: input.recommendation.tier === "top" ? EXPLANATION_SEVERITY.INFO : input.recommendation.tier === "good" ? EXPLANATION_SEVERITY.WARNING : EXPLANATION_SEVERITY.WARNING,
      category: "recommendation",
      relatedEntityId: input.entityId
    });
  }
  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension);
    if (score == null) continue;
    const label = resolveLabel(dimension, score, input.breakdown, input.labels);
    if (label === "Match") continue;
    reasons.push({
      code: matchDimensionToReasonCode(dimension),
      message: `${MATCH_DIMENSION_LABELS[dimension]} is ${label.toLowerCase()} (${Math.round(score * 100)}%).`,
      severity: label === "No Match" ? EXPLANATION_SEVERITY.CRITICAL : EXPLANATION_SEVERITY.WARNING,
      category: dimension,
      relatedEntityId: input.entityId
    });
  }
  return reasons;
}
function buildBlockers4(input) {
  const blockers = [];
  if (input.hardGateFailure) {
    blockers.push({
      reasonCode: matchHardGateCodeToReasonCode(input.hardGateFailure.code),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.counterpartEntityId ?? input.entityId,
      resolutionHint: input.hardGateFailure.message
    });
  }
  if (input.breakdown.rejected === "skill_floor") {
    blockers.push({
      reasonCode: MATCH_REASON_CODES.SKILL_LOW,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.counterpartEntityId ?? input.entityId,
      resolutionHint: "Increase skill and service overlap above the minimum match threshold."
    });
  }
  return blockers;
}
function dimensionImpactPercent(dimension) {
  return MATCH_ADAPTER_SCORE_WEIGHTS[dimension];
}
function buildStrengths4(input) {
  const strengths = [];
  if (input.recommendation?.tier === "top") {
    strengths.push({
      code: MATCH_REASON_CODES.TIER_TOP,
      label: "Top-tier match recommendation",
      impactPercent: 100
    });
  }
  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension);
    if (score == null) continue;
    const label = resolveLabel(dimension, score, input.breakdown, input.labels);
    if (label !== "Match") continue;
    strengths.push({
      code: `MATCH_STRONG_${dimension.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
      label: MATCH_DIMENSION_LABELS[dimension],
      impactPercent: dimensionImpactPercent(dimension)
    });
  }
  return strengths;
}
function buildWeaknesses4(input) {
  const weaknesses = [];
  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension);
    if (score == null) continue;
    const label = resolveLabel(dimension, score, input.breakdown, input.labels);
    if (label === "Match") continue;
    weaknesses.push({
      code: matchDimensionToReasonCode(dimension),
      label: MATCH_DIMENSION_LABELS[dimension],
      impactPercent: dimensionImpactPercent(dimension)
    });
  }
  return weaknesses;
}
function recommendationPriority4(tier) {
  if (tier === "top") return RECOMMENDATION_PRIORITY.LOW;
  if (tier === "good") return RECOMMENDATION_PRIORITY.MEDIUM;
  return RECOMMENDATION_PRIORITY.HIGH;
}
function buildRecommendationsFromSnapshot4(input) {
  const recommendations = [];
  const currentScore = normalizeMatchScore(input.matchScore);
  let index = 0;
  if (input.recommendation?.actionRequired) {
    recommendations.push({
      id: `matching-rec-action-${index}`,
      label: input.recommendation.reason,
      reasonCode: matchTierToReasonCode(input.recommendation.tier),
      priority: recommendationPriority4(input.recommendation.tier),
      impactPercent: 100,
      estimatedScore: currentScore,
      category: "action",
      severity: input.recommendation.tier === "possible" ? EXPLANATION_SEVERITY.CRITICAL : EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension);
    if (score == null || !isLowDimensionScore(score)) continue;
    const impactPercent = dimensionImpactPercent(dimension);
    const reasonCode = matchDimensionToReasonCode(dimension);
    recommendations.push({
      id: `matching-rec-${dimension}-${index}`,
      label: dimensionImprovementHint(dimension),
      reasonCode,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent,
      estimatedScore: roundScore4(Math.min(100, currentScore + impactPercent)),
      category: dimension,
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  return recommendations;
}
function buildBreakdownFromSnapshot4(input) {
  return activeDimensions(input.breakdown).map((dimension) => {
    const rawScore = dimensionScore(input.breakdown, dimension) ?? 0;
    const weight = MATCH_ADAPTER_SCORE_WEIGHTS[dimension];
    const label = resolveLabel(dimension, rawScore, input.breakdown, input.labels);
    const reasonCodes = label === "Match" ? [] : [matchDimensionToReasonCode(dimension)];
    return {
      label: MATCH_DIMENSION_LABELS[dimension],
      weight,
      score: weight > 0 ? roundScore4(rawScore * weight) : roundScore4(rawScore * 100),
      maxScore: weight > 0 ? weight : 100,
      reasonCodes
    };
  });
}
function buildTimelineFromSnapshot4(input) {
  const evaluatedAt = resolveGeneratedAt4(input);
  const events = [
    {
      type: "match-discovered",
      title: "Match candidate discovered",
      description: input.counterpartEntityId ? `Counterpart ${input.counterpartEntityId} identified as a candidate.` : "Match candidate identified during discovery.",
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    },
    {
      type: "match-evaluated",
      title: "Match evaluated",
      description: buildSummary4(input, normalizeMatchScore(input.matchScore)),
      timestamp: evaluatedAt,
      status: input.hardGateFailure || input.breakdown.rejected ? TIMELINE_EVENT_STATUS.BLOCKED : TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    }
  ];
  return events;
}
function buildMatchingExplanation(input) {
  const scorePercent = normalizeMatchScore(input.matchScore);
  const generatedAt = resolveGeneratedAt4(input);
  return {
    engine: ENGINE_ID.MATCHING,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth4(scorePercent, input.recommendation),
    summary: buildSummary4(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot4(input),
    reasons: buildReasons4(input, scorePercent),
    blockers: buildBlockers4(input),
    strengths: buildStrengths4(input),
    weaknesses: buildWeaknesses4(input),
    recommendations: buildRecommendationsFromSnapshot4(input),
    timeline: buildTimelineFromSnapshot4(input),
    metadata: {
      generatedAt,
      engineVersion: MATCHING_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: "matching-adapter",
      tags: [
        input.recommendation?.tier ?? "unranked",
        input.topology ?? "unknown-topology"
      ],
      extensions: {
        topology: input.topology ?? null,
        topologyReason: input.topologyReason ?? null,
        counterpartEntityId: input.counterpartEntityId ?? null,
        rejected: input.breakdown.rejected ?? null,
        hardGateFailure: input.hardGateFailure ?? null
      }
    }
  };
}
var matchingExplainabilityAdapter = {
  buildExplanation: buildMatchingExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot4,
  buildBreakdown: buildBreakdownFromSnapshot4,
  buildTimeline: buildTimelineFromSnapshot4
};

// src/adapters/negotiation-field-map.ts
var NEGOTIATION_ADAPTER_SCORE_WEIGHTS = {
  priceAlignment: 30,
  termsAlignment: 30,
  responseTimeliness: 20,
  offerProgression: 20
};
var NEGOTIATION_BREAKDOWN_LABELS = {
  priceAlignment: "Price alignment",
  termsAlignment: "Terms alignment",
  responseTimeliness: "Response timeliness",
  offerProgression: "Offer progression"
};
var NEGOTIATION_STATUS_TO_REASON_CODE = {
  active: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
  countered: NEGOTIATION_REASON_CODES.STATUS_COUNTERED,
  agreed: NEGOTIATION_REASON_CODES.STATUS_AGREED,
  expired: NEGOTIATION_REASON_CODES.STATUS_EXPIRED,
  cancelled: NEGOTIATION_REASON_CODES.STATUS_CANCELLED
};
var NEGOTIATION_LARGE_PRICE_GAP_PERCENT = 20;
var NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD = 3;
function negotiationStatusToReasonCode(status) {
  return NEGOTIATION_STATUS_TO_REASON_CODE[status];
}
function negotiationStatusToHref(entityId, section) {
  const base = `/negotiation/${entityId}`;
  if (section) return `${base}/${section}`;
  return base;
}
function negotiationTermsFieldToHref(entityId, field) {
  const slug = field.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${negotiationStatusToHref(entityId, "terms")}#${slug}`;
}
function negotiationGapToReasonCode() {
  return NEGOTIATION_REASON_CODES.TERMS_MISMATCH;
}
function isLargePriceGap(percent) {
  return percent != null && percent >= NEGOTIATION_LARGE_PRICE_GAP_PERCENT;
}
function isResponseDelayed(days) {
  return days != null && days >= NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD;
}

// src/adapters/negotiation-adapter.ts
var NEGOTIATION_ADAPTER_VERSION = "1.0.0";
function roundScore5(value) {
  return Math.round(value * 100) / 100;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function resolveGeneratedAt5(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function resolveOfferCount(input) {
  if (input.offerCount != null) return input.offerCount;
  return input.currentOffer ? 1 : 0;
}
function resolveCounterOfferCount(input) {
  if (input.counterOfferCount != null) return input.counterOfferCount;
  if (input.status === "countered") return 1;
  return 0;
}
function gapPenalty(input) {
  const gapCount = input.commercialTermsGaps?.length ?? 0;
  return Math.min(20, gapCount * 4);
}
function priceGapPenalty(input) {
  const percent = input.priceGap?.percent;
  if (percent == null) return 0;
  return Math.min(25, percent / 2);
}
function delayPenalty(input) {
  const days = input.responseDelayDays;
  if (days == null || days < NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD) return 0;
  return Math.min(15, (days - 2) * 3);
}
function computeNegotiationProgressScore(input) {
  const offerCount = resolveOfferCount(input);
  const counterCount = resolveCounterOfferCount(input);
  switch (input.status) {
    case "agreed":
      return 100;
    case "cancelled":
      return 10;
    case "expired":
      return 5;
    case "countered": {
      let score = 50 + Math.min(10, counterCount * 3);
      if (input.currentOffer) score += 5;
      score -= gapPenalty(input);
      score -= priceGapPenalty(input);
      score -= delayPenalty(input);
      if (input.pendingCounterOffer) score -= 5;
      return roundScore5(clamp(score, 40, 60));
    }
    case "active": {
      if (offerCount === 0) return 30;
      let score = 55 + Math.min(15, offerCount * 5);
      if (input.pendingCounterOffer) score -= 5;
      score -= gapPenalty(input);
      score -= priceGapPenalty(input);
      score -= delayPenalty(input);
      return roundScore5(clamp(score, 50, 70));
    }
    default:
      return 0;
  }
}
function resolveHealth5(input, scorePercent) {
  if (input.status === "agreed") return HEALTH.EXCELLENT;
  if (input.status === "expired" || input.status === "cancelled") {
    return HEALTH.CRITICAL;
  }
  if (input.status === "active" && scorePercent >= 65) return HEALTH.GOOD;
  if (input.status === "countered" && scorePercent >= 55) return HEALTH.GOOD;
  if (input.status === "active" || input.status === "countered") {
    return HEALTH.WARNING;
  }
  return HEALTH.CRITICAL;
}
function statusMessage(status) {
  switch (status) {
    case "active":
      return "Negotiation is active \u2014 offers may be submitted or reviewed.";
    case "countered":
      return "Negotiation has been countered \u2014 terms are under revision.";
    case "agreed":
      return "Negotiation agreed \u2014 commercial terms are accepted.";
    case "expired":
      return "Negotiation expired \u2014 no agreement was reached in time.";
    case "cancelled":
      return "Negotiation cancelled \u2014 parties did not proceed.";
    default:
      return `Negotiation status: ${status}`;
  }
}
function buildSummary5(input, scorePercent) {
  if (input.status === "agreed") {
    return "Negotiation agreed \u2014 terms accepted and ready for contracting.";
  }
  if (input.status === "expired") {
    return "Negotiation expired \u2014 respond or restart to continue.";
  }
  if (input.status === "cancelled") {
    return "Negotiation cancelled \u2014 no further offers can be accepted.";
  }
  if (input.changesRequested) {
    return "Changes requested \u2014 resolve review feedback before proceeding.";
  }
  if (input.pendingCounterOffer) {
    return "Counter-offer pending \u2014 review and respond to continue negotiation.";
  }
  if (resolveOfferCount(input) === 0) {
    return "Negotiation active \u2014 submit an initial offer to begin.";
  }
  return `Negotiation progress ${Math.round(scorePercent)}% \u2014 ${statusMessage(input.status).toLowerCase()}`;
}
function buildReasons5(input, scorePercent) {
  const reasons = [
    {
      code: NEGOTIATION_REASON_CODES.SCORE_SUMMARY,
      message: `Negotiation progress ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary",
      relatedEntityId: input.entityId
    },
    {
      code: negotiationStatusToReasonCode(input.status),
      message: statusMessage(input.status),
      severity: input.status === "expired" || input.status === "cancelled" ? EXPLANATION_SEVERITY.CRITICAL : input.status === "agreed" ? EXPLANATION_SEVERITY.INFO : EXPLANATION_SEVERITY.WARNING,
      category: "status",
      relatedEntityId: input.entityId
    }
  ];
  if (resolveOfferCount(input) === 0 && input.status !== "agreed") {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.NO_OFFERS,
      message: "No offers submitted yet.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "offers",
      relatedEntityId: input.entityId
    });
  }
  if (input.currentOffer?.termsSummary) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
      message: `Current offer: ${input.currentOffer.termsSummary}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "offers",
      relatedEntityId: input.entityId
    });
  }
  for (const gap of input.commercialTermsGaps ?? []) {
    reasons.push({
      code: negotiationGapToReasonCode(),
      message: gap.changeSummary ?? `${gap.label}: ${gap.priorValue ?? "\u2014"} \u2192 ${gap.proposedValue ?? "\u2014"}`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: gap.field,
      relatedEntityId: input.entityId
    });
  }
  if (input.priceGap?.percent != null || input.priceGap?.absolute != null) {
    const parts = [];
    if (input.priceGap.percent != null) {
      parts.push(`${Math.round(input.priceGap.percent)}%`);
    }
    if (input.priceGap.absolute != null) {
      const currency = input.priceGap.currency ?? "SAR";
      parts.push(`${input.priceGap.absolute} ${currency}`);
    }
    reasons.push({
      code: NEGOTIATION_REASON_CODES.PRICE_GAP,
      message: `Price gap: ${parts.join(" / ")}`,
      severity: isLargePriceGap(input.priceGap.percent) ? EXPLANATION_SEVERITY.CRITICAL : EXPLANATION_SEVERITY.WARNING,
      category: "commercial",
      relatedEntityId: input.entityId
    });
  }
  if (isResponseDelayed(input.responseDelayDays)) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      message: `Response delayed by ${input.responseDelayDays} day(s).`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "timeliness",
      relatedEntityId: input.entityId
    });
  }
  if (input.pendingCounterOffer) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      message: "A counter-offer is awaiting response.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "offers",
      relatedEntityId: input.entityId
    });
  }
  if (input.changesRequested) {
    reasons.push({
      code: NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      message: input.reviewNotes ?? `Changes requested${input.requestedItems?.length ? `: ${input.requestedItems.join(", ")}` : ""}.`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: "review",
      relatedEntityId: input.entityId
    });
  }
  return reasons;
}
function buildBlockers5(input) {
  const blockers = [];
  if (input.changesRequested) {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: input.reviewNotes ?? "Resolve requested changes and resubmit terms."
    });
  }
  if (input.status === "expired") {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.STATUS_EXPIRED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Restart negotiation or submit a new offer before the deadline."
    });
  }
  if (input.status === "cancelled") {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.STATUS_CANCELLED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Negotiation was cancelled \u2014 initiate a new negotiation to proceed."
    });
  }
  if (isLargePriceGap(input.priceGap?.percent)) {
    blockers.push({
      reasonCode: NEGOTIATION_REASON_CODES.PRICE_GAP,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Close the price gap with a revised offer or accept adjusted terms."
    });
  }
  return blockers;
}
function buildStrengths5(input) {
  const strengths = [];
  if (input.status === "agreed") {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.STATUS_AGREED,
      label: "Negotiation agreed",
      impactPercent: 40
    });
  }
  if (input.acceptedOffer) {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.OFFER_ACCEPTED,
      label: input.acceptedOffer.termsSummary ?? "Accepted offer on record",
      impactPercent: 35
    });
  }
  const gapCount = input.commercialTermsGaps?.length ?? 0;
  if (resolveOfferCount(input) > 0 && gapCount === 0 && input.status !== "expired") {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
      label: "Commercial terms aligned",
      impactPercent: 25
    });
  }
  if (input.responseDelayDays != null && input.responseDelayDays < NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD && (input.status === "active" || input.status === "countered")) {
    strengths.push({
      code: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
      label: "Timely responses",
      impactPercent: 10
    });
  }
  return strengths;
}
function buildWeaknesses5(input) {
  const weaknesses = [];
  for (const gap of input.commercialTermsGaps ?? []) {
    weaknesses.push({
      code: negotiationGapToReasonCode(),
      label: gap.label,
      impactPercent: roundScore5(
        NEGOTIATION_ADAPTER_SCORE_WEIGHTS.termsAlignment / Math.max(1, input.commercialTermsGaps?.length ?? 1)
      )
    });
  }
  if (input.priceGap?.percent != null || input.priceGap?.absolute != null) {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.PRICE_GAP,
      label: "Price gap between parties",
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.priceAlignment
    });
  }
  if (isResponseDelayed(input.responseDelayDays)) {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      label: `Response delayed (${input.responseDelayDays} days)`,
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.responseTimeliness
    });
  }
  if (input.pendingCounterOffer) {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      label: "Counter-offer awaiting response",
      impactPercent: 15
    });
  }
  if (resolveOfferCount(input) === 0 && input.status === "active") {
    weaknesses.push({
      code: NEGOTIATION_REASON_CODES.NO_OFFERS,
      label: "No offers submitted",
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.offerProgression
    });
  }
  return weaknesses;
}
function dimensionScore2(input, dimension) {
  const weight = NEGOTIATION_ADAPTER_SCORE_WEIGHTS[dimension];
  switch (dimension) {
    case "priceAlignment": {
      const percent = input.priceGap?.percent;
      if (percent == null) return weight;
      const alignment = clamp(1 - percent / 100, 0, 1);
      return roundScore5(alignment * weight);
    }
    case "termsAlignment": {
      const gapCount = input.commercialTermsGaps?.length ?? 0;
      if (gapCount === 0) return weight;
      const alignment = clamp(1 - gapCount * 0.2, 0, 1);
      return roundScore5(alignment * weight);
    }
    case "responseTimeliness": {
      const days = input.responseDelayDays ?? 0;
      if (days < NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD) return weight;
      const alignment = clamp(1 - (days - 2) * 0.1, 0, 1);
      return roundScore5(alignment * weight);
    }
    case "offerProgression": {
      if (input.status === "agreed") return weight;
      const offers = resolveOfferCount(input);
      const counters = resolveCounterOfferCount(input);
      if (offers === 0) return 0;
      const progression = clamp((offers + counters * 0.5) / 4, 0, 1);
      return roundScore5(progression * weight);
    }
    default:
      return 0;
  }
}
function buildRecommendationsFromSnapshot5(input) {
  const recommendations = [];
  const currentScore = computeNegotiationProgressScore(input);
  let index = 0;
  if (input.pendingCounterOffer || input.status === "countered") {
    recommendations.push({
      id: `negotiation-rec-counter-${index}`,
      label: "Review and respond to the counter-offer",
      reasonCode: NEGOTIATION_REASON_CODES.COUNTER_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 25,
      estimatedScore: roundScore5(Math.min(100, currentScore + 15)),
      href: negotiationStatusToHref(input.entityId, "offers"),
      category: "offers",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (input.currentOffer && input.status !== "agreed" && input.status !== "expired" && input.status !== "cancelled" && !input.pendingCounterOffer) {
    recommendations.push({
      id: `negotiation-rec-accept-${index}`,
      label: "Accept the current offer to proceed",
      reasonCode: NEGOTIATION_REASON_CODES.OFFER_ACCEPTED,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 40,
      estimatedScore: 100,
      href: negotiationStatusToHref(input.entityId, "offers"),
      category: "offers",
      severity: EXPLANATION_SEVERITY.INFO
    });
    index += 1;
  }
  if (input.changesRequested) {
    recommendations.push({
      id: `negotiation-rec-changes-${index}`,
      label: "Resolve requested changes and resubmit",
      reasonCode: NEGOTIATION_REASON_CODES.CHANGES_REQUESTED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 30,
      estimatedScore: roundScore5(Math.min(100, currentScore + 20)),
      href: negotiationStatusToHref(input.entityId, "terms"),
      category: "review",
      severity: EXPLANATION_SEVERITY.CRITICAL
    });
    index += 1;
  }
  if (isResponseDelayed(input.responseDelayDays)) {
    recommendations.push({
      id: `negotiation-rec-delay-${index}`,
      label: "Respond to pending negotiation items",
      reasonCode: NEGOTIATION_REASON_CODES.RESPONSE_DELAY,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 20,
      estimatedScore: roundScore5(Math.min(100, currentScore + 10)),
      href: negotiationStatusToHref(input.entityId, "messages"),
      category: "timeliness",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (isLargePriceGap(input.priceGap?.percent)) {
    recommendations.push({
      id: `negotiation-rec-price-${index}`,
      label: "Submit a revised offer to close the price gap",
      reasonCode: NEGOTIATION_REASON_CODES.PRICE_GAP,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.priceAlignment,
      estimatedScore: roundScore5(Math.min(100, currentScore + 20)),
      href: negotiationStatusToHref(input.entityId, "offers"),
      category: "commercial",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  for (const gap of input.commercialTermsGaps ?? []) {
    recommendations.push({
      id: `negotiation-rec-term-${gap.field}-${index}`,
      label: `Align ${gap.label.toLowerCase()} terms`,
      reasonCode: negotiationGapToReasonCode(),
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: roundScore5(
        NEGOTIATION_ADAPTER_SCORE_WEIGHTS.termsAlignment / Math.max(1, input.commercialTermsGaps?.length ?? 1)
      ),
      estimatedScore: roundScore5(Math.min(100, currentScore + 8)),
      href: negotiationTermsFieldToHref(input.entityId, gap.field),
      category: gap.field,
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (resolveOfferCount(input) === 0 && input.status === "active" && !input.changesRequested) {
    recommendations.push({
      id: `negotiation-rec-submit-${index}`,
      label: "Submit an initial offer",
      reasonCode: NEGOTIATION_REASON_CODES.NO_OFFERS,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: NEGOTIATION_ADAPTER_SCORE_WEIGHTS.offerProgression,
      estimatedScore: 55,
      href: negotiationStatusToHref(input.entityId, "offers"),
      category: "offers",
      severity: EXPLANATION_SEVERITY.WARNING
    });
  }
  return recommendations;
}
function buildBreakdownFromSnapshot5(input) {
  return Object.keys(NEGOTIATION_ADAPTER_SCORE_WEIGHTS).map((dimension) => {
    const weight = NEGOTIATION_ADAPTER_SCORE_WEIGHTS[dimension];
    const score = dimensionScore2(input, dimension);
    const reasonCodes = [];
    if (dimension === "priceAlignment" && input.priceGap) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.PRICE_GAP);
    }
    if (dimension === "termsAlignment" && (input.commercialTermsGaps?.length ?? 0) > 0) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.TERMS_MISMATCH);
    }
    if (dimension === "responseTimeliness" && isResponseDelayed(input.responseDelayDays)) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.RESPONSE_DELAY);
    }
    if (dimension === "offerProgression" && resolveOfferCount(input) === 0) {
      reasonCodes.push(NEGOTIATION_REASON_CODES.NO_OFFERS);
    }
    return {
      label: NEGOTIATION_BREAKDOWN_LABELS[dimension],
      weight,
      score,
      maxScore: weight,
      reasonCodes
    };
  });
}
function mapTimelineStatus(status) {
  if (status === "blocked" || status === "failed") {
    return TIMELINE_EVENT_STATUS.BLOCKED;
  }
  if (status === "pending") {
    return TIMELINE_EVENT_STATUS.PENDING;
  }
  if (status === "in_progress" || status === "active") {
    return TIMELINE_EVENT_STATUS.ACTIVE;
  }
  return TIMELINE_EVENT_STATUS.COMPLETED;
}
function buildTimelineFromSnapshot5(input) {
  if (input.timelineEvents && input.timelineEvents.length > 0) {
    return input.timelineEvents.map((event) => ({
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      status: mapTimelineStatus(event.status),
      relatedEntity: input.entityId
    }));
  }
  const events = [];
  const evaluatedAt = resolveGeneratedAt5(input);
  if (input.currentOffer?.submittedAt) {
    events.push({
      type: "offer-submitted",
      title: "Offer submitted",
      description: input.currentOffer.termsSummary ?? `Offer submitted${input.currentOffer.submittedBy ? ` by ${input.currentOffer.submittedBy}` : ""}.`,
      timestamp: input.currentOffer.submittedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (resolveCounterOfferCount(input) > 0 || input.status === "countered") {
    events.push({
      type: "counter-offered",
      title: "Counter-offer submitted",
      description: input.pendingCounterOffer ? "Counter-offer awaiting response." : "Parties exchanged counter-offers.",
      timestamp: input.currentOffer?.submittedAt ?? evaluatedAt,
      status: input.pendingCounterOffer ? TIMELINE_EVENT_STATUS.PENDING : TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (input.status === "agreed" || input.acceptedOffer) {
    events.push({
      type: "negotiation-agreed",
      title: "Negotiation agreed",
      description: input.acceptedOffer?.termsSummary ?? "Commercial terms accepted by both parties.",
      timestamp: input.acceptedOffer?.submittedAt ?? evaluatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (input.status === "expired") {
    events.push({
      type: "negotiation-expired",
      title: "Negotiation expired",
      description: "Negotiation window closed without agreement.",
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId
    });
  }
  if (input.status === "cancelled") {
    events.push({
      type: "negotiation-cancelled",
      title: "Negotiation cancelled",
      description: "Negotiation was cancelled by a participant.",
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId
    });
  }
  if (events.length === 0) {
    events.push({
      type: "negotiation-active",
      title: "Negotiation opened",
      description: statusMessage(input.status),
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId
    });
  }
  return events;
}
function buildNegotiationExplanation(input) {
  const scorePercent = computeNegotiationProgressScore(input);
  const generatedAt = resolveGeneratedAt5(input);
  return {
    engine: ENGINE_ID.NEGOTIATION,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth5(input, scorePercent),
    summary: buildSummary5(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot5(input),
    reasons: buildReasons5(input, scorePercent),
    blockers: buildBlockers5(input),
    strengths: buildStrengths5(input),
    weaknesses: buildWeaknesses5(input),
    recommendations: buildRecommendationsFromSnapshot5(input),
    timeline: buildTimelineFromSnapshot5(input),
    metadata: {
      generatedAt,
      engineVersion: NEGOTIATION_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: "negotiation-adapter",
      tags: [input.status],
      extensions: {
        offerCount: resolveOfferCount(input),
        counterOfferCount: resolveCounterOfferCount(input),
        status: input.status,
        pendingCounterOffer: input.pendingCounterOffer ?? false,
        changesRequested: input.changesRequested ?? false
      }
    }
  };
}
var negotiationExplainabilityAdapter = {
  buildExplanation: buildNegotiationExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot5,
  buildBreakdown: buildBreakdownFromSnapshot5,
  buildTimeline: buildTimelineFromSnapshot5
};

// src/adapters/agreement-field-map.ts
var AGREEMENT_ADAPTER_SCORE_WEIGHTS = {
  stageProgression: 35,
  commercialApproval: 25,
  signatures: 25,
  contractLinkage: 15
};
var AGREEMENT_BREAKDOWN_LABELS = {
  stageProgression: "Stage progression",
  commercialApproval: "Commercial approval",
  signatures: "Signatures",
  contractLinkage: "Contract linkage"
};
var AGREEMENT_STATUS_TO_REASON_CODE = {
  draft: AGREEMENT_REASON_CODES.STATUS_DRAFT,
  review: AGREEMENT_REASON_CODES.STATUS_REVIEW,
  signing: AGREEMENT_REASON_CODES.STATUS_SIGNING,
  executing: AGREEMENT_REASON_CODES.STATUS_EXECUTING,
  completed: AGREEMENT_REASON_CODES.STATUS_COMPLETED,
  cancelled: AGREEMENT_REASON_CODES.STATUS_CANCELLED
};
function agreementStatusToReasonCode(status) {
  return AGREEMENT_STATUS_TO_REASON_CODE[status];
}
function agreementStatusToHref(entityId, section) {
  const base = `/commercial-agreements/${entityId}`;
  if (section) return `${base}/${section}`;
  return base;
}
function commercialDecisionToReasonCode() {
  return COMMERCIAL_REASON_CODES.APPROVAL_PENDING;
}
function commercialAwardToReasonCode() {
  return COMMERCIAL_REASON_CODES.AWARD_PENDING;
}
function isDecisionPending(decisionStatus) {
  return decisionStatus === "pending";
}
function isAwardPending(awardStatus) {
  return awardStatus === "pending";
}
function hasPendingSignatures(pendingSignatures, totalSignatures) {
  if (pendingSignatures != null && pendingSignatures > 0) return true;
  if (totalSignatures != null && pendingSignatures != null && pendingSignatures < totalSignatures) {
    return pendingSignatures > 0;
  }
  return false;
}

// src/adapters/agreement-adapter.ts
var AGREEMENT_ADAPTER_VERSION = "1.0.0";
function roundScore6(value) {
  return Math.round(value * 100) / 100;
}
function clamp2(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function resolveGeneratedAt6(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
var STAGE_SCORE = {
  draft: 25,
  review: 45,
  signing: 65,
  executing: 85,
  completed: 100,
  cancelled: 10
};
function computeAgreementProgressScore(input) {
  let score = STAGE_SCORE[input.status];
  if (isDecisionPending(input.decisionStatus)) {
    score -= 15;
  }
  if (isAwardPending(input.awardStatus)) {
    score -= 10;
  }
  if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures) && input.status === "signing") {
    score -= 10;
  }
  if (!input.linkedContractId && input.canCreateContract && (input.status === "signing" || input.status === "executing")) {
    score -= 5;
  }
  if ((input.stageBlockers?.length ?? 0) > 0) {
    score -= Math.min(20, (input.stageBlockers?.length ?? 0) * 5);
  }
  return roundScore6(clamp2(score, 0, 100));
}
function resolveHealth6(input, scorePercent) {
  if (input.status === "completed") return HEALTH.EXCELLENT;
  if (input.status === "cancelled") return HEALTH.CRITICAL;
  if (input.status === "executing" && scorePercent >= 80) return HEALTH.GOOD;
  if (input.status === "signing" && scorePercent >= 60) return HEALTH.GOOD;
  if (input.status === "review" || input.status === "signing") {
    return HEALTH.WARNING;
  }
  if (input.status === "executing") return HEALTH.WARNING;
  return HEALTH.CRITICAL;
}
function statusMessage2(status) {
  switch (status) {
    case "draft":
      return "Commercial agreement is in draft \u2014 terms are being prepared.";
    case "review":
      return "Commercial agreement is under review \u2014 approval may be required.";
    case "signing":
      return "Commercial agreement is in signing \u2014 parties must sign to proceed.";
    case "executing":
      return "Commercial agreement is executing \u2014 deliverables are in progress.";
    case "completed":
      return "Commercial agreement completed \u2014 all obligations fulfilled.";
    case "cancelled":
      return "Commercial agreement cancelled \u2014 no further actions apply.";
    default:
      return `Commercial agreement status: ${status}`;
  }
}
function buildSummary6(input, scorePercent) {
  if (input.status === "completed") {
    return "Commercial agreement completed \u2014 all stages fulfilled.";
  }
  if (input.status === "cancelled") {
    return "Commercial agreement cancelled \u2014 review history for context.";
  }
  if (isDecisionPending(input.decisionStatus)) {
    return "Commercial approval pending \u2014 resolve decision gates to advance.";
  }
  if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures) && input.status === "signing") {
    return "Signatures pending \u2014 all parties must sign before execution.";
  }
  if (input.status === "review") {
    return "Review in progress \u2014 complete review to move to signing.";
  }
  if (!input.linkedContractId && input.canCreateContract) {
    return "Agreement ready \u2014 create a contract to formalize terms.";
  }
  return `Agreement progress ${Math.round(scorePercent)}% \u2014 ${statusMessage2(input.status).toLowerCase()}`;
}
function buildReasons6(input, scorePercent) {
  const reasons = [
    {
      code: AGREEMENT_REASON_CODES.SCORE_SUMMARY,
      message: `Agreement progress ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary",
      relatedEntityId: input.entityId
    },
    {
      code: agreementStatusToReasonCode(input.status),
      message: statusMessage2(input.status),
      severity: input.status === "cancelled" ? EXPLANATION_SEVERITY.CRITICAL : input.status === "completed" ? EXPLANATION_SEVERITY.INFO : EXPLANATION_SEVERITY.WARNING,
      category: "status",
      relatedEntityId: input.entityId
    }
  ];
  if (isDecisionPending(input.decisionStatus)) {
    reasons.push({
      code: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      message: "Commercial approval decision is pending.",
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: "commercial",
      relatedEntityId: input.entityId
    });
  }
  if (isAwardPending(input.awardStatus)) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.AWARD_PENDING,
      message: "Award decision is pending.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "award",
      relatedEntityId: input.entityId
    });
  }
  if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures)) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      message: `${input.pendingSignatures ?? "Some"} signature(s) still pending.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "signing",
      relatedEntityId: input.entityId
    });
  }
  if (!input.linkedContractId && input.canCreateContract && input.status !== "draft" && input.status !== "cancelled") {
    reasons.push({
      code: AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      message: "No contract linked \u2014 create one to formalize the agreement.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "contract",
      relatedEntityId: input.entityId
    });
  }
  for (const blocker of input.stageBlockers ?? []) {
    reasons.push({
      code: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      message: blocker.label,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: blocker.code,
      relatedEntityId: input.entityId
    });
  }
  if (input.status === "review") {
    reasons.push({
      code: AGREEMENT_REASON_CODES.REVIEW_INCOMPLETE,
      message: "Review stage incomplete \u2014 complete review to advance.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "review",
      relatedEntityId: input.entityId
    });
  }
  return reasons;
}
function buildBlockers6(input) {
  const blockers = [];
  if (isDecisionPending(input.decisionStatus)) {
    blockers.push({
      reasonCode: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Obtain commercial approval before advancing the agreement."
    });
  }
  if (input.status === "cancelled") {
    blockers.push({
      reasonCode: AGREEMENT_REASON_CODES.STATUS_CANCELLED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Agreement was cancelled \u2014 initiate a new agreement to proceed."
    });
  }
  for (const gate of input.stageBlockers ?? []) {
    blockers.push({
      reasonCode: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: gate.resolutionHint ?? `Resolve: ${gate.label}`
    });
  }
  if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures) && input.status === "signing") {
    blockers.push({
      reasonCode: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: "Collect all required signatures before moving to execution."
    });
  }
  return blockers;
}
function buildStrengths6(input) {
  const strengths = [];
  if (input.status === "completed") {
    strengths.push({
      code: AGREEMENT_REASON_CODES.STATUS_COMPLETED,
      label: "Agreement completed",
      impactPercent: 40
    });
  }
  if (input.decisionStatus === "approved") {
    strengths.push({
      code: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      label: "Commercial approval granted",
      impactPercent: 25
    });
  }
  if (input.linkedContractId) {
    strengths.push({
      code: AGREEMENT_REASON_CODES.STATUS_EXECUTING,
      label: "Contract linked",
      impactPercent: 20
    });
  }
  if (input.status === "signing" && !hasPendingSignatures(input.pendingSignatures, input.totalSignatures) && (input.totalSignatures ?? 0) > 0) {
    strengths.push({
      code: AGREEMENT_REASON_CODES.STATUS_SIGNING,
      label: "All signatures collected",
      impactPercent: 25
    });
  }
  return strengths;
}
function buildWeaknesses6(input) {
  const weaknesses = [];
  if (isDecisionPending(input.decisionStatus)) {
    weaknesses.push({
      code: COMMERCIAL_REASON_CODES.APPROVAL_PENDING,
      label: "Commercial approval pending",
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.commercialApproval
    });
  }
  if (isAwardPending(input.awardStatus)) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.AWARD_PENDING,
      label: "Award decision pending",
      impactPercent: 15
    });
  }
  if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures)) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      label: "Signatures incomplete",
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.signatures
    });
  }
  if (!input.linkedContractId && input.canCreateContract) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      label: "Contract not yet created",
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.contractLinkage
    });
  }
  for (const blocker of input.stageBlockers ?? []) {
    weaknesses.push({
      code: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      label: blocker.label,
      impactPercent: roundScore6(
        AGREEMENT_ADAPTER_SCORE_WEIGHTS.stageProgression / Math.max(1, input.stageBlockers?.length ?? 1)
      )
    });
  }
  return weaknesses;
}
function dimensionScore3(input, dimension) {
  const weight = AGREEMENT_ADAPTER_SCORE_WEIGHTS[dimension];
  switch (dimension) {
    case "stageProgression": {
      const base = STAGE_SCORE[input.status] / 100;
      return roundScore6(base * weight);
    }
    case "commercialApproval": {
      if (input.decisionStatus === "approved" || input.decisionStatus === "not_required") {
        return weight;
      }
      if (isDecisionPending(input.decisionStatus)) return 0;
      return roundScore6(weight * 0.5);
    }
    case "signatures": {
      if (input.status === "completed" || input.status === "executing") {
        return weight;
      }
      if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures)) {
        const total = input.totalSignatures ?? 1;
        const pending = input.pendingSignatures ?? total;
        const signed = Math.max(0, total - pending);
        return roundScore6(signed / total * weight);
      }
      if (input.status === "signing") return roundScore6(weight * 0.3);
      return weight;
    }
    case "contractLinkage": {
      if (input.linkedContractId) return weight;
      if (input.canCreateContract) return roundScore6(weight * 0.4);
      return 0;
    }
    default:
      return 0;
  }
}
function buildRecommendationsFromSnapshot6(input) {
  const recommendations = [];
  const currentScore = computeAgreementProgressScore(input);
  let index = 0;
  if (isDecisionPending(input.decisionStatus)) {
    recommendations.push({
      id: `agreement-rec-approval-${index}`,
      label: "Obtain commercial approval to advance",
      reasonCode: commercialDecisionToReasonCode(),
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.commercialApproval,
      estimatedScore: roundScore6(Math.min(100, currentScore + 20)),
      href: agreementStatusToHref(input.entityId, "review"),
      category: "commercial",
      severity: EXPLANATION_SEVERITY.CRITICAL
    });
    index += 1;
  }
  if (input.status === "review") {
    recommendations.push({
      id: `agreement-rec-review-${index}`,
      label: "Complete review and advance to signing",
      reasonCode: AGREEMENT_REASON_CODES.REVIEW_INCOMPLETE,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.stageProgression,
      estimatedScore: roundScore6(Math.min(100, currentScore + 15)),
      href: agreementStatusToHref(input.entityId, "review"),
      category: "review",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (hasPendingSignatures(input.pendingSignatures, input.totalSignatures) && input.status === "signing") {
    recommendations.push({
      id: `agreement-rec-sign-${index}`,
      label: "Collect pending signatures from all parties",
      reasonCode: AGREEMENT_REASON_CODES.SIGNATURES_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.signatures,
      estimatedScore: roundScore6(Math.min(100, currentScore + 15)),
      href: agreementStatusToHref(input.entityId, "signing"),
      category: "signing",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (!input.linkedContractId && input.canCreateContract && input.status !== "draft" && input.status !== "cancelled" && input.status !== "completed") {
    recommendations.push({
      id: `agreement-rec-contract-${index}`,
      label: "Create contract from commercial agreement",
      reasonCode: AGREEMENT_REASON_CODES.CONTRACT_MISSING,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: AGREEMENT_ADAPTER_SCORE_WEIGHTS.contractLinkage,
      estimatedScore: roundScore6(Math.min(100, currentScore + 10)),
      href: agreementStatusToHref(input.entityId, "contract"),
      category: "contract",
      severity: EXPLANATION_SEVERITY.INFO
    });
    index += 1;
  }
  if (input.status === "signing" && !hasPendingSignatures(input.pendingSignatures, input.totalSignatures)) {
    recommendations.push({
      id: `agreement-rec-advance-${index}`,
      label: "Advance agreement to execution stage",
      reasonCode: AGREEMENT_REASON_CODES.STATUS_EXECUTING,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 20,
      estimatedScore: roundScore6(Math.min(100, currentScore + 20)),
      href: agreementStatusToHref(input.entityId),
      category: "stage",
      severity: EXPLANATION_SEVERITY.INFO
    });
    index += 1;
  }
  if (isAwardPending(input.awardStatus)) {
    recommendations.push({
      id: `agreement-rec-award-${index}`,
      label: "Complete award decision",
      reasonCode: commercialAwardToReasonCode(),
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 15,
      estimatedScore: roundScore6(Math.min(100, currentScore + 10)),
      href: agreementStatusToHref(input.entityId, "review"),
      category: "award",
      severity: EXPLANATION_SEVERITY.WARNING
    });
  }
  for (const blocker of input.stageBlockers ?? []) {
    recommendations.push({
      id: `agreement-rec-gate-${blocker.code}-${index}`,
      label: `Resolve stage gate: ${blocker.label}`,
      reasonCode: AGREEMENT_REASON_CODES.STAGE_GATE_BLOCKED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: roundScore6(
        AGREEMENT_ADAPTER_SCORE_WEIGHTS.stageProgression / Math.max(1, input.stageBlockers?.length ?? 1)
      ),
      estimatedScore: roundScore6(Math.min(100, currentScore + 10)),
      href: agreementStatusToHref(input.entityId),
      category: blocker.code,
      severity: EXPLANATION_SEVERITY.CRITICAL
    });
    index += 1;
  }
  return recommendations;
}
function buildBreakdownFromSnapshot6(input) {
  return Object.keys(AGREEMENT_ADAPTER_SCORE_WEIGHTS).map((dimension) => {
    const weight = AGREEMENT_ADAPTER_SCORE_WEIGHTS[dimension];
    const score = dimensionScore3(input, dimension);
    const reasonCodes = [];
    if (dimension === "stageProgression") {
      reasonCodes.push(agreementStatusToReasonCode(input.status));
    }
    if (dimension === "commercialApproval" && isDecisionPending(input.decisionStatus)) {
      reasonCodes.push(COMMERCIAL_REASON_CODES.APPROVAL_PENDING);
    }
    if (dimension === "signatures" && hasPendingSignatures(input.pendingSignatures, input.totalSignatures)) {
      reasonCodes.push(AGREEMENT_REASON_CODES.SIGNATURES_PENDING);
    }
    if (dimension === "contractLinkage" && !input.linkedContractId) {
      reasonCodes.push(AGREEMENT_REASON_CODES.CONTRACT_MISSING);
    }
    return {
      label: AGREEMENT_BREAKDOWN_LABELS[dimension],
      weight,
      score,
      maxScore: weight,
      reasonCodes
    };
  });
}
function mapTimelineStatus2(status) {
  if (status === "blocked" || status === "failed" || status === "cancelled") {
    return TIMELINE_EVENT_STATUS.BLOCKED;
  }
  if (status === "pending") {
    return TIMELINE_EVENT_STATUS.PENDING;
  }
  if (status === "in_progress" || status === "active") {
    return TIMELINE_EVENT_STATUS.ACTIVE;
  }
  return TIMELINE_EVENT_STATUS.COMPLETED;
}
function buildTimelineFromSnapshot6(input) {
  if (input.timelineEvents && input.timelineEvents.length > 0) {
    return input.timelineEvents.map((event) => ({
      type: event.type,
      title: event.title,
      description: event.description ?? event.title,
      timestamp: event.timestamp,
      status: mapTimelineStatus2(event.status),
      relatedEntity: input.entityId
    }));
  }
  const events = [];
  const evaluatedAt = resolveGeneratedAt6(input);
  if (input.createdAt) {
    events.push({
      type: "agreement-created",
      title: "Agreement created",
      description: "Commercial agreement draft opened.",
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  for (const transition of input.stageTransitions ?? []) {
    events.push({
      type: `agreement-${transition.stage}`,
      title: `Stage: ${transition.stage}`,
      description: statusMessage2(transition.stage),
      timestamp: transition.timestamp,
      status: transition.stage === input.status ? TIMELINE_EVENT_STATUS.ACTIVE : TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (input.status === "cancelled") {
    events.push({
      type: "agreement-cancelled",
      title: "Agreement cancelled",
      description: "Commercial agreement was cancelled.",
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId
    });
  }
  if (input.status === "completed") {
    events.push({
      type: "agreement-completed",
      title: "Agreement completed",
      description: "All agreement obligations fulfilled.",
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (events.length === 0) {
    events.push({
      type: "agreement-active",
      title: "Agreement in progress",
      description: statusMessage2(input.status),
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId
    });
  }
  return events;
}
function buildAgreementExplanation(input) {
  const scorePercent = computeAgreementProgressScore(input);
  const generatedAt = resolveGeneratedAt6(input);
  return {
    engine: ENGINE_ID.AGREEMENT,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth6(input, scorePercent),
    summary: buildSummary6(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot6(input),
    reasons: buildReasons6(input, scorePercent),
    blockers: buildBlockers6(input),
    strengths: buildStrengths6(input),
    weaknesses: buildWeaknesses6(input),
    recommendations: buildRecommendationsFromSnapshot6(input),
    timeline: buildTimelineFromSnapshot6(input),
    metadata: {
      generatedAt,
      engineVersion: AGREEMENT_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: "agreement-adapter",
      tags: [input.status],
      extensions: {
        status: input.status,
        decisionStatus: input.decisionStatus ?? null,
        awardStatus: input.awardStatus ?? null,
        linkedContractId: input.linkedContractId ?? null,
        linkedNegotiationId: input.linkedNegotiationId ?? null,
        pendingSignatures: input.pendingSignatures ?? null,
        canCreateContract: input.canCreateContract ?? false
      }
    }
  };
}
var agreementExplainabilityAdapter = {
  buildExplanation: buildAgreementExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot6,
  buildBreakdown: buildBreakdownFromSnapshot6,
  buildTimeline: buildTimelineFromSnapshot6
};

// src/adapters/contract-field-map.ts
var CONTRACT_ADAPTER_SCORE_WEIGHTS = {
  signatures: 35,
  activation: 25,
  execution: 25,
  milestones: 15
};
var CONTRACT_BREAKDOWN_LABELS = {
  signatures: "Party signatures",
  activation: "Activation readiness",
  execution: "Execution progress",
  milestones: "Milestone delivery"
};
var CONTRACT_STATUS_TO_REASON_CODE = {
  draft: CONTRACT_REASON_CODES.STATUS_DRAFT,
  pending_signature: CONTRACT_REASON_CODES.STATUS_PENDING_SIGNATURE,
  active: CONTRACT_REASON_CODES.STATUS_ACTIVE,
  completed: CONTRACT_REASON_CODES.STATUS_COMPLETED,
  terminated: CONTRACT_REASON_CODES.STATUS_TERMINATED
};
function contractStatusToReasonCode(status) {
  return CONTRACT_STATUS_TO_REASON_CODE[status];
}
function contractStatusToHref(entityId, section) {
  const base = `/contracts/${entityId}`;
  if (section) return `${base}/${section}`;
  return base;
}
function resolvePartiesSigned(partiesSigned, parties) {
  if (partiesSigned != null) return partiesSigned;
  if (!parties) return 0;
  return parties.filter((party) => Boolean(party.signedAt)).length;
}
function resolveTotalParties(totalParties, parties) {
  if (totalParties != null) return totalParties;
  return parties?.length ?? 0;
}
function hasUnsignedParties(partiesSigned, totalParties) {
  return totalParties > 0 && partiesSigned < totalParties;
}
function hasBlockedMilestones(milestones) {
  if (!milestones?.length) return false;
  return milestones.some(
    (milestone) => milestone.status === "blocked" || milestone.status === "overdue" || milestone.status === "failed"
  );
}

// src/adapters/contract-adapter.ts
var CONTRACT_ADAPTER_VERSION = "1.0.0";
function roundScore7(value) {
  return Math.round(value * 100) / 100;
}
function clamp3(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function resolveGeneratedAt7(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
var STAGE_SCORE2 = {
  draft: 25,
  pending_signature: 55,
  active: 85,
  completed: 100,
  terminated: 10
};
function computeContractProgressScore(input) {
  let score = STAGE_SCORE2[input.status];
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  if (input.status === "pending_signature" && hasUnsignedParties(partiesSigned, totalParties)) {
    const signedRatio = totalParties > 0 ? partiesSigned / totalParties : 0;
    score = roundScore7(40 + signedRatio * 25);
  }
  if (hasBlockedMilestones(input.milestones) && input.status === "active") {
    score -= 15;
  }
  if (input.status === "active" && input.canComplete) {
    score = Math.max(score, 90);
  }
  return roundScore7(clamp3(score, 0, 100));
}
function resolveHealth7(input, scorePercent) {
  if (input.status === "completed") return HEALTH.EXCELLENT;
  if (input.status === "terminated") return HEALTH.CRITICAL;
  if (input.status === "active" && scorePercent >= 80) return HEALTH.GOOD;
  if (input.status === "pending_signature") return HEALTH.WARNING;
  if (input.status === "active") return HEALTH.WARNING;
  if (input.status === "draft") return HEALTH.CRITICAL;
  return HEALTH.CRITICAL;
}
function statusMessage3(status) {
  switch (status) {
    case "draft":
      return "Contract is in draft \u2014 terms are being finalized.";
    case "pending_signature":
      return "Contract pending signature \u2014 parties must sign to activate.";
    case "active":
      return "Contract is active \u2014 deliverables are in progress.";
    case "completed":
      return "Contract completed \u2014 all obligations fulfilled.";
    case "terminated":
      return "Contract terminated \u2014 no further obligations apply.";
    default:
      return `Contract status: ${status}`;
  }
}
function buildSummary7(input, scorePercent) {
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  if (input.status === "completed") {
    return "Contract completed \u2014 all milestones and obligations fulfilled.";
  }
  if (input.status === "terminated") {
    return input.terminationReason ? `Contract terminated \u2014 ${input.terminationReason}` : "Contract terminated \u2014 review termination details.";
  }
  if (input.status === "pending_signature" && hasUnsignedParties(partiesSigned, totalParties)) {
    return `${totalParties - partiesSigned} of ${totalParties} signature(s) pending \u2014 sign to activate.`;
  }
  if (input.status === "active" && input.canComplete) {
    return "Contract active \u2014 ready to mark as completed.";
  }
  if (hasBlockedMilestones(input.milestones)) {
    return "Contract active \u2014 blocked milestone(s) require attention.";
  }
  return `Contract progress ${Math.round(scorePercent)}% \u2014 ${statusMessage3(input.status).toLowerCase()}`;
}
function buildReasons7(input, scorePercent) {
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  const reasons = [
    {
      code: CONTRACT_REASON_CODES.SCORE_SUMMARY,
      message: `Contract progress ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "summary",
      relatedEntityId: input.entityId
    },
    {
      code: contractStatusToReasonCode(input.status),
      message: statusMessage3(input.status),
      severity: input.status === "terminated" ? EXPLANATION_SEVERITY.CRITICAL : input.status === "completed" ? EXPLANATION_SEVERITY.INFO : EXPLANATION_SEVERITY.WARNING,
      category: "status",
      relatedEntityId: input.entityId
    }
  ];
  if (hasUnsignedParties(partiesSigned, totalParties) && (input.status === "pending_signature" || input.status === "draft")) {
    reasons.push({
      code: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      message: `${totalParties - partiesSigned} of ${totalParties} party signature(s) pending.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "signatures",
      relatedEntityId: input.entityId
    });
  }
  if (input.status === "pending_signature" && !hasUnsignedParties(partiesSigned, totalParties) && totalParties > 0) {
    reasons.push({
      code: CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      message: "All signatures collected \u2014 contract activation pending.",
      severity: EXPLANATION_SEVERITY.INFO,
      category: "activation",
      relatedEntityId: input.entityId
    });
  }
  if (input.status === "active" && input.canComplete) {
    reasons.push({
      code: CONTRACT_REASON_CODES.COMPLETION_READY,
      message: "Contract eligible for completion.",
      severity: EXPLANATION_SEVERITY.INFO,
      category: "completion",
      relatedEntityId: input.entityId
    });
  }
  if (input.status === "terminated" && input.terminationReason) {
    reasons.push({
      code: CONTRACT_REASON_CODES.STATUS_TERMINATED,
      message: input.terminationReason,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: "termination",
      relatedEntityId: input.entityId
    });
  }
  if (hasBlockedMilestones(input.milestones)) {
    reasons.push({
      code: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      message: "One or more milestones are blocked or overdue.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "milestones",
      relatedEntityId: input.entityId
    });
  }
  return reasons;
}
function buildBlockers7(input) {
  const blockers = [];
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  if (hasUnsignedParties(partiesSigned, totalParties) && input.status === "pending_signature") {
    blockers.push({
      reasonCode: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: "All parties must sign before the contract can activate."
    });
  }
  if (input.status === "terminated") {
    blockers.push({
      reasonCode: CONTRACT_REASON_CODES.STATUS_TERMINATED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: input.terminationReason ?? "Contract was terminated \u2014 no further actions apply."
    });
  }
  if (hasBlockedMilestones(input.milestones) && input.status === "active") {
    blockers.push({
      reasonCode: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: "Resolve blocked or overdue milestones to continue execution."
    });
  }
  return blockers;
}
function buildStrengths7(input) {
  const strengths = [];
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  if (input.status === "completed") {
    strengths.push({
      code: CONTRACT_REASON_CODES.STATUS_COMPLETED,
      label: "Contract completed",
      impactPercent: 40
    });
  }
  if (totalParties > 0 && partiesSigned === totalParties && input.status !== "draft") {
    strengths.push({
      code: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      label: "All parties signed",
      impactPercent: 30
    });
  }
  if (input.status === "active" && !hasBlockedMilestones(input.milestones)) {
    strengths.push({
      code: CONTRACT_REASON_CODES.STATUS_ACTIVE,
      label: "Execution on track",
      impactPercent: 25
    });
  }
  return strengths;
}
function buildWeaknesses7(input) {
  const weaknesses = [];
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  if (hasUnsignedParties(partiesSigned, totalParties)) {
    weaknesses.push({
      code: CONTRACT_REASON_CODES.SIGNATURES_INCOMPLETE,
      label: `${totalParties - partiesSigned} unsigned party(ies)`,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.signatures
    });
  }
  if (input.status === "pending_signature" && !hasUnsignedParties(partiesSigned, totalParties) && totalParties > 0) {
    weaknesses.push({
      code: CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      label: "Activation pending after signatures",
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.activation
    });
  }
  if (hasBlockedMilestones(input.milestones)) {
    weaknesses.push({
      code: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      label: "Blocked milestones",
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.milestones
    });
  }
  return weaknesses;
}
function dimensionScore4(input, dimension) {
  const weight = CONTRACT_ADAPTER_SCORE_WEIGHTS[dimension];
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  switch (dimension) {
    case "signatures": {
      if (input.status === "completed" || input.status === "active") {
        return weight;
      }
      if (totalParties === 0) return roundScore7(weight * 0.5);
      return roundScore7(partiesSigned / totalParties * weight);
    }
    case "activation": {
      if (input.status === "active" || input.status === "completed") {
        return weight;
      }
      if (input.status === "pending_signature" && !hasUnsignedParties(partiesSigned, totalParties) && totalParties > 0) {
        return roundScore7(weight * 0.8);
      }
      return 0;
    }
    case "execution": {
      const base = STAGE_SCORE2[input.status] / 100;
      return roundScore7(base * weight);
    }
    case "milestones": {
      if (!input.milestones?.length) return weight;
      if (hasBlockedMilestones(input.milestones)) {
        return roundScore7(weight * 0.4);
      }
      const completed = input.milestones.filter(
        (m2) => m2.status === "completed" || m2.status === "done"
      ).length;
      return roundScore7(completed / input.milestones.length * weight);
    }
    default:
      return 0;
  }
}
function buildRecommendationsFromSnapshot7(input) {
  const recommendations = [];
  const currentScore = computeContractProgressScore(input);
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  let index = 0;
  if (input.canSign && hasUnsignedParties(partiesSigned, totalParties)) {
    recommendations.push({
      id: `contract-rec-sign-${index}`,
      label: "Sign the contract to proceed",
      reasonCode: CONTRACT_REASON_CODES.SIGNATURE_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.signatures,
      estimatedScore: roundScore7(Math.min(100, currentScore + 20)),
      href: contractStatusToHref(input.entityId, "sign"),
      category: "signatures",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (input.status === "pending_signature" && !hasUnsignedParties(partiesSigned, totalParties) && totalParties > 0) {
    recommendations.push({
      id: `contract-rec-activate-${index}`,
      label: "Activate contract \u2014 all signatures collected",
      reasonCode: CONTRACT_REASON_CODES.ACTIVATION_PENDING,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.activation,
      estimatedScore: roundScore7(Math.min(100, currentScore + 25)),
      href: contractStatusToHref(input.entityId),
      category: "activation",
      severity: EXPLANATION_SEVERITY.INFO
    });
    index += 1;
  }
  if (input.canComplete && input.status === "active") {
    recommendations.push({
      id: `contract-rec-complete-${index}`,
      label: "Mark contract as completed",
      reasonCode: CONTRACT_REASON_CODES.COMPLETION_READY,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 30,
      estimatedScore: 100,
      href: contractStatusToHref(input.entityId, "complete"),
      category: "completion",
      severity: EXPLANATION_SEVERITY.INFO
    });
    index += 1;
  }
  if (input.canTerminate && input.status !== "completed" && input.status !== "terminated") {
    recommendations.push({
      id: `contract-rec-terminate-${index}`,
      label: "Terminate contract (provide reason)",
      reasonCode: CONTRACT_REASON_CODES.TERMINATION_AVAILABLE,
      priority: RECOMMENDATION_PRIORITY.LOW,
      impactPercent: 5,
      estimatedScore: 10,
      href: contractStatusToHref(input.entityId, "terminate"),
      category: "termination",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (hasBlockedMilestones(input.milestones)) {
    recommendations.push({
      id: `contract-rec-milestone-${index}`,
      label: "Resolve blocked or overdue milestones",
      reasonCode: CONTRACT_REASON_CODES.MILESTONE_BLOCKED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: CONTRACT_ADAPTER_SCORE_WEIGHTS.milestones,
      estimatedScore: roundScore7(Math.min(100, currentScore + 15)),
      href: contractStatusToHref(input.entityId, "milestones"),
      category: "milestones",
      severity: EXPLANATION_SEVERITY.WARNING
    });
  }
  return recommendations;
}
function buildBreakdownFromSnapshot7(input) {
  return Object.keys(CONTRACT_ADAPTER_SCORE_WEIGHTS).map((dimension) => {
    const weight = CONTRACT_ADAPTER_SCORE_WEIGHTS[dimension];
    const score = dimensionScore4(input, dimension);
    const reasonCodes = [];
    const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
    const totalParties = resolveTotalParties(input.totalParties, input.parties);
    if (dimension === "signatures" && hasUnsignedParties(partiesSigned, totalParties)) {
      reasonCodes.push(CONTRACT_REASON_CODES.SIGNATURE_PENDING);
    }
    if (dimension === "activation" && input.status === "pending_signature") {
      reasonCodes.push(CONTRACT_REASON_CODES.ACTIVATION_PENDING);
    }
    if (dimension === "execution") {
      reasonCodes.push(contractStatusToReasonCode(input.status));
    }
    if (dimension === "milestones" && hasBlockedMilestones(input.milestones)) {
      reasonCodes.push(CONTRACT_REASON_CODES.MILESTONE_BLOCKED);
    }
    return {
      label: CONTRACT_BREAKDOWN_LABELS[dimension],
      weight,
      score,
      maxScore: weight,
      reasonCodes
    };
  });
}
function mapTimelineStatus3(status) {
  if (status === "blocked" || status === "failed" || status === "terminated") {
    return TIMELINE_EVENT_STATUS.BLOCKED;
  }
  if (status === "pending") {
    return TIMELINE_EVENT_STATUS.PENDING;
  }
  if (status === "in_progress" || status === "active") {
    return TIMELINE_EVENT_STATUS.ACTIVE;
  }
  return TIMELINE_EVENT_STATUS.COMPLETED;
}
function buildTimelineFromSnapshot7(input) {
  if (input.timelineEvents && input.timelineEvents.length > 0) {
    return input.timelineEvents.map((event) => ({
      type: event.type,
      title: event.title,
      description: event.description ?? event.title,
      timestamp: event.timestamp,
      status: mapTimelineStatus3(event.status),
      relatedEntity: input.entityId
    }));
  }
  const events = [];
  const evaluatedAt = resolveGeneratedAt7(input);
  if (input.createdAt) {
    events.push({
      type: "contract-created",
      title: "Contract created",
      description: "Contract draft opened.",
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  for (const party of input.parties ?? []) {
    if (party.signedAt) {
      events.push({
        type: "contract-signed",
        title: "Party signed",
        description: party.role ? `${party.role} signed the contract` : `Party ${party.userId} signed the contract`,
        timestamp: party.signedAt,
        status: TIMELINE_EVENT_STATUS.COMPLETED,
        relatedEntity: input.entityId
      });
    }
  }
  if (input.activatedAt) {
    events.push({
      type: "contract-activated",
      title: "Contract activated",
      description: "Contract entered active execution.",
      timestamp: input.activatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (input.completedAt) {
    events.push({
      type: "contract-completed",
      title: "Contract completed",
      description: input.completionReason ?? "All contract obligations fulfilled.",
      timestamp: input.completedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId
    });
  }
  if (input.terminatedAt || input.status === "terminated") {
    events.push({
      type: "contract-terminated",
      title: "Contract terminated",
      description: input.terminationReason ?? "Contract was terminated.",
      timestamp: input.terminatedAt ?? evaluatedAt,
      status: TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId
    });
  }
  if (events.length === 0) {
    events.push({
      type: "contract-active",
      title: "Contract in progress",
      description: statusMessage3(input.status),
      timestamp: evaluatedAt,
      status: input.status === "terminated" ? TIMELINE_EVENT_STATUS.BLOCKED : TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId
    });
  }
  return events;
}
function buildContractExplanation(input) {
  const scorePercent = computeContractProgressScore(input);
  const generatedAt = resolveGeneratedAt7(input);
  const partiesSigned = resolvePartiesSigned(input.partiesSigned, input.parties);
  const totalParties = resolveTotalParties(input.totalParties, input.parties);
  return {
    engine: ENGINE_ID.CONTRACT,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth7(input, scorePercent),
    summary: buildSummary7(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot7(input),
    reasons: buildReasons7(input, scorePercent),
    blockers: buildBlockers7(input),
    strengths: buildStrengths7(input),
    weaknesses: buildWeaknesses7(input),
    recommendations: buildRecommendationsFromSnapshot7(input),
    timeline: buildTimelineFromSnapshot7(input),
    metadata: {
      generatedAt,
      engineVersion: CONTRACT_ADAPTER_VERSION,
      locale: input.locale ?? "en-SA",
      source: "contract-adapter",
      tags: [input.status],
      extensions: {
        status: input.status,
        partiesSigned,
        totalParties,
        canSign: input.canSign ?? false,
        canComplete: input.canComplete ?? false,
        canTerminate: input.canTerminate ?? false
      }
    }
  };
}
var contractExplainabilityAdapter = {
  buildExplanation: buildContractExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot7,
  buildBreakdown: buildBreakdownFromSnapshot7,
  buildTimeline: buildTimelineFromSnapshot7
};

// src/adapters/dashboard-adapter.ts
var DASHBOARD_ADAPTER_VERSION = "1.0.0";
var DASHBOARD_ADAPTER_SCORE_WEIGHTS = {
  profileReadiness: 25,
  vettingReadiness: 20,
  pipelineActivity: 25,
  workflowMomentum: 20,
  contractExecution: 10
};
function roundScore8(value) {
  return Math.round(value * 100) / 100;
}
function resolveGeneratedAt8(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function resolveActivityScore(input) {
  const counts = [
    input.opportunityCount ?? 0,
    input.matchCount ?? 0,
    input.negotiationCount ?? 0,
    input.dealCount ?? 0,
    input.contractCount ?? 0
  ];
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;
  return roundScore8(Math.min(100, 20 + total * 8));
}
function resolveWorkflowMomentum(input) {
  const negotiations = input.negotiationCount ?? 0;
  const deals = input.dealCount ?? 0;
  const contracts = input.contractCount ?? 0;
  if (negotiations + deals + contracts === 0) return 30;
  return roundScore8(Math.min(100, 40 + deals * 15 + contracts * 10));
}
function computeDashboardScore(input) {
  const profile = input.profileScore ?? 0;
  const vetting = input.vettingScore ?? 100;
  const activity = resolveActivityScore(input);
  const momentum = resolveWorkflowMomentum(input);
  const contracts = input.contractCount ?? 0;
  const contractScore = contracts > 0 ? 100 : 50;
  const weighted = (profile * DASHBOARD_ADAPTER_SCORE_WEIGHTS.profileReadiness + vetting * DASHBOARD_ADAPTER_SCORE_WEIGHTS.vettingReadiness + activity * DASHBOARD_ADAPTER_SCORE_WEIGHTS.pipelineActivity + momentum * DASHBOARD_ADAPTER_SCORE_WEIGHTS.workflowMomentum + contractScore * DASHBOARD_ADAPTER_SCORE_WEIGHTS.contractExecution) / 100;
  return roundScore8(weighted);
}
function resolveHealth8(score) {
  if (score >= 85) return HEALTH.EXCELLENT;
  if (score >= 70) return HEALTH.GOOD;
  if (score >= 50) return HEALTH.WARNING;
  return HEALTH.CRITICAL;
}
function hasStalledPipeline(input) {
  const matches = input.matchCount ?? 0;
  const negotiations = input.negotiationCount ?? 0;
  const deals = input.dealCount ?? 0;
  return matches > 0 && negotiations === 0 && deals === 0;
}
function hasActionRequired(input) {
  const profileLow = (input.profileScore ?? 100) < 70;
  const vettingLow = input.vettingScore != null && input.vettingScore < 70;
  const pendingRecs = (input.aggregatedRecommendations?.length ?? 0) > 0;
  return profileLow || vettingLow || pendingRecs;
}
function buildReasons8(input) {
  const reasons = [];
  if (hasActionRequired(input)) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      message: "Workspace items need attention to keep the pipeline moving.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "attention"
    });
  }
  if (hasStalledPipeline(input)) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      message: "Matches exist but no negotiations or agreements have started.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "pipeline"
    });
  }
  if ((input.profileScore ?? 100) < 60 || (input.vettingScore ?? 100) < 60) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.DEADLINE_APPROACHING,
      message: "Readiness gaps may block upcoming publish or matching deadlines.",
      severity: EXPLANATION_SEVERITY.INFO,
      category: "readiness"
    });
  }
  if (input.heroMetric) {
    reasons.push({
      code: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      message: `${input.heroMetric.label}: ${input.heroMetric.value}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "hero"
    });
  }
  return reasons;
}
function buildBlockers8(input) {
  const blockers = [];
  if ((input.profileScore ?? 100) < 50) {
    blockers.push({
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Complete required profile fields from the dashboard recommendations."
    });
  }
  if (input.vettingScore != null && input.vettingScore < 50) {
    blockers.push({
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: "Upload pending compliance documents to unblock matching."
    });
  }
  return blockers;
}
function buildStrengths8(input) {
  const strengths = [];
  if ((input.profileScore ?? 0) >= 80) {
    strengths.push({
      code: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      label: "Strong profile readiness",
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.profileReadiness
    });
  }
  if ((input.contractCount ?? 0) > 0) {
    strengths.push({
      code: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      label: "Active contract execution",
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.contractExecution
    });
  }
  return strengths;
}
function buildWeaknesses8(input) {
  const weaknesses = [];
  if (hasStalledPipeline(input)) {
    weaknesses.push({
      code: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      label: "Pipeline stalled after matching",
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.workflowMomentum
    });
  }
  if ((input.opportunityCount ?? 0) === 0) {
    weaknesses.push({
      code: DASHBOARD_REASON_CODES.DEADLINE_APPROACHING,
      label: "No active opportunities",
      impactPercent: DASHBOARD_ADAPTER_SCORE_WEIGHTS.pipelineActivity
    });
  }
  return weaknesses;
}
function buildRecommendationsFromSnapshot8(input) {
  const recommendations = [];
  let index = 0;
  const score = computeDashboardScore(input);
  for (const rec of input.aggregatedRecommendations ?? []) {
    recommendations.push({
      ...rec,
      id: rec.id || `dashboard-agg-${index}`
    });
    index += 1;
  }
  if ((input.profileScore ?? 100) < 80) {
    recommendations.push({
      id: `dashboard-rec-profile-${index}`,
      label: "Improve profile readiness",
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 15,
      estimatedScore: roundScore8(Math.min(100, score + 12)),
      href: "/settings/profile",
      category: "profile",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (hasStalledPipeline(input)) {
    recommendations.push({
      id: `dashboard-rec-pipeline-${index}`,
      label: "Review matches and start negotiations",
      reasonCode: DASHBOARD_REASON_CODES.PIPELINE_STALLED,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 20,
      estimatedScore: roundScore8(Math.min(100, score + 15)),
      href: "/matches",
      category: "pipeline",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if ((input.opportunityCount ?? 0) > 0 && (input.matchCount ?? 0) === 0) {
    recommendations.push({
      id: `dashboard-rec-matching-${index}`,
      label: "Run matching on published opportunities",
      reasonCode: DASHBOARD_REASON_CODES.ACTION_REQUIRED,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 12,
      estimatedScore: roundScore8(Math.min(100, score + 10)),
      href: "/opportunities",
      category: "matching",
      severity: EXPLANATION_SEVERITY.INFO
    });
  }
  return recommendations;
}
function buildBreakdownFromSnapshot8(input) {
  const entries = [
    {
      label: "Profile readiness",
      score: input.profileScore ?? 0,
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.profileReadiness,
      maxScore: 100,
      reasonCodes: (input.profileScore ?? 100) < 70 ? [DASHBOARD_REASON_CODES.ACTION_REQUIRED] : []
    },
    {
      label: "Vetting readiness",
      score: input.vettingScore ?? 100,
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.vettingReadiness,
      maxScore: 100,
      reasonCodes: []
    },
    {
      label: "Pipeline activity",
      score: resolveActivityScore(input),
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.pipelineActivity,
      maxScore: 100,
      reasonCodes: hasStalledPipeline(input) ? [DASHBOARD_REASON_CODES.PIPELINE_STALLED] : []
    },
    {
      label: "Workflow momentum",
      score: resolveWorkflowMomentum(input),
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.workflowMomentum,
      maxScore: 100,
      reasonCodes: []
    },
    {
      label: "Contract execution",
      score: (input.contractCount ?? 0) > 0 ? 100 : 50,
      weight: DASHBOARD_ADAPTER_SCORE_WEIGHTS.contractExecution,
      maxScore: 100,
      reasonCodes: []
    }
  ];
  return entries;
}
function buildTimelineFromSnapshot8(_input) {
  return [];
}
function buildSummary8(input, score) {
  if (input.heroMetric) {
    return `Dashboard health ${Math.round(score)}% \u2014 focus on ${input.heroMetric.label.toLowerCase()}.`;
  }
  if (hasStalledPipeline(input)) {
    return `Dashboard health ${Math.round(score)}% \u2014 pipeline activity has stalled after matching.`;
  }
  return `Dashboard health ${Math.round(score)}% across profile, pipeline, and execution signals.`;
}
function buildDashboardExplanation(input) {
  const score = computeDashboardScore(input);
  const generatedAt = resolveGeneratedAt8(input);
  return {
    engine: ENGINE_ID.DASHBOARD,
    entityId: input.entityId,
    score,
    health: resolveHealth8(score),
    summary: buildSummary8(input, score),
    scoreBreakdown: buildBreakdownFromSnapshot8(input),
    reasons: buildReasons8(input),
    blockers: buildBlockers8(input),
    strengths: buildStrengths8(input),
    weaknesses: buildWeaknesses8(input),
    recommendations: buildRecommendationsFromSnapshot8(input),
    timeline: buildTimelineFromSnapshot8(input),
    metadata: {
      generatedAt,
      engineVersion: DASHBOARD_ADAPTER_VERSION,
      locale: input.locale ?? "en",
      source: "dashboard-adapter",
      tags: ["workspace"],
      extensions: {
        opportunityCount: input.opportunityCount,
        matchCount: input.matchCount,
        negotiationCount: input.negotiationCount,
        dealCount: input.dealCount,
        contractCount: input.contractCount,
        heroMetric: input.heroMetric
      }
    }
  };
}
var dashboardExplainabilityAdapter = {
  buildExplanation: buildDashboardExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot8,
  buildBreakdown: buildBreakdownFromSnapshot8,
  buildTimeline: buildTimelineFromSnapshot8
};

// src/adapters/analytics-adapter.ts
var ANALYTICS_ADAPTER_VERSION = "1.0.0";
var ANALYTICS_ADAPTER_SCORE_WEIGHTS = {
  readinessCoverage: 30,
  matchingQuality: 30,
  funnelConversion: 25,
  dataConfidence: 15
};
var INTELLIGENCE_ROUTES = {
  portfolio: "/intelligence/portfolio",
  funnel: "/intelligence/funnel",
  risk: "/intelligence/risk",
  execution: "/intelligence/execution"
};
function roundScore9(value) {
  return Math.round(value * 100) / 100;
}
function resolveGeneratedAt9(input) {
  return input.evaluatedAt ?? (/* @__PURE__ */ new Date()).toISOString();
}
function hasInsufficientData(input) {
  const readiness = input.readinessAnalytics;
  const matching = input.matchingQualityAnalytics;
  const profileTotal = readiness?.profileTotal ?? 0;
  const opportunityTotal = readiness?.opportunityTotal ?? 0;
  const matchTotal = matching?.totalMatches ?? 0;
  return profileTotal + opportunityTotal + matchTotal < 3;
}
function readinessCoverageScore(input) {
  const readiness = input.readinessAnalytics;
  if (!readiness) return 0;
  const profileDenom = Math.max(1, readiness.profileTotal);
  const oppDenom = Math.max(1, readiness.opportunityTotal);
  const profileReadyRate = readiness.profileReady / profileDenom * 100;
  const oppReadyRate = readiness.opportunityReady / oppDenom * 100;
  return roundScore9((profileReadyRate + oppReadyRate) / 2);
}
function matchingQualityScore(input) {
  const matching = input.matchingQualityAnalytics;
  if (!matching) return 0;
  return roundScore9(
    (matching.averageMatchScore + matching.acceptanceRate + matching.negotiationRate + matching.dealConversionRate) / 4
  );
}
function funnelConversionScore(input) {
  const matching = input.matchingQualityAnalytics;
  if (!matching || matching.totalMatches === 0) return 0;
  return roundScore9(
    matching.acceptanceRate * 0.4 + matching.negotiationRate * 0.35 + matching.dealConversionRate * 0.25
  );
}
function dataConfidenceScore(input) {
  return hasInsufficientData(input) ? 25 : 90;
}
function computeAnalyticsScore(input) {
  const readiness = readinessCoverageScore(input);
  const matching = matchingQualityScore(input);
  const funnel = funnelConversionScore(input);
  const confidence = dataConfidenceScore(input);
  const weighted = (readiness * ANALYTICS_ADAPTER_SCORE_WEIGHTS.readinessCoverage + matching * ANALYTICS_ADAPTER_SCORE_WEIGHTS.matchingQuality + funnel * ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion + confidence * ANALYTICS_ADAPTER_SCORE_WEIGHTS.dataConfidence) / 100;
  return roundScore9(weighted);
}
function resolveHealth9(score) {
  if (score >= 85) return HEALTH.EXCELLENT;
  if (score >= 70) return HEALTH.GOOD;
  if (score >= 50) return HEALTH.WARNING;
  return HEALTH.CRITICAL;
}
function hasNegativeTrend(input) {
  const matching = input.matchingQualityAnalytics;
  if (!matching) return false;
  return matching.acceptanceRate < 35 || matching.negotiationRate < 25 || matching.dealConversionRate < 15;
}
function buildReasons9(input) {
  const reasons = [];
  if (hasInsufficientData(input)) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      message: "Insufficient portfolio data to produce high-confidence analytics.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "data"
    });
  }
  if (hasNegativeTrend(input)) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      message: "Funnel conversion rates are below healthy marketplace benchmarks.",
      severity: EXPLANATION_SEVERITY.WARNING,
      category: "funnel"
    });
  }
  const readiness = input.readinessAnalytics;
  if (readiness && readiness.opportunityPublishBlocked > 0) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE,
      message: `${readiness.opportunityPublishBlocked} opportunities are publish-blocked.`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "readiness"
    });
  }
  if (input.periodLabel) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      message: `Analytics period: ${input.periodLabel}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "period"
    });
  }
  return reasons;
}
function buildBlockers9(input) {
  const blockers = [];
  for (const risk of input.riskBlockers ?? []) {
    if (risk.count <= 0) continue;
    blockers.push({
      reasonCode: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: risk.href ? `Review details at ${risk.href}` : "Investigate blocked workload in intelligence views."
    });
  }
  return blockers;
}
function buildStrengths9(input) {
  const strengths = [];
  const matching = input.matchingQualityAnalytics;
  if (matching && matching.acceptanceRate >= 60) {
    strengths.push({
      code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      label: "Healthy match acceptance rate",
      impactPercent: ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion
    });
  }
  const readiness = input.readinessAnalytics;
  if (readiness && readiness.profileReady >= readiness.profileTotal * 0.7) {
    strengths.push({
      code: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      label: "Strong profile readiness coverage",
      impactPercent: ANALYTICS_ADAPTER_SCORE_WEIGHTS.readinessCoverage
    });
  }
  return strengths;
}
function buildWeaknesses9(input) {
  const weaknesses = [];
  const matching = input.matchingQualityAnalytics;
  if (hasNegativeTrend(input)) {
    weaknesses.push({
      code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      label: "Funnel conversion below target",
      impactPercent: ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion
    });
  }
  if (matching) {
    for (const [matchType, entry] of Object.entries(matching.byMatchType)) {
      if (entry.total >= 3 && entry.accepted === 0) {
        weaknesses.push({
          code: ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE,
          label: `No accepted matches for ${matchType.replace("_", " ")} topology`,
          impactPercent: 8
        });
      }
    }
  }
  for (const risk of input.riskBlockers ?? []) {
    if (risk.count > 0) {
      weaknesses.push({
        code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
        label: risk.label,
        impactPercent: 10
      });
    }
  }
  return weaknesses;
}
function buildRecommendationsFromSnapshot9(input) {
  const recommendations = [];
  let index = 0;
  const score = computeAnalyticsScore(input);
  if (hasInsufficientData(input)) {
    recommendations.push({
      id: `analytics-rec-data-${index}`,
      label: "Add more profiles and opportunities to improve analytics confidence",
      reasonCode: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 15,
      estimatedScore: roundScore9(Math.min(100, score + 10)),
      href: INTELLIGENCE_ROUTES.portfolio,
      category: "data",
      severity: EXPLANATION_SEVERITY.INFO
    });
    index += 1;
  }
  const readiness = input.readinessAnalytics;
  if (readiness && readiness.opportunityPublishBlocked > 0) {
    recommendations.push({
      id: `analytics-rec-readiness-${index}`,
      label: "Resolve publish-blocked opportunities",
      reasonCode: ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 18,
      estimatedScore: roundScore9(Math.min(100, score + 12)),
      href: INTELLIGENCE_ROUTES.portfolio,
      category: "readiness",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if (hasNegativeTrend(input)) {
    recommendations.push({
      id: `analytics-rec-funnel-${index}`,
      label: "Drill into funnel conversion blockers",
      reasonCode: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 20,
      estimatedScore: roundScore9(Math.min(100, score + 15)),
      href: INTELLIGENCE_ROUTES.funnel,
      category: "funnel",
      severity: EXPLANATION_SEVERITY.WARNING
    });
    index += 1;
  }
  if ((input.riskBlockers?.length ?? 0) > 0) {
    recommendations.push({
      id: `analytics-rec-risk-${index}`,
      label: "Review risk and blocker workload",
      reasonCode: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 12,
      estimatedScore: roundScore9(Math.min(100, score + 8)),
      href: INTELLIGENCE_ROUTES.risk,
      category: "risk",
      severity: EXPLANATION_SEVERITY.WARNING
    });
  }
  return recommendations;
}
function buildBreakdownFromSnapshot9(input) {
  return [
    {
      label: "Readiness coverage",
      score: readinessCoverageScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.readinessCoverage,
      maxScore: 100,
      reasonCodes: hasInsufficientData(input) ? [ANALYTICS_REASON_CODES.DATA_INSUFFICIENT] : []
    },
    {
      label: "Matching quality",
      score: matchingQualityScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.matchingQuality,
      maxScore: 100,
      reasonCodes: []
    },
    {
      label: "Funnel conversion",
      score: funnelConversionScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion,
      maxScore: 100,
      reasonCodes: hasNegativeTrend(input) ? [ANALYTICS_REASON_CODES.TREND_NEGATIVE] : []
    },
    {
      label: "Data confidence",
      score: dataConfidenceScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.dataConfidence,
      maxScore: 100,
      reasonCodes: hasInsufficientData(input) ? [ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE] : []
    }
  ];
}
function buildTimelineFromSnapshot9(_input) {
  return [];
}
function buildSummary9(input, score) {
  const period = input.periodLabel ? ` for ${input.periodLabel}` : "";
  if (hasInsufficientData(input)) {
    return `Analytics confidence ${Math.round(score)}%${period} \u2014 more portfolio data is needed.`;
  }
  if (hasNegativeTrend(input)) {
    return `Analytics health ${Math.round(score)}%${period} \u2014 funnel conversion needs attention.`;
  }
  return `Analytics health ${Math.round(score)}%${period} across readiness and matching quality.`;
}
function buildAnalyticsExplanation(input) {
  const score = computeAnalyticsScore(input);
  const generatedAt = resolveGeneratedAt9(input);
  return {
    engine: ENGINE_ID.ANALYTICS,
    entityId: input.entityId,
    score,
    health: resolveHealth9(score),
    summary: buildSummary9(input, score),
    scoreBreakdown: buildBreakdownFromSnapshot9(input),
    reasons: buildReasons9(input),
    blockers: buildBlockers9(input),
    strengths: buildStrengths9(input),
    weaknesses: buildWeaknesses9(input),
    recommendations: buildRecommendationsFromSnapshot9(input),
    timeline: buildTimelineFromSnapshot9(input),
    metadata: {
      generatedAt,
      engineVersion: ANALYTICS_ADAPTER_VERSION,
      locale: input.locale ?? "en",
      source: "analytics-adapter",
      tags: ["intelligence"],
      extensions: {
        readinessAnalytics: input.readinessAnalytics,
        matchingQualityAnalytics: input.matchingQualityAnalytics,
        riskBlockers: input.riskBlockers,
        periodLabel: input.periodLabel
      }
    }
  };
}
var analyticsExplainabilityAdapter = {
  buildExplanation: buildAnalyticsExplanation,
  buildRecommendations: buildRecommendationsFromSnapshot9,
  buildBreakdown: buildBreakdownFromSnapshot9,
  buildTimeline: buildTimelineFromSnapshot9
};

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
function relationshipFlagsFromSupported(supported) {
  return {
    supportsB2B: supported.includes("B2B"),
    supportsB2P: supported.includes("B2P"),
    supportsP2B: supported.includes("P2B"),
    supportsP2P: supported.includes("P2P")
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
function getSubModel(key) {
  return SUB_MODEL_REGISTRY[key];
}
function getDynamicFields(subModelKey) {
  const sub = getSubModel(subModelKey);
  if (!sub) return void 0;
  return [...sub.knowledge.dynamicForm.fields].sort((a, b) => a.displayOrder - b.displayOrder);
}
function getEducationalContent(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.education;
}
function getLifecycleMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.lifecycle;
}
function getRiskProfile(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.riskProfile;
}
function getComplianceMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.compliance;
}
function getKnowledgeMetadata(subModelKey) {
  return getSubModel(subModelKey)?.knowledge.metadata;
}
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

// src/services/knowledge-reason-map.ts
var REASON_CODE_TO_FIELD_ID = Object.fromEntries(
  Object.entries(OPPORTUNITY_FIELD_ID_TO_REASON_CODE).map(([fieldId, code]) => [
    code,
    fieldId
  ])
);
function reasonCodeToFieldId(reasonCode) {
  return REASON_CODE_TO_FIELD_ID[reasonCode];
}
function isComplianceReasonCode(reasonCode) {
  return reasonCode === READINESS_REASON_CODES.MISSING_COMPLIANCE || reasonCode === COMMERCIAL_REASON_CODES.VAT_VALIDATION_REQUIRED || reasonCode.startsWith("DOCUMENT_");
}
function isRiskReasonCode(reasonCode) {
  return reasonCode === NEGOTIATION_REASON_CODES.PRICE_GAP || reasonCode === NEGOTIATION_REASON_CODES.TERMS_MISMATCH || reasonCode === NEGOTIATION_REASON_CODES.RESPONSE_DELAY || reasonCode === NEGOTIATION_REASON_CODES.COUNTER_PENDING || reasonCode.startsWith("VETTING_");
}
function isLifecycleReasonCode(reasonCode) {
  return reasonCode.startsWith("NEGOTIATION_STATUS_") || reasonCode.startsWith("AGREEMENT_STATUS_") || reasonCode.startsWith("CONTRACT_STATUS_") || reasonCode === READINESS_REASON_CODES.PUBLISH_READY || reasonCode === READINESS_REASON_CODES.PUBLISH_BLOCKED;
}
function isReadinessFieldReasonCode(reasonCode) {
  return reasonCode.startsWith("READINESS_MISSING_");
}

// src/services/knowledge-bridge-impl.ts
function resolveSubModelKey(request) {
  const key = request.context?.subModelKey;
  return typeof key === "string" && key.length > 0 ? key : void 0;
}
function makeAnswer(title, body, reasonCode, href) {
  return { title, body, href, reasonCode };
}
function resolveFieldGuidance(subModelKey, reasonCode) {
  const fieldId = reasonCodeToFieldId(reasonCode);
  if (!fieldId) return null;
  const fields = getDynamicFields(subModelKey);
  const field = fields?.find((entry) => entry.id === fieldId);
  if (!field) return null;
  const body = [field.description, field.helpText].filter(Boolean).join(" \u2014 ");
  if (!body) return null;
  return makeAnswer(
    field.label,
    body,
    KNOWLEDGE_REASON_CODES.FIELD_GUIDANCE,
    `#field-${fieldId}`
  );
}
function createKnowledgeBridgeImpl() {
  return {
    resolveKnowledgeAnswer(request) {
      const subModelKey = resolveSubModelKey(request);
      const { reasonCode } = request;
      if (subModelKey && isReadinessFieldReasonCode(reasonCode)) {
        const fieldGuidance = resolveFieldGuidance(subModelKey, reasonCode);
        if (fieldGuidance) return fieldGuidance;
      }
      if (subModelKey && isComplianceReasonCode(reasonCode)) {
        const hints = this.resolveComplianceHints(request);
        return hints[0] ?? null;
      }
      if (subModelKey && isRiskReasonCode(reasonCode)) {
        const hints = this.resolveRiskHints(request);
        return hints[0] ?? null;
      }
      if (subModelKey && isLifecycleReasonCode(reasonCode)) {
        const hints = this.resolveLifecycleHints(request);
        return hints[0] ?? null;
      }
      return this.resolveEducationalContent(request);
    },
    resolveEducationalContent(request) {
      const subModelKey = resolveSubModelKey(request);
      if (!subModelKey) return null;
      const education = getEducationalContent(subModelKey);
      if (!education) return null;
      return makeAnswer(
        "What is this collaboration model?",
        [education.whatIsIt, education.whyUseIt].filter(Boolean).join(" "),
        KNOWLEDGE_REASON_CODES.EDUCATIONAL_HINT
      );
    },
    resolveComplianceHints(request) {
      const subModelKey = resolveSubModelKey(request);
      if (!subModelKey) return [];
      const compliance2 = getComplianceMetadata(subModelKey);
      if (!compliance2) return [];
      const hints = [];
      if (compliance2.requiresLegalReview) {
        hints.push(
          makeAnswer(
            "Legal review required",
            "This collaboration model may require legal review before contracting.",
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT
          )
        );
      }
      if (compliance2.requiresFinancialReview) {
        hints.push(
          makeAnswer(
            "Financial review required",
            "Financial controls or treasury review may be required for this model.",
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT
          )
        );
      }
      if (compliance2.requiresKyc) {
        hints.push(
          makeAnswer(
            "KYC required",
            "Know-your-customer checks are expected for counterparties in this model.",
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT
          )
        );
      }
      if (compliance2.requiresBoardApproval) {
        hints.push(
          makeAnswer(
            "Board approval required",
            "Board or executive approval may be required before execution.",
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT
          )
        );
      }
      if (hints.length === 0) {
        hints.push(
          makeAnswer(
            "Standard compliance",
            "No elevated legal, financial, KYC, or board gates are defined for this model.",
            KNOWLEDGE_REASON_CODES.COMPLIANCE_HINT
          )
        );
      }
      return hints;
    },
    resolveRiskHints(request) {
      const subModelKey = resolveSubModelKey(request);
      if (!subModelKey) return [];
      const riskProfile = getRiskProfile(subModelKey);
      if (!riskProfile) return [];
      const hints = [
        makeAnswer(
          `Default risk: ${riskProfile.defaultRiskLevel}`,
          riskProfile.riskFactors.join("; ") || "No specific risk factors catalogued.",
          KNOWLEDGE_REASON_CODES.RISK_HINT
        )
      ];
      for (const mitigation of riskProfile.mitigationHints) {
        hints.push(
          makeAnswer(
            "Mitigation",
            mitigation,
            KNOWLEDGE_REASON_CODES.RISK_HINT
          )
        );
      }
      const education = getEducationalContent(subModelKey);
      for (const risk of education?.risks ?? []) {
        hints.push(
          makeAnswer(
            "Typical risk",
            risk,
            KNOWLEDGE_REASON_CODES.RISK_HINT
          )
        );
      }
      return hints;
    },
    resolveLifecycleHints(request) {
      const subModelKey = resolveSubModelKey(request);
      if (!subModelKey) return [];
      const lifecycle = getLifecycleMetadata(subModelKey);
      if (!lifecycle) return [];
      const hints = [
        makeAnswer(
          "Typical lifecycle",
          lifecycle.typicalStages.join(" \u2192 "),
          KNOWLEDGE_REASON_CODES.LIFECYCLE_HINT
        )
      ];
      if (lifecycle.recommendedNextStage) {
        hints.push(
          makeAnswer(
            "Recommended next stage",
            lifecycle.recommendedNextStage,
            KNOWLEDGE_REASON_CODES.LIFECYCLE_HINT
          )
        );
      }
      if (lifecycle.terminalStages.length > 0) {
        hints.push(
          makeAnswer(
            "Terminal stages",
            lifecycle.terminalStages.join(", "),
            KNOWLEDGE_REASON_CODES.LIFECYCLE_HINT
          )
        );
      }
      return hints;
    }
  };
}
function createKnowledgeBridge() {
  return createKnowledgeBridgeImpl();
}

// src/services/locale.ts
function pickArabicField(english, arabic) {
  return arabic ?? english;
}
function resolveLocalizedKnowledge(content, locale) {
  if (!content) return void 0;
  if (locale === "en") {
    return content;
  }
  const withArabic = content;
  const ar = withArabic.ar;
  if (!ar) {
    return {
      ...content,
      whatIsIt: content.whatIsIt,
      whyUseIt: content.whyUseIt,
      advantages: content.advantages,
      risks: content.risks
    };
  }
  return {
    ...content,
    whatIsIt: pickArabicField(content.whatIsIt, ar.whatIsIt),
    whyUseIt: pickArabicField(content.whyUseIt, ar.whyUseIt),
    advantages: pickArabicField(content.advantages, ar.advantages),
    risks: pickArabicField(content.risks, ar.risks)
  };
}
function normalizeExplainabilityLocale(locale) {
  if (!locale) return "en";
  const normalized = locale.trim().toLowerCase();
  if (normalized.startsWith("ar")) return "ar";
  return "en";
}

// src/services/enrichment.ts
function uniqueReasonCodes(bundle) {
  const codes = /* @__PURE__ */ new Set();
  for (const reason of bundle.reasons) {
    codes.add(reason.code);
  }
  for (const blocker of bundle.blockers) {
    codes.add(blocker.reasonCode);
  }
  for (const recommendation of bundle.recommendations) {
    codes.add(recommendation.reasonCode);
  }
  return [...codes];
}
function buildKnowledgeExtension(bundle, bridge, subModelKey, locale) {
  if (!subModelKey) return void 0;
  const requestContext = { subModelKey, locale };
  const education = getEducationalContent(subModelKey);
  const complianceMeta = getComplianceMetadata(subModelKey);
  const riskProfile = getRiskProfile(subModelKey);
  const lifecycleMeta = getLifecycleMetadata(subModelKey);
  const reasonHints = [];
  const seen = /* @__PURE__ */ new Set();
  for (const code of uniqueReasonCodes(bundle)) {
    const answer = bridge.resolveKnowledgeAnswer({
      reasonCode: code,
      entityId: bundle.entityId,
      locale,
      context: requestContext
    });
    if (!answer) continue;
    const key = `${answer.reasonCode}:${answer.title}:${answer.body}`;
    if (seen.has(key)) continue;
    seen.add(key);
    reasonHints.push(answer);
  }
  const complianceFlags = complianceMeta ? {
    requiresLegalReview: complianceMeta.requiresLegalReview,
    requiresFinancialReview: complianceMeta.requiresFinancialReview,
    requiresKyc: complianceMeta.requiresKyc,
    requiresBoardApproval: complianceMeta.requiresBoardApproval
  } : void 0;
  return {
    subModelKey,
    whatIsIt: education?.whatIsIt,
    whyUseIt: education?.whyUseIt,
    advantages: education?.advantages,
    risks: [
      ...education?.risks ?? [],
      ...riskProfile?.riskFactors ?? [],
      ...riskProfile?.mitigationHints ?? []
    ],
    compliance: complianceFlags,
    lifecycle: lifecycleMeta ? {
      typicalStages: lifecycleMeta.typicalStages,
      terminalStages: lifecycleMeta.terminalStages,
      recommendedNextStage: lifecycleMeta.recommendedNextStage
    } : void 0,
    reasonHints: reasonHints.length > 0 ? reasonHints : void 0
  };
}
function supplementaryReasons(bundle, knowledge) {
  if (!knowledge?.reasonHints?.length) {
    return bundle.reasons;
  }
  const existingBodies = new Set(bundle.reasons.map((reason) => reason.message));
  const additions = [];
  for (const hint of knowledge.reasonHints.slice(0, 3)) {
    if (existingBodies.has(hint.body)) continue;
    additions.push({
      code: hint.reasonCode,
      message: `${hint.title}: ${hint.body}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: "knowledge"
    });
  }
  if (additions.length === 0) {
    return bundle.reasons;
  }
  return [...bundle.reasons, ...additions];
}
function enrichExplanationBundle(bundle, options) {
  const bridge = options?.knowledgeBridge ?? createKnowledgeBridge();
  const subModelKey = options?.subModelKey;
  const locale = normalizeExplainabilityLocale(
    options?.locale ?? bundle.metadata.locale
  );
  const knowledge = buildKnowledgeExtension(bundle, bridge, subModelKey, locale);
  const knowledgeMetadata = subModelKey ? getKnowledgeMetadata(subModelKey) : void 0;
  if (!knowledge) {
    return {
      ...bundle,
      metadata: {
        ...bundle.metadata,
        locale
      }
    };
  }
  const localizedKnowledge = resolveLocalizedKnowledge(knowledge, locale);
  return {
    ...bundle,
    reasons: supplementaryReasons(bundle, localizedKnowledge),
    metadata: {
      ...bundle.metadata,
      locale,
      knowledgeVersion: knowledgeMetadata?.knowledgeVersion ?? bundle.metadata.knowledgeVersion,
      extensions: {
        ...bundle.metadata.extensions,
        knowledge: localizedKnowledge,
        localeResolved: locale
      }
    }
  };
}

// src/services/recommendation-service-impl.ts
var DEFAULT_AGGREGATE_RECOMMENDATION_LIMIT = 10;
var PRIORITY_ORDER = {
  [RECOMMENDATION_PRIORITY.CRITICAL]: 0,
  [RECOMMENDATION_PRIORITY.HIGH]: 1,
  [RECOMMENDATION_PRIORITY.MEDIUM]: 2,
  [RECOMMENDATION_PRIORITY.LOW]: 3
};
function mergeSnapshot(entityId, input) {
  return { ...input, entityId };
}
function aggregateRecommendations(bundles, options) {
  const limit = options?.limit ?? DEFAULT_AGGREGATE_RECOMMENDATION_LIMIT;
  const deduped = /* @__PURE__ */ new Map();
  for (const bundle of bundles) {
    for (const recommendation of bundle.recommendations) {
      const key = `${recommendation.reasonCode}::${recommendation.label}`;
      const existing = deduped.get(key);
      if (!existing || recommendation.impactPercent > existing.impactPercent || PRIORITY_ORDER[recommendation.priority] < PRIORITY_ORDER[existing.priority]) {
        deduped.set(key, recommendation);
      }
    }
  }
  return [...deduped.values()].sort((left, right) => {
    const priorityDiff = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return right.impactPercent - left.impactPercent;
  }).slice(0, limit);
}
function createRecommendationService() {
  return {
    forProfile(entityId, input) {
      const snapshot = mergeSnapshot(entityId, input);
      return profileExplainabilityAdapter.buildRecommendations(snapshot);
    },
    forVetting(entityId, input) {
      const snapshot = mergeSnapshot(entityId, input);
      return vettingExplainabilityAdapter.buildRecommendations(snapshot);
    },
    forOpportunity(entityId, input) {
      const snapshot = mergeSnapshot(entityId, input);
      const engine = typeof input.engine === "string" ? input.engine : void 0;
      if (engine === "readiness") {
        return readinessExplainabilityAdapter.buildRecommendations(snapshot);
      }
      return opportunityExplainabilityAdapter.buildRecommendations(snapshot);
    },
    forMatching(entityId, input) {
      const snapshot = mergeSnapshot(entityId, input);
      return matchingExplainabilityAdapter.buildRecommendations(snapshot);
    },
    forNegotiation(entityId, input) {
      const snapshot = mergeSnapshot(
        entityId,
        input
      );
      return negotiationExplainabilityAdapter.buildRecommendations(snapshot);
    },
    forAgreement(entityId, input) {
      const snapshot = mergeSnapshot(
        entityId,
        input
      );
      return agreementExplainabilityAdapter.buildRecommendations(snapshot);
    },
    forContract(entityId, input) {
      const snapshot = mergeSnapshot(
        entityId,
        input
      );
      return contractExplainabilityAdapter.buildRecommendations(snapshot);
    }
  };
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

// src/ai/gateway.ts
function resolveKnowledgeFromBundles(bundles, includeKnowledge) {
  if (!includeKnowledge) return void 0;
  for (const bundle of bundles) {
    const knowledge = bundle.metadata.extensions?.knowledge;
    if (knowledge && typeof knowledge === "object") {
      return knowledge;
    }
  }
  return void 0;
}
function createAIExplanationGateway() {
  return {
    exportPayload(bundle) {
      return toAIExplanationPayload(bundle);
    },
    importPayload(payload) {
      return fromAIExplanationPayload(payload);
    },
    exportBatch(bundles) {
      const payloads = bundles.map((bundle) => toAIExplanationPayload(bundle));
      return JSON.stringify(payloads);
    },
    buildAgentContext(options) {
      const locale = normalizeExplainabilityLocale(options.locale);
      const includeKnowledge = options.includeKnowledge ?? true;
      return {
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        locale,
        subModelKey: options.subModelKey,
        includeKnowledge,
        bundles: options.bundles,
        summaries: options.bundles.map((bundle) => ({
          engine: bundle.engine,
          entityId: bundle.entityId,
          score: bundle.score,
          health: bundle.health,
          summary: bundle.summary
        })),
        knowledge: resolveKnowledgeFromBundles(options.bundles, includeKnowledge)
      };
    }
  };
}
function importPayloadFromJson(json) {
  const parsed = JSON.parse(json);
  if (typeof parsed === "object" && parsed !== null && "version" in parsed && "bundle" in parsed) {
    return fromAIExplanationPayload(parsed);
  }
  return deserializeExplanationBundle(json);
}
function serializeAgentContext(context) {
  return JSON.stringify(context);
}

// src/observability/trace.ts
function resolveTraceMetadata(result) {
  if (typeof result !== "object" || result === null || !("metadata" in result)) {
    return { enriched: false, knowledgeHit: false };
  }
  const candidate = result;
  const knowledge = candidate.metadata?.extensions?.knowledge;
  return {
    engine: candidate.engine,
    entityId: candidate.entityId,
    enriched: knowledge != null,
    knowledgeHit: knowledge != null
  };
}
function traceExplainabilityBuild(label, fn) {
  const startedAt = performance.now();
  const finalize = (result) => {
    const meta = resolveTraceMetadata(result);
    return {
      result,
      trace: {
        label,
        engine: meta.engine,
        entityId: meta.entityId,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        enriched: meta.enriched,
        knowledgeHit: meta.knowledgeHit
      }
    };
  };
  const output = fn();
  if (output instanceof Promise) {
    return output.then(finalize);
  }
  return finalize(output);
}
export {
  AGREEMENT_ADAPTER_SCORE_WEIGHTS,
  AGREEMENT_ADAPTER_VERSION,
  AGREEMENT_BREAKDOWN_LABELS,
  AGREEMENT_REASON_CODES,
  AGREEMENT_STATUS_TO_REASON_CODE,
  AI_EXPLANATION_PAYLOAD_VERSION,
  ALL_REASON_CODES,
  ANALYTICS_ADAPTER_SCORE_WEIGHTS,
  ANALYTICS_ADAPTER_VERSION,
  ANALYTICS_REASON_CODES,
  COMMERCIAL_REASON_CODES,
  CONTRACT_ADAPTER_SCORE_WEIGHTS,
  CONTRACT_ADAPTER_VERSION,
  CONTRACT_BREAKDOWN_LABELS,
  CONTRACT_REASON_CODES,
  CONTRACT_STATUS_TO_REASON_CODE,
  DASHBOARD_ADAPTER_SCORE_WEIGHTS,
  DASHBOARD_ADAPTER_VERSION,
  DASHBOARD_REASON_CODES,
  DEFAULT_AGGREGATE_RECOMMENDATION_LIMIT,
  DOCUMENT_REASON_CODES,
  ENGINE_ID,
  EXPLANATION_BUNDLE_KEYS,
  EXPLANATION_SEVERITY,
  HEALTH,
  KNOWLEDGE_REASON_CODES,
  MATCHING_ADAPTER_VERSION,
  MATCH_ADAPTER_SCORE_WEIGHTS,
  MATCH_DIMENSION_LABELS,
  MATCH_DIMENSION_THRESHOLDS,
  MATCH_DIMENSION_TO_REASON_CODE,
  MATCH_REASON_CODES,
  NEGOTIATION_ADAPTER_SCORE_WEIGHTS,
  NEGOTIATION_ADAPTER_VERSION,
  NEGOTIATION_BREAKDOWN_LABELS,
  NEGOTIATION_LARGE_PRICE_GAP_PERCENT,
  NEGOTIATION_REASON_CODES,
  NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD,
  NEGOTIATION_STATUS_TO_REASON_CODE,
  OPPORTUNITY_ADAPTER_SCORE_WEIGHTS,
  OPPORTUNITY_ADAPTER_VERSION,
  OPPORTUNITY_FIELD_ID_TO_REASON_CODE,
  PROFILE_ADAPTER_SCORE_WEIGHTS,
  PROFILE_ADAPTER_VERSION,
  PROFILE_FIELD_LABEL_TO_REASON_CODE,
  PROFILE_REASON_CODES,
  READINESS_REASON_CODES,
  REASON_CODE_PREFIX,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
  VETTING_ADAPTER_SCORE_WEIGHTS,
  VETTING_ADAPTER_VERSION,
  VETTING_DOCUMENT_LABEL_TO_REASON_CODE,
  VETTING_REASON_CODES,
  VETTING_REVIEW_GAP_LABEL_TO_REASON_CODE,
  VETTING_REVIEW_PROGRESS_TO_REASON_CODE,
  aggregateRecommendations,
  agreementExplainabilityAdapter,
  agreementStatusToHref,
  agreementStatusToReasonCode,
  analyticsExplainabilityAdapter,
  assertReasonCode,
  buildAgreementExplanation,
  buildAnalyticsExplanation,
  buildContractExplanation,
  buildDashboardExplanation,
  buildMatchingExplanation,
  buildNegotiationExplanation,
  buildOpportunityExplanation,
  buildProfileExplanation,
  buildReadinessExplanation,
  buildVettingExplanation,
  commercialAwardToReasonCode,
  commercialDecisionToReasonCode,
  computeAgreementProgressScore,
  computeContractProgressScore,
  computeNegotiationProgressScore,
  contractExplainabilityAdapter,
  contractStatusToHref,
  contractStatusToReasonCode,
  createAIExplanationGateway,
  createKnowledgeBridge,
  createRecommendationService,
  dashboardExplainabilityAdapter,
  deserializeAIExplanationPayload,
  deserializeExplanationBundle,
  dimensionImprovementHint,
  enrichExplanationBundle,
  fromAIExplanationPayload,
  hasBlockedMilestones,
  hasPendingSignatures,
  hasUnsignedParties,
  importPayloadFromJson,
  isAwardPending,
  isDecisionPending,
  isExplanationBundle,
  isLargePriceGap,
  isLowDimensionScore,
  isReasonCode,
  isResponseDelayed,
  labelFromDimensionScore,
  matchDimensionToReasonCode,
  matchHardGateCodeToReasonCode,
  matchTierToReasonCode,
  matchTopologyToReasonCode,
  matchingExplainabilityAdapter,
  negotiationExplainabilityAdapter,
  negotiationGapToReasonCode,
  negotiationStatusToHref,
  negotiationStatusToReasonCode,
  negotiationTermsFieldToHref,
  normalizeExplainabilityLocale,
  opportunityExplainabilityAdapter,
  opportunityFieldIdToHref,
  opportunityFieldIdToReasonCode,
  opportunityReasonCodeToCanonical,
  profileExplainabilityAdapter,
  profileFieldLabelToHref,
  profileFieldLabelToReasonCode,
  readinessExplainabilityAdapter,
  resolveLocalizedKnowledge,
  resolvePartiesSigned,
  resolveTotalParties,
  serializeAIExplanationPayload,
  serializeAgentContext,
  serializeExplanationBundle,
  toAIExplanationPayload,
  traceExplainabilityBuild,
  vettingDocumentLabelToHref,
  vettingDocumentLabelToReasonCode,
  vettingDocumentTypeToHref,
  vettingDocumentTypeToReasonCode,
  vettingExplainabilityAdapter,
  vettingReviewGapLabelToHref,
  vettingReviewGapLabelToReasonCode,
  vettingReviewProgressToReasonCode
};
