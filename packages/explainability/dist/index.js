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
  buildProfileExplanation,
  buildVettingExplanation,
  deserializeAIExplanationPayload,
  deserializeExplanationBundle,
  fromAIExplanationPayload,
  isExplanationBundle,
  isReasonCode,
  profileExplainabilityAdapter,
  profileFieldLabelToHref,
  profileFieldLabelToReasonCode,
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
