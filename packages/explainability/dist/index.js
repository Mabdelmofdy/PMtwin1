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
  COUNTER_OFFER_PENDING: "NEGOTIATION_COUNTER_OFFER_PENDING"
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
  MATCHING_ADAPTER_VERSION,
  MATCH_ADAPTER_SCORE_WEIGHTS,
  MATCH_DIMENSION_LABELS,
  MATCH_DIMENSION_THRESHOLDS,
  MATCH_DIMENSION_TO_REASON_CODE,
  MATCH_REASON_CODES,
  NEGOTIATION_REASON_CODES,
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
  assertReasonCode,
  buildMatchingExplanation,
  buildOpportunityExplanation,
  buildProfileExplanation,
  buildReadinessExplanation,
  buildVettingExplanation,
  deserializeAIExplanationPayload,
  deserializeExplanationBundle,
  dimensionImprovementHint,
  fromAIExplanationPayload,
  isExplanationBundle,
  isLowDimensionScore,
  isReasonCode,
  labelFromDimensionScore,
  matchDimensionToReasonCode,
  matchHardGateCodeToReasonCode,
  matchTierToReasonCode,
  matchTopologyToReasonCode,
  matchingExplainabilityAdapter,
  opportunityExplainabilityAdapter,
  opportunityFieldIdToHref,
  opportunityFieldIdToReasonCode,
  opportunityReasonCodeToCanonical,
  profileExplainabilityAdapter,
  profileFieldLabelToHref,
  profileFieldLabelToReasonCode,
  readinessExplainabilityAdapter,
  serializeAIExplanationPayload,
  serializeExplanationBundle,
  toAIExplanationPayload,
  vettingDocumentLabelToHref,
  vettingDocumentLabelToReasonCode,
  vettingDocumentTypeToHref,
  vettingDocumentTypeToReasonCode,
  vettingExplainabilityAdapter,
  vettingReviewGapLabelToHref,
  vettingReviewGapLabelToReasonCode,
  vettingReviewProgressToReasonCode
};
