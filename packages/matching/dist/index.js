// src/types/canonical.ts
var EMPTY_CANONICAL_DATA = {
  skillSynonyms: {},
  locationCanonical: {},
  categoryExpansion: {},
  semanticTerms: {}
};

// src/config/defaults.ts
var DEFAULT_WEIGHTS = {
  SKILL_MATCH: 0.25,
  EXCHANGE_COMPATIBILITY: 0.2,
  VALUE_COMPATIBILITY: 0.2,
  BUDGET_FIT: 0.1,
  TIMELINE: 0.1,
  LOCATION: 0.1,
  REPUTATION: 0.05,
  ATTRIBUTE_OVERLAP: 0.25,
  BUDGET_FIT_LEGACY: 0.1
};
var DEFAULT_MATCHING_CONFIG = {
  CANDIDATE_MAX: 200,
  POST_TO_POST_THRESHOLD: 0.5,
  HARD_CONSTRAINTS_ENABLED: true,
  STRICT_ROLE_REQUIRED: true,
  STRICT_ROLE_EXACT_MATCH: true,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
  WEIGHTS: DEFAULT_WEIGHTS
};
function resolveWeights(config) {
  return config.WEIGHTS_DESIGN ?? config.WEIGHTS ?? DEFAULT_WEIGHTS;
}
function withMatchingDefaults(config) {
  return {
    ...DEFAULT_MATCHING_CONFIG,
    ...config,
    WEIGHTS: {
      ...DEFAULT_WEIGHTS,
      ...config?.WEIGHTS
    }
  };
}

// src/constraints/role-matrix.ts
var ROLE_COMPATIBILITY = {
  Architect: ["Architect", "Interior Designer"],
  "Architectural Design": ["Architect", "Interior Designer", "Architectural Design"],
  "Interior Designer": ["Interior Designer", "Architect"],
  "Civil Engineer": ["Civil Engineer", "Structural Engineer"],
  "Civil Engineering": ["Civil Engineer", "Structural Engineer", "Civil Engineering"],
  "Structural Engineer": ["Structural Engineer", "Civil Engineer"],
  "Structural Engineering": ["Structural Engineer", "Civil Engineer", "Structural Engineering"]
};
var ROLE_ALIASES = {
  "architectural design": "Architect",
  "interior design": "Interior Designer",
  "civil engineering": "Civil Engineer",
  "structural engineering": "Structural Engineer"
};

// src/constraints/hard-constraints.ts
function normalizeRoleLabel(role) {
  if (!role) return "";
  const trimmed = String(role).trim();
  const alias = ROLE_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}
function getNeedRole(needPost, needNorm) {
  const fromNorm = needNorm.role;
  if (fromNorm) return normalizeRoleLabel(fromNorm);
  const att = needPost.attributes ?? {};
  const explicit = att.targetRole ?? att.professionalRole;
  if (explicit) {
    const label = typeof explicit === "string" ? explicit : String(explicit.label ?? explicit.role ?? "");
    return normalizeRoleLabel(label);
  }
  return "";
}
function getOfferRole(offerPost, offerNorm) {
  const fromNorm = offerNorm.role;
  if (fromNorm) return normalizeRoleLabel(fromNorm);
  const att = offerPost.attributes ?? {};
  const explicit = att.targetRole ?? att.professionalRole;
  if (explicit) {
    const label = typeof explicit === "string" ? explicit : String(explicit.label ?? explicit.role ?? "");
    return normalizeRoleLabel(label);
  }
  return "";
}
function rolesCompatible(needRole, offerRole, config) {
  const need = normalizeRoleLabel(needRole);
  const offer = normalizeRoleLabel(offerRole);
  if (!need || !offer) return false;
  if (need.toLowerCase() === offer.toLowerCase()) return true;
  if (config.STRICT_ROLE_EXACT_MATCH !== false) {
    return false;
  }
  const allowed = ROLE_COMPATIBILITY[need] ?? ROLE_COMPATIBILITY[needRole] ?? ROLE_COMPATIBILITY[normalizeRoleLabel(needRole)];
  if (!allowed) {
    return need.toLowerCase() === offer.toLowerCase();
  }
  return allowed.some((candidate) => candidate.toLowerCase() === offer.toLowerCase());
}
function serviceOverlapScore(needServices, offerServices) {
  const needList = (needServices ?? []).filter(Boolean);
  if (!needList.length) return 1;
  const offerSet = new Set((offerServices ?? []).map((service) => String(service).toLowerCase()));
  let matched = 0;
  needList.forEach((service) => {
    if (offerSet.has(String(service).toLowerCase())) matched++;
  });
  return matched / needList.length;
}
function passesCoreSkills(needNorm, offerNorm) {
  const needCore = needNorm.coreSkills ?? [];
  if (!needCore.length) return { ok: true };
  const offerPool = [
    ...offerNorm.coreSkills ?? [],
    ...offerNorm.offeredServices ?? [],
    ...offerNorm.skills ?? []
  ];
  const offerSet = new Set(offerPool.map((skill) => String(skill).toLowerCase()));
  const missing = needCore.filter((skill) => !offerSet.has(String(skill).toLowerCase()));
  if (missing.length) {
    return { ok: false, reason: "core_skill_missing", missing };
  }
  return { ok: true };
}
function passesServiceOverlap(needNorm, offerNorm, config) {
  const needServices = needNorm.requiredServices ?? [];
  if (!needServices.length) return { ok: true };
  const offerServices = offerNorm.offeredServices ?? offerNorm.skills ?? [];
  const overlap = serviceOverlapScore(needServices, offerServices);
  const minOverlap = config.MIN_REQUIRED_SERVICE_OVERLAP ?? 0.5;
  if (overlap < minOverlap) {
    return { ok: false, reason: "service_overlap_low", overlap, minOverlap };
  }
  return { ok: true, overlap };
}
function passesPair(needPost, offerPost, config, ctx = {}) {
  if (config.HARD_CONSTRAINTS_ENABLED === false) {
    return { ok: true };
  }
  const needNorm = ctx.needNorm ?? needPost.normalized ?? {};
  const offerNorm = ctx.offerNorm ?? offerPost.normalized ?? {};
  const needRole = getNeedRole(needPost, needNorm);
  const offerRole = getOfferRole(offerPost, offerNorm);
  if (!needRole) return { ok: false, reason: "role_missing", side: "need" };
  if (!offerRole) return { ok: false, reason: "role_missing", side: "offer" };
  if (!rolesCompatible(needRole, offerRole, config)) {
    return { ok: false, reason: "role_incompatible", needRole, offerRole };
  }
  const coreCheck = passesCoreSkills(needNorm, offerNorm);
  if (!coreCheck.ok) return coreCheck;
  const serviceCheck = passesServiceOverlap(needNorm, offerNorm, config);
  if (!serviceCheck.ok) return serviceCheck;
  return { ok: true, needRole, offerRole, overlap: serviceCheck.overlap };
}

// src/candidates/candidate-generator.ts
function budgetCompatible(needNorm, offerNorm) {
  const needB = needNorm.budget ?? {};
  const offerB = offerNorm.budget ?? {};
  const needMin = needB.min != null ? needB.min : 0;
  const needMax = needB.max != null ? needB.max : Number.POSITIVE_INFINITY;
  const offerMin = offerB.min != null ? offerB.min : 0;
  const offerMax = offerB.max != null ? offerB.max : Number.POSITIVE_INFINITY;
  if (needMax === Number.POSITIVE_INFINITY && needMin === 0 && offerMin === 0 && offerMax === Number.POSITIVE_INFINITY) {
    return true;
  }
  return Math.max(needMin, offerMin) <= Math.min(needMax, offerMax);
}
function locationCompatible(needNorm, offerNorm) {
  const needLoc = (needNorm.location ?? "").toLowerCase();
  const offerLoc = (offerNorm.location ?? "").toLowerCase();
  if (needLoc === "remote" || offerLoc === "remote") return true;
  if (needLoc === offerLoc) return true;
  if (needLoc === "ksa" && offerLoc) return true;
  if (offerLoc === "ksa" && needLoc) return true;
  return false;
}
function timelineOverlap(needNorm, offerNorm) {
  const needEnd = needNorm.deadline ?? needNorm.timeline?.end;
  const needStart = needNorm.timeline?.start;
  const offerStart = offerNorm.availability?.start ?? offerNorm.timeline?.start;
  const offerEnd = offerNorm.availability?.end ?? offerNorm.timeline?.end;
  if (!needEnd && !needStart && !offerStart && !offerEnd) return true;
  const toDate = (value) => value ? new Date(value).getTime() : null;
  const nEnd = toDate(needEnd);
  const nStart = toDate(needStart);
  const oStart = toDate(offerStart);
  const oEnd = toDate(offerEnd);
  if (nEnd == null && nStart == null && oStart == null && oEnd == null) return true;
  if (nEnd != null && oStart != null && oStart > nEnd) return false;
  if (oEnd != null && nStart != null && nStart > oEnd) return false;
  return true;
}
function categoryOverlap(needNorm, offerNorm) {
  const needCat = new Set(
    [needNorm.modelType, needNorm.subModelType, ...needNorm.categories ?? []].filter(Boolean)
  );
  const offerCat = new Set(
    [offerNorm.modelType, offerNorm.subModelType, ...offerNorm.categories ?? []].filter(Boolean)
  );
  if (needCat.size === 0 && offerCat.size === 0) return true;
  for (const category of needCat) {
    if (offerCat.has(category)) return true;
  }
  return false;
}
function getCandidates(needPost, offerPosts, config, options = {}) {
  const maxCandidates = options.maxCandidates ?? config.CANDIDATE_MAX ?? 200;
  const needNorm = options.needNormalized ?? needPost.normalized ?? {};
  const excludeCreatorId = needPost.creatorId;
  const filtered = offerPosts.filter((offer) => {
    if (offer.creatorId === excludeCreatorId) return false;
    if (offer.status !== "published") return false;
    const offerNorm = offer.normalized ?? {};
    if (!budgetCompatible(needNorm, offerNorm)) return false;
    if (!locationCompatible(needNorm, offerNorm)) return false;
    if (!timelineOverlap(needNorm, offerNorm)) return false;
    if (!categoryOverlap(needNorm, offerNorm)) return false;
    const gate = passesPair(needPost, offer, config, { needNorm, offerNorm });
    if (!gate.ok) return false;
    return true;
  });
  const byCategory = (a, b) => {
    const aCat = (a.normalized ?? {}).modelType ?? "";
    const bCat = (b.normalized ?? {}).modelType ?? "";
    if (aCat === (needNorm.modelType ?? "")) return -1;
    if (bCat === (needNorm.modelType ?? "")) return 1;
    return 0;
  };
  filtered.sort(byCategory);
  return filtered.slice(0, maxCandidates);
}
function getCandidatesForOffer(offerPost, needPosts, config, options = {}) {
  const maxCandidates = options.maxCandidates ?? config.CANDIDATE_MAX ?? 200;
  const offerNorm = options.offerNormalized ?? offerPost.normalized ?? {};
  const excludeCreatorId = offerPost.creatorId;
  const filtered = needPosts.filter((need) => {
    if (need.creatorId === excludeCreatorId) return false;
    if (need.status !== "published") return false;
    const needNorm = need.normalized ?? {};
    if (!budgetCompatible(needNorm, offerNorm)) return false;
    if (!locationCompatible(needNorm, offerNorm)) return false;
    if (!timelineOverlap(needNorm, offerNorm)) return false;
    if (!categoryOverlap(needNorm, offerNorm)) return false;
    const gate = passesPair(need, offerPost, config, { needNorm, offerNorm });
    if (!gate.ok) return false;
    return true;
  });
  const byCategory = (a, b) => {
    const aCat = (a.normalized ?? {}).modelType ?? "";
    const bCat = (b.normalized ?? {}).modelType ?? "";
    if (aCat === (offerNorm.modelType ?? "")) return -1;
    if (bCat === (offerNorm.modelType ?? "")) return 1;
    return 0;
  };
  filtered.sort(byCategory);
  return filtered.slice(0, maxCandidates);
}

// src/value/value-compatibility.ts
function getNormalized(post) {
  const ve = post.value_exchange ?? {};
  if (ve._normalized) return ve._normalized;
  const totalOffered = ve.estimated_value != null ? Number(ve.estimated_value) : null;
  const totalExpected = totalOffered;
  return {
    totalOffered: totalOffered || 0,
    totalExpected: totalExpected || 0,
    riskAdjustedOffered: totalOffered || 0,
    riskAdjustedExpected: totalExpected || 0
  };
}
function exchangeCompatibility(postA, postB) {
  const modeA = postA.value_exchange?.mode ?? postA.exchangeMode ?? "";
  const modeB = postB.value_exchange?.mode ?? postB.exchangeMode ?? "";
  const modesA = postA.value_exchange?.accepted_modes ?? (modeA ? [modeA] : []);
  const modesB = postB.value_exchange?.accepted_modes ?? (modeB ? [modeB] : []);
  const a = String(modeA).toLowerCase();
  const b = String(modeB).toLowerCase();
  const setA = Array.isArray(modesA) ? modesA.map((mode) => String(mode).toLowerCase()) : [];
  const setB = Array.isArray(modesB) ? modesB.map((mode) => String(mode).toLowerCase()) : [];
  if (a && b && a === b) return 1;
  if (setB.includes(a) || setA.includes(b)) return 0.8;
  const overlap = setA.filter((mode) => setB.includes(mode));
  if (overlap.length > 0) {
    return 0.5 + 0.3 * overlap.length / Math.max(setA.length, setB.length, 1);
  }
  return 0;
}
function valueCompatibility(needPost, offerPost) {
  const normNeed = getNormalized(needPost);
  const normOffer = getNormalized(offerPost);
  const needExpected = normNeed.totalExpected || normNeed.riskAdjustedExpected;
  const offerProvided = normOffer.totalOffered || normOffer.riskAdjustedOffered;
  if (needExpected === 0 || offerProvided === 0) return 0.5;
  const ratio = offerProvided / needExpected;
  if (ratio >= 0.9 && ratio <= 1.1) return 1;
  if (ratio >= 0.7 && ratio <= 1.3) return 0.8;
  if (ratio >= 0.5 && ratio <= 1.5) return 0.6;
  if (ratio >= 0.3 && ratio <= 2) return 0.3;
  return 0;
}
function oneWayValueFit(need, offer) {
  const n = getNormalized(need);
  const o = getNormalized(offer);
  const needVal = n.totalExpected || n.riskAdjustedExpected;
  const offerVal = o.totalOffered || o.riskAdjustedOffered;
  const gap = needVal > 0 ? offerVal - needVal : 0;
  const ratio = needVal > 0 ? offerVal / needVal : 0;
  const riskRatio = n.riskAdjustedExpected > 0 ? o.riskAdjustedOffered / n.riskAdjustedExpected : 0;
  let valueFit = "weak";
  if (ratio >= 0.8 && ratio <= 1.2) valueFit = "strong";
  else if (ratio >= 0.5) valueFit = "partial";
  return {
    valueFit,
    valueGap: gap,
    valueGapPercent: needVal > 0 ? gap / needVal * 100 : 0,
    coverageRatio: ratio,
    riskAdjustedRatio: riskRatio
  };
}
function barterValueEquivalence(postA, postB) {
  const nA = getNormalized(postA);
  const nB = getNormalized(postB);
  const aOffersValue = nA.riskAdjustedOffered;
  const bOffersValue = nB.riskAdjustedOffered;
  const aExpectsValue = nA.riskAdjustedExpected || nA.totalExpected;
  const bExpectsValue = nB.riskAdjustedExpected || nB.totalExpected;
  const aExpects = aExpectsValue > 0 ? aExpectsValue : 1;
  const bExpects = bExpectsValue > 0 ? bExpectsValue : 1;
  const aCoversB = bExpects > 0 ? Math.min(aOffersValue / bExpects, 1) : 1;
  const bCoversA = aExpects > 0 ? Math.min(bOffersValue / aExpects, 1) : 1;
  const symmetry = Math.min(aCoversB, bCoversA) / Math.max(aCoversB, bCoversA, 1e-3);
  const gapA = Math.max(aExpectsValue - bOffersValue, 0);
  const gapB = Math.max(bExpectsValue - aOffersValue, 0);
  const equivalenceScore = (symmetry + Math.min(aCoversB, bCoversA, 1)) / 2;
  let suggestion = "Balanced exchange";
  if (gapA > 0 || gapB > 0) {
    suggestion = `Cash adjustment needed: A pays ${Math.round(gapA)} SAR, B pays ${Math.round(gapB)} SAR`;
  }
  return {
    equivalenceScore,
    aCoversB,
    bCoversA,
    symmetry,
    gapA,
    gapB,
    suggestion
  };
}

// src/scoring/label-from-score.ts
var LABEL_PARTIAL = 0.25;
function labelFromScore(score) {
  if (score >= 1) return "Match";
  if (score >= LABEL_PARTIAL) return "Partial";
  return "No Match";
}

// src/scoring/post-to-post-scoring.ts
function attributeOverlap(needNorm, offerNorm) {
  const needServices = needNorm.requiredServices ?? needNorm.skills ?? [];
  const offerServices = offerNorm.offeredServices ?? offerNorm.skills ?? [];
  if (!needServices.length) return { score: 1, label: "Match", matched: 0, total: 0 };
  const needSet = new Set(needServices.map((service) => String(service).toLowerCase()));
  const offerSet = new Set(offerServices.map((service) => String(service).toLowerCase()));
  let matched = 0;
  needSet.forEach((service) => {
    if (offerSet.has(service)) matched++;
  });
  const score = matched / needSet.size;
  return { score, label: labelFromScore(score), matched, total: needSet.size };
}
function exchangeCompatibilityFactor(needPost, offerPost) {
  const score = exchangeCompatibility(needPost, offerPost);
  return { score, label: labelFromScore(score) };
}
function valueCompatibilityFactor(needPost, offerPost) {
  const score = valueCompatibility(needPost, offerPost);
  return { score, label: labelFromScore(score) };
}
function budgetFit(needNorm, offerNorm) {
  const needB = needNorm.budget ?? {};
  const offerB = offerNorm.budget ?? {};
  const needMin = needB.min != null ? needB.min : 0;
  const needMax = needB.max != null ? needB.max : Number.POSITIVE_INFINITY;
  const offerMin = offerB.min != null ? offerB.min : 0;
  const offerMax = offerB.max != null ? offerB.max : Number.POSITIVE_INFINITY;
  if (needMax === Number.POSITIVE_INFINITY && needMin === 0 && offerMin === 0 && offerMax === Number.POSITIVE_INFINITY) {
    return { score: 1, label: "Match" };
  }
  const overlapMin = Math.max(needMin, offerMin);
  const overlapMax = Math.min(needMax, offerMax);
  if (overlapMin > overlapMax) return { score: 0, label: "No Match" };
  const needSpan = needMax - needMin;
  const overlapSpan = overlapMax - overlapMin;
  const score = needSpan > 0 ? overlapSpan / needSpan : 1;
  return { score, label: labelFromScore(score) };
}
function timelineFit(needNorm, offerNorm) {
  const needEnd = needNorm.deadline ?? needNorm.timeline?.end;
  const needStart = needNorm.timeline?.start;
  const offerStart = offerNorm.availability?.start ?? offerNorm.timeline?.start;
  const offerEnd = offerNorm.availability?.end ?? offerNorm.timeline?.end;
  const toDate = (value) => value ? new Date(value).getTime() : null;
  const nEnd = toDate(needEnd);
  const nStart = toDate(needStart);
  const oStart = toDate(offerStart);
  const oEnd = toDate(offerEnd);
  if (nEnd == null && nStart == null && oStart == null && oEnd == null) {
    return { score: 1, label: "Match" };
  }
  if (nEnd != null && oStart != null && oStart > nEnd) return { score: 0, label: "No Match" };
  if (oEnd != null && nStart != null && nStart > oEnd) return { score: 0, label: "No Match" };
  if (nStart != null && nEnd != null && oStart != null && oEnd != null) {
    const overlap = Math.max(0, Math.min(nEnd, oEnd) - Math.max(nStart, oStart));
    const needLen = nEnd - nStart;
    const score = needLen > 0 ? overlap / needLen : 0.5;
    return { score, label: labelFromScore(score) };
  }
  return { score: 0.5, label: "Partial" };
}
function locationFit(needNorm, offerNorm) {
  const needLoc = (needNorm.location ?? "").toLowerCase();
  const offerLoc = (offerNorm.location ?? "").toLowerCase();
  if (needLoc === "remote" || offerLoc === "remote") return { score: 1, label: "Match" };
  if (needLoc === offerLoc) return { score: 1, label: "Match" };
  if (needLoc === "ksa" && offerLoc) return { score: 0.5, label: "Partial" };
  if (offerLoc === "ksa" && needLoc) return { score: 0.5, label: "Partial" };
  return { score: 0, label: "No Match" };
}
function reputationScore(offerNorm) {
  const raw = offerNorm.reputation != null ? Number(offerNorm.reputation) : 0.5;
  const score = Number.isNaN(raw) ? 0.5 : Math.max(0, Math.min(1, raw));
  return { score, label: labelFromScore(score) };
}
function scorePair(needPost, offerPost, config, normalizedNeed, normalizedOffer) {
  const nNorm = normalizedNeed ?? needPost.normalized ?? {};
  const oNorm = normalizedOffer ?? offerPost.normalized ?? {};
  const weights = resolveWeights(config);
  const skill = attributeOverlap(nNorm, oNorm);
  const exchange = exchangeCompatibilityFactor(needPost, offerPost);
  const value = valueCompatibilityFactor(needPost, offerPost);
  const budget = budgetFit(nNorm, oNorm);
  const timeline = timelineFit(nNorm, oNorm);
  const location = locationFit(nNorm, oNorm);
  const reputation = reputationScore(oNorm);
  const minSkillForScore = config.MIN_SKILL_SCORE_FOR_MATCH ?? 0.5;
  if ((nNorm.requiredServices?.length ?? 0) > 0 && skill.score < minSkillForScore) {
    return {
      score: 0,
      breakdown: {
        skillMatch: skill.score,
        attributeOverlap: skill.score,
        serviceOverlapPct: skill.score,
        exchangeCompatibility: exchange.score,
        valueCompatibility: value.score,
        budgetFit: budget.score,
        timelineFit: timeline.score,
        locationFit: location.score,
        reputation: reputation.score,
        rejected: "skill_floor"
      },
      labels: {
        skillMatch: skill.label,
        attributeOverlap: skill.label,
        exchangeCompatibility: exchange.label,
        valueCompatibility: value.label,
        budgetFit: budget.label,
        timelineFit: timeline.label,
        locationFit: location.label,
        reputation: reputation.label
      }
    };
  }
  const breakdown = {
    skillMatch: skill.score,
    attributeOverlap: skill.score,
    serviceOverlapPct: skill.score,
    exchangeCompatibility: exchange.score,
    valueCompatibility: value.score,
    budgetFit: budget.score,
    timelineFit: timeline.score,
    locationFit: location.score,
    reputation: reputation.score
  };
  const labels = {
    skillMatch: skill.label,
    attributeOverlap: skill.label,
    exchangeCompatibility: exchange.label,
    valueCompatibility: value.label,
    budgetFit: budget.label,
    timelineFit: timeline.label,
    locationFit: location.label,
    reputation: reputation.label
  };
  const score = skill.score * (weights.SKILL_MATCH ?? weights.ATTRIBUTE_OVERLAP ?? 0.25) + exchange.score * (weights.EXCHANGE_COMPATIBILITY ?? 0.2) + value.score * (weights.VALUE_COMPATIBILITY ?? 0.2) + budget.score * (weights.BUDGET_FIT ?? 0.1) + timeline.score * (weights.TIMELINE ?? 0.1) + location.score * (weights.LOCATION ?? 0.1) + reputation.score * (weights.REPUTATION ?? 0.05);
  const rounded = Math.min(1, Math.round(score * 1e3) / 1e3);
  return { score: rounded, breakdown, labels };
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
function getSubModel(key) {
  return SUB_MODEL_REGISTRY[key];
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
function deriveMatchingTopology(input) {
  const main = inferMainCollaborationModel(input);
  const subKey = normalizeSubModelType(input.subModelType, input);
  const sub = subKey ? getSubModel(subKey) : void 0;
  const exchange = normalizeExchangeMode(input.exchangeMode);
  if (sub?.allowedMatchTopologies.length === 1) {
    const topology = sub.allowedMatchTopologies[0];
    return {
      topology,
      reason: `${sub.name} allows ${topology} matching only`
    };
  }
  if (main === "cash_subcontracting" || subKey === "task_based" || subKey === "competition_rfp") {
    return { topology: "one_way", reason: "Cash subcontracting uses one-way need/offer matching" };
  }
  if (main === "resource_sharing") {
    const transactionType = String(
      input.collaborationAttributes?.transactionType ?? ""
    ).toLowerCase();
    if (transactionType === "barter" || exchange === "barter") {
      return {
        topology: "circular",
        reason: "Multi-party resource barter may form circular exchange rings",
        alternatives: ["one_way"]
      };
    }
    return {
      topology: "one_way",
      reason: "Resource sharing defaults to one-way matching",
      alternatives: ["circular"]
    };
  }
  if (main === "service_exchange" || exchange === "barter") {
    return { topology: "two_way", reason: "Service exchange / barter uses reciprocal two-way matching" };
  }
  if (main === "joint_venture" || subKey === "consortium" || subKey === "project_jv" || subKey === "spv" || subKey === "strategic_jv") {
    return { topology: "consortium", reason: "Joint venture sub-models use consortium group formation" };
  }
  if (main === "hiring" || subKey === "professional_hiring" || subKey === "consultant_hiring") {
    return {
      topology: "one_way",
      reason: "Hiring uses one-way matching (Application path documented separately)"
    };
  }
  if (exchange === "barter") {
    return { topology: "two_way", reason: "Barter exchange mode implies two-way matching" };
  }
  return { topology: "one_way", reason: "Default matching topology" };
}

// src/routing/detect-model.ts
function mapIntent(intent) {
  if (intent === "request") return "need";
  return intent ?? "need";
}
function detectMatchingModel(opportunity) {
  const intent = mapIntent(opportunity.intent);
  const hasNeed = intent === "need" || intent === "request" || intent === "hybrid";
  const hasOffer = intent === "offer" || intent === "hybrid";
  const acceptedModes = opportunity.value_exchange?.accepted_modes ?? [];
  const isBarter = (opportunity.exchangeMode ?? "").toLowerCase() === "barter" || acceptedModes.some((mode) => String(mode).toLowerCase() === "barter");
  const memberRoles = opportunity.attributes?.memberRoles;
  const partnerRoles = opportunity.attributes?.partnerRoles;
  const hasRoles = Array.isArray(memberRoles) && memberRoles.length > 0 || Array.isArray(partnerRoles) && partnerRoles.length > 0;
  const subModelType = normalizeSubModelType(opportunity.subModelType, {
    modelType: opportunity.modelType
  });
  const derived = deriveMatchingTopology({
    mainCollaborationModel: opportunity.mainCollaborationModel,
    modelType: opportunity.modelType,
    subModelType: subModelType ?? opportunity.subModelType,
    exchangeMode: opportunity.exchangeMode,
    acceptedExchangeModes: acceptedModes.map(String),
    collaborationAttributes: opportunity.attributes,
    intent
  });
  const modelList = [];
  const preferred = opportunity.preferredMatchingTopology ?? derived.topology;
  if (preferred) modelList.push(preferred);
  if ((hasNeed || hasOffer) && !modelList.includes("one_way")) modelList.push("one_way");
  if (isBarter && (hasNeed || hasOffer) && !modelList.includes("two_way")) modelList.push("two_way");
  if ((hasRoles || subModelType === "consortium") && !modelList.includes("consortium")) {
    modelList.push("consortium");
  }
  if (subModelType === "resource_sharing" || subModelType === "equipment_sharing") {
    if (!modelList.includes("circular")) modelList.push("circular");
  }
  return modelList.length > 0 ? modelList : ["one_way"];
}

// src/routing/rank-matches.ts
function rankMatches(matches, _model) {
  return (matches ?? []).map((match) => {
    const valueAnalysis = match.valueAnalysis;
    let valueFit = valueAnalysis?.valueFit ?? null;
    if (!valueFit && valueAnalysis?.equivalence) {
      const equivalenceScore = valueAnalysis.equivalence.equivalenceScore;
      if (equivalenceScore != null && equivalenceScore >= 0.7) {
        valueFit = "strong";
      }
    }
    const coverageRatio = valueAnalysis?.coverageRatio != null ? valueAnalysis?.coverageRatio : valueAnalysis?.equivalence ? ((valueAnalysis.equivalence.aCoversB ?? 0) + (valueAnalysis.equivalence.bCoversA ?? 0)) / 2 : 0.5;
    const repScore = match.breakdown?.reputation != null ? match.breakdown.reputation : 0.5;
    const timelineScore = match.breakdown?.timelineFit != null ? match.breakdown.timelineFit : 0.5;
    const compositeRank = 0.5 * (match.matchScore ?? 0) + 0.3 * (coverageRatio != null ? Math.min(coverageRatio, 1) : 0.5) + 0.1 * repScore + 0.1 * timelineScore;
    const tier = (match.matchScore ?? 0) >= 0.85 && valueFit === "strong" ? "top" : (match.matchScore ?? 0) >= 0.7 ? "good" : "possible";
    const recommendation = {
      tier,
      reason: tier === "top" ? "Strong skill and value fit" : tier === "good" ? "Good match; review value terms" : "Possible match; negotiation may be needed",
      actionRequired: tier === "top" ? "Ready to contract" : tier === "good" ? "Review and negotiate" : "Negotiate value exchange"
    };
    return {
      ...match,
      compositeRank,
      recommendation,
      scoreBreakdown: match.breakdown
    };
  }).sort((a, b) => (b.compositeRank != null ? b.compositeRank : b.matchScore ?? 0) - (a.compositeRank != null ? a.compositeRank : a.matchScore ?? 0));
}

// src/normalize/budget.ts
function extractBudget(opportunity) {
  const exchangeData = opportunity.exchangeData ?? {};
  const attributes = opportunity.attributes ?? {};
  let min = null;
  let max = null;
  let currency = String(exchangeData.currency ?? "SAR").toUpperCase();
  const budgetRange = exchangeData.budgetRange;
  if (budgetRange && typeof budgetRange === "object") {
    const range = budgetRange;
    min = range.min != null ? Number(range.min) : null;
    max = range.max != null ? Number(range.max) : null;
    if (range.currency) currency = String(range.currency).toUpperCase();
  }
  if (min == null && max == null && exchangeData.cashAmount != null) {
    const amount = Number(exchangeData.cashAmount);
    min = max = Number.isNaN(amount) ? null : amount;
  }
  const salaryRange = attributes.salaryRange;
  if (min == null && salaryRange && typeof salaryRange === "object") {
    const range = salaryRange;
    min = range.min != null ? Number(range.min) : null;
    max = range.max != null ? Number(range.max) : null;
    if (range.currency) currency = String(range.currency).toUpperCase();
  }
  if (min == null && attributes.targetPrice != null) {
    const amount = Number(attributes.targetPrice);
    min = max = Number.isNaN(amount) ? null : amount;
  }
  if (min == null && attributes.price != null) {
    const amount = Number(attributes.price);
    min = max = Number.isNaN(amount) ? null : amount;
  }
  return {
    min: min != null ? min : void 0,
    max: max != null ? max : void 0,
    currency
  };
}

// src/normalize/location.ts
function normalizeLocation(opportunity, locationCanonical = {}) {
  const attributes = opportunity.attributes ?? {};
  const locReq = attributes.locationRequirement ?? attributes.workMode;
  if (locReq) {
    const key = String(locReq).toLowerCase().replace(/\s+/g, "-");
    if (locationCanonical[key]) return locationCanonical[key];
    const altKey = String(locReq).toLowerCase();
    if (locationCanonical[altKey]) return locationCanonical[altKey];
    if (/remote/i.test(String(locReq))) return "Remote";
    if (/hybrid/i.test(String(locReq))) return "Hybrid";
    if (/on-site|onsite/i.test(String(locReq))) return "On-Site";
  }
  const region = (opportunity.locationRegion ?? "").toLowerCase().replace(/\s+/g, "-");
  const city = (opportunity.locationCity ?? "").toLowerCase().replace(/\s+/g, "-");
  const country = (opportunity.locationCountry ?? "").toLowerCase();
  if (region && locationCanonical[region]) return locationCanonical[region];
  if (city && locationCanonical[city]) return locationCanonical[city];
  if (country && locationCanonical[country]) return locationCanonical[country];
  if (opportunity.location && /remote/i.test(opportunity.location)) return "Remote";
  if (region) {
    return region.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }
  if (country === "sa" || country === "sau") return "KSA";
  return opportunity.location ?? "KSA";
}

// src/normalize/skill.ts
function toSkillString(skill) {
  if (!skill) return "";
  if (typeof skill === "string") return skill.trim();
  if (typeof skill === "object" && skill !== null) {
    const record = skill;
    return String(record.label ?? record.name ?? skill).trim();
  }
  return String(skill).trim();
}
function normalizeSkill(skill, synonyms = {}) {
  if (!skill || typeof skill !== "string") return "";
  const trimmed = skill.trim();
  if (!trimmed) return "";
  const key = trimmed.toLowerCase();
  return synonyms[key] ?? trimmed;
}

// src/normalize/timeline.ts
function extractTimeline(opportunity) {
  const attributes = opportunity.attributes ?? {};
  let start = null;
  let end = null;
  let durationDays = null;
  if (attributes.startDate) start = String(attributes.startDate);
  if (attributes.tenderDeadline) end = String(attributes.tenderDeadline);
  if (attributes.applicationDeadline) {
    end = String(attributes.applicationDeadline || end);
  }
  if (attributes.endDate && !end) end = String(attributes.endDate);
  const availability = attributes.availability;
  if (availability && typeof availability === "object") {
    const record = availability;
    start = record.start ?? start;
    end = record.end ?? end;
  }
  const deliveryTimeline = attributes.deliveryTimeline;
  if (deliveryTimeline && typeof deliveryTimeline === "object") {
    const record = deliveryTimeline;
    start = record.start ?? start;
    end = record.end ?? end;
  }
  if (attributes.duration != null) durationDays = Number(attributes.duration);
  if (attributes.projectDuration != null) durationDays = Number(attributes.projectDuration);
  if (attributes.contractDuration != null) durationDays = Number(attributes.contractDuration);
  return {
    start: start ?? void 0,
    end: end ?? void 0,
    durationDays: durationDays != null ? durationDays : void 0
  };
}

// src/normalize/extract.ts
function extractRole(opportunity, scope, attributes, synonyms, config) {
  const explicit = attributes.targetRole ?? attributes.professionalRole;
  if (explicit) return normalizeSkill(toSkillString(explicit), synonyms);
  if (config.STRICT_ROLE_REQUIRED !== false) return "";
  const primary = opportunity.intent === "offer" ? scope.offeredSkills?.[0] ?? attributes.offeredSkills?.[0] : scope.requiredSkills?.[0] ?? attributes.requiredSkills?.[0];
  return primary ? normalizeSkill(toSkillString(primary), synonyms) : "";
}
function extractCoreSkills(scope, attributes, synonyms) {
  const raw = [
    ...scope.coreSkills ?? [],
    ...attributes.coreSkills ?? []
  ].filter(Boolean);
  return [...new Set(raw.map((skill) => normalizeSkill(toSkillString(skill), synonyms)))];
}
function resolveReputation(creator) {
  if (!creator) return 0.5;
  if (creator.profile?.rating != null || creator.rating != null) {
    const rating = Number(creator.profile?.rating ?? creator.rating);
    return Number.isNaN(rating) ? 0.5 : Math.max(0, Math.min(1, rating));
  }
  if (creator.profile?.completedProjects != null) {
    const completed = Number(creator.profile.completedProjects);
    return Number.isNaN(completed) ? 0.5 : Math.min(1, 0.3 + Math.min(completed, 20) / 100);
  }
  return 0.5;
}
function extractAndNormalize(opportunity, canonical = {}, options = {}) {
  const config = withMatchingDefaults(options.config);
  const synonyms = canonical.skillSynonyms ?? {};
  const locationCanonical = canonical.locationCanonical ?? {};
  const scope = opportunity.scope ?? {};
  const attributes = opportunity.attributes ?? {};
  const requiredRaw = [
    ...scope.requiredSkills ?? [],
    ...attributes.requiredSkills ?? []
  ].filter(Boolean);
  const offeredRaw = [
    ...scope.offeredSkills ?? [],
    ...attributes.offeredSkills ?? []
  ].filter(Boolean);
  const requiredServices = [...new Set(requiredRaw.map((skill) => normalizeSkill(toSkillString(skill), synonyms)))];
  const offeredServices = [...new Set(offeredRaw.map((skill) => normalizeSkill(toSkillString(skill), synonyms)))];
  const role = extractRole(opportunity, scope, attributes, synonyms, config);
  const coreSkills = extractCoreSkills(scope, attributes, synonyms);
  const skills = [.../* @__PURE__ */ new Set([...requiredServices, ...offeredServices])];
  const categories = [
    ...opportunity.modelType ? [opportunity.modelType] : [],
    ...opportunity.subModelType ? [opportunity.subModelType] : [],
    ...scope.sectors ?? []
  ].filter(Boolean);
  const budget = extractBudget(opportunity);
  const timeline = extractTimeline(opportunity);
  const deadline = timeline.end ?? (opportunity.intent === "request" ? attributes.tenderDeadline ?? attributes.applicationDeadline : void 0);
  const availability = timeline.start && timeline.end ? { start: timeline.start, end: timeline.end } : attributes.availability;
  return {
    skills,
    requiredServices,
    offeredServices,
    role,
    coreSkills,
    categories,
    budget,
    timeline,
    deadline: deadline ?? void 0,
    availability: availability ?? void 0,
    location: normalizeLocation(opportunity, locationCanonical),
    reputation: resolveReputation(options.creator),
    intent: opportunity.intent ?? "request",
    modelType: opportunity.modelType,
    subModelType: opportunity.subModelType
  };
}

// src/models/shared.ts
function resolveThreshold(config) {
  return config.POST_TO_POST_THRESHOLD ?? 0.5;
}
function resolveMaxCandidates(config, override) {
  return override ?? config.CANDIDATE_MAX ?? 200;
}
function resolveNormalized(opportunity, canonical, config) {
  return opportunity.normalized ?? extractAndNormalize(opportunity, canonical, { config });
}
function passHardGate(needPost, offerPost, needNorm, offerNorm, config) {
  return passesPair(needPost, offerPost, config, { needNorm, offerNorm }).ok;
}
function withRunnerConfig(config) {
  return withMatchingDefaults(config);
}
function parseRoleDefinitions(attributes) {
  const memberRoles = attributes?.memberRoles ?? attributes?.partnerRoles;
  if (!Array.isArray(memberRoles)) return [];
  return memberRoles.map((entry) => {
    if (typeof entry === "string") return { role: entry };
    if (entry && typeof entry === "object") {
      const record = entry;
      const role = record.role ?? record.label;
      return role ? { role, scope: record.scope } : null;
    }
    return null;
  }).filter((entry) => Boolean(entry?.role));
}
function buildRoleServices(roleDef) {
  const role = roleDef.role;
  const scopeWords = (roleDef.scope ?? "").split(/[\s,/|&+-]+/).map((word) => word.trim()).filter((word) => word.length > 2);
  return [role, ...scopeWords].filter((value, index, array) => value && array.indexOf(value) === index).slice(0, 10);
}
function buildSyntheticNeedForRole(leadNeed, leadNorm, roleDef) {
  const role = roleDef.role;
  const roleServices = buildRoleServices(roleDef);
  return {
    ...leadNeed,
    id: `${leadNeed.id ?? "need"}-role-${role.replace(/\s/g, "_")}`,
    attributes: { ...leadNeed.attributes ?? {}, targetRole: role },
    scope: { ...leadNeed.scope ?? {}, requiredSkills: roleServices },
    normalized: {
      ...leadNorm,
      role,
      requiredServices: roleServices,
      skills: roleServices
    }
  };
}

// src/models/value-estimate.ts
function estimateValueSar(opportunity) {
  const exchangeData = opportunity.exchangeData ?? {};
  const attributes = opportunity.attributes ?? {};
  if (exchangeData.cashAmount != null) return Number(exchangeData.cashAmount);
  const budgetRange = exchangeData.budgetRange;
  if (budgetRange && typeof budgetRange === "object") {
    const range = budgetRange;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isNaN(min) && !Number.isNaN(max)) return (min + max) / 2;
    if (!Number.isNaN(min)) return min;
    if (!Number.isNaN(max)) return max;
  }
  const salaryRange = attributes.salaryRange;
  if (salaryRange && typeof salaryRange === "object") {
    const range = salaryRange;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isNaN(min) && !Number.isNaN(max)) return (min + max) / 2;
    if (!Number.isNaN(min)) return min;
    if (!Number.isNaN(max)) return max;
  }
  if (exchangeData.barterValue != null) return Number(exchangeData.barterValue);
  if (attributes.price != null) return Number(attributes.price);
  if (attributes.targetPrice != null) return Number(attributes.targetPrice);
  return null;
}
function valueEquivalenceText(opportunityA, opportunityB) {
  const valueA = estimateValueSar(opportunityA);
  const valueB = estimateValueSar(opportunityB);
  if (valueA == null || valueB == null || valueB === 0) return void 0;
  const ratio = valueA / valueB;
  const titleB = opportunityB.title ?? "units";
  return `~${ratio.toFixed(1)} \xD7 (${titleB})`;
}
function barterSidePost(needPost, offerPost) {
  const needNorm = getNormalized(needPost);
  const offerNorm = getNormalized(offerPost);
  return {
    value_exchange: {
      _normalized: {
        totalOffered: offerNorm.totalOffered,
        totalExpected: needNorm.totalExpected,
        riskAdjustedOffered: offerNorm.riskAdjustedOffered,
        riskAdjustedExpected: needNorm.riskAdjustedExpected
      }
    }
  };
}

// src/models/one-way.ts
function scoreOneWayMatch(needPost, offerPost, config, canonical, threshold) {
  const needNorm = resolveNormalized(needPost, canonical, config);
  const offerNorm = resolveNormalized(offerPost, canonical, config);
  if (!passHardGate(needPost, offerPost, needNorm, offerNorm, config)) return null;
  const scored = scorePair(needPost, offerPost, config, needNorm, offerNorm);
  if (scored.score < threshold) return null;
  const valueAnalysis = { ...oneWayValueFit(needPost, offerPost) };
  return {
    matchScore: scored.score,
    breakdown: scored.breakdown,
    labels: scored.labels,
    valueAnalysis,
    suggestedPartners: [{
      opportunityId: offerPost.id,
      creatorId: offerPost.creatorId
    }],
    needOpportunityId: needPost.id,
    offerOpportunityId: offerPost.id
  };
}
function findOffersForNeedPure(needPost, offerPosts, config, canonical = {}, options = {}) {
  const resolvedConfig = withRunnerConfig(config);
  if ((needPost.intent ?? "request") !== "request") {
    return { model: "one_way", matches: [] };
  }
  const threshold = resolveThreshold(resolvedConfig);
  const needNorm = resolveNormalized(needPost, canonical, resolvedConfig);
  const candidates = getCandidates(needPost, offerPosts, resolvedConfig, {
    maxCandidates: resolveMaxCandidates(resolvedConfig, options.maxCandidates),
    needNormalized: needNorm
  });
  const matches = candidates.map((offer) => scoreOneWayMatch(needPost, offer, resolvedConfig, canonical, threshold)).filter((match) => match != null).sort((a, b) => b.matchScore - a.matchScore);
  const topN = options.topN ?? 20;
  return { model: "one_way", matches: matches.slice(0, topN) };
}
function findNeedsForOfferPure(offerPost, needPosts, config, canonical = {}, options = {}) {
  const resolvedConfig = withRunnerConfig(config);
  if ((offerPost.intent ?? "") !== "offer" || offerPost.status !== "published") {
    return { model: "one_way", direction: "offer_to_needs", matches: [] };
  }
  const threshold = resolveThreshold(resolvedConfig);
  const offerNorm = resolveNormalized(offerPost, canonical, resolvedConfig);
  const candidates = getCandidatesForOffer(offerPost, needPosts, resolvedConfig, {
    maxCandidates: resolveMaxCandidates(resolvedConfig, options.maxCandidates),
    offerNormalized: offerNorm
  });
  const matches = [];
  for (const need of candidates) {
    const needNorm = resolveNormalized(need, canonical, resolvedConfig);
    if (!passHardGate(need, offerPost, needNorm, offerNorm, resolvedConfig)) continue;
    const scored = scorePair(need, offerPost, resolvedConfig, needNorm, offerNorm);
    if (scored.score < threshold) continue;
    matches.push({
      matchScore: scored.score,
      breakdown: scored.breakdown,
      labels: scored.labels,
      suggestedPartners: [{
        opportunityId: need.id,
        creatorId: need.creatorId
      }],
      needOpportunityId: need.id,
      offerOpportunityId: offerPost.id
    });
  }
  matches.sort((a, b) => b.matchScore - a.matchScore);
  const topN = options.topN ?? 20;
  return {
    model: "one_way",
    direction: "offer_to_needs",
    matches: matches.slice(0, topN)
  };
}

// src/models/two-way.ts
function findBarterMatchesPure(anchorPost, needPosts, offerPosts, config, canonical = {}, _options = {}) {
  const resolvedConfig = withRunnerConfig(config);
  const threshold = resolveThreshold(resolvedConfig);
  const creatorIdA = anchorPost.creatorId;
  if (!creatorIdA) return { model: "two_way", matches: [] };
  const needA = needPosts.find((post) => post.creatorId === creatorIdA);
  const offerA = offerPosts.find((post) => post.creatorId === creatorIdA);
  if (!needA || !offerA) return { model: "two_way", matches: [] };
  const normNeedA = resolveNormalized(needA, canonical, resolvedConfig);
  const normOfferA = resolveNormalized(offerA, canonical, resolvedConfig);
  const otherNeeds = needPosts.filter((post) => post.creatorId !== creatorIdA);
  const otherOffers = offerPosts.filter((post) => post.creatorId !== creatorIdA);
  const matches = [];
  for (const needB of otherNeeds) {
    const offersByCreator = otherOffers.filter((offer) => offer.creatorId === needB.creatorId);
    for (const offerB of offersByCreator) {
      const normNeedB = resolveNormalized(needB, canonical, resolvedConfig);
      const normOfferB = resolveNormalized(offerB, canonical, resolvedConfig);
      if (!passHardGate(needB, offerA, normNeedB, normOfferA, resolvedConfig)) continue;
      if (!passHardGate(needA, offerB, normNeedA, normOfferB, resolvedConfig)) continue;
      const scoreAtoB = scorePair(needB, offerA, resolvedConfig, normNeedB, normOfferA).score;
      const scoreBtoA = scorePair(needA, offerB, resolvedConfig, normNeedA, normOfferB).score;
      if (scoreAtoB < threshold || scoreBtoA < threshold) continue;
      const pairScore = (scoreAtoB + scoreBtoA) / 2;
      const equivalence = barterValueEquivalence(
        barterSidePost(needA, offerA),
        barterSidePost(needB, offerB)
      );
      matches.push({
        matchScore: pairScore,
        breakdown: { scoreAtoB, scoreBtoA },
        valueEquivalence: valueEquivalenceText(offerA, needB) ?? valueEquivalenceText(offerB, needA),
        valueAnalysis: { equivalence },
        suggestedPartners: [
          { opportunityId: needB.id, creatorId: needB.creatorId },
          { opportunityId: offerB.id, creatorId: offerB.creatorId }
        ],
        needOpportunityId: needB.id,
        offerOpportunityId: offerB.id
      });
    }
  }
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return { model: "two_way", matches };
}

// src/models/consortium.ts
function findConsortiumMatchesPure(leadNeed, offerPosts, config, canonical = {}, options = {}) {
  const resolvedConfig = withRunnerConfig(config);
  const roleDefs = parseRoleDefinitions(leadNeed.attributes);
  const roles = roleDefs.map((roleDef) => roleDef.role);
  if (roles.length === 0) {
    const oneWay = findOffersForNeedPure(leadNeed, offerPosts, resolvedConfig, canonical, {
      topN: options.topN ?? 10,
      maxCandidates: options.maxCandidates
    });
    return {
      model: "consortium",
      roles: ["General"],
      roleResults: [],
      complete: oneWay.matches.length > 0,
      matches: oneWay.matches.map((match) => ({ ...match, role: "General" }))
    };
  }
  const threshold = resolveThreshold(resolvedConfig);
  const leadNorm = resolveNormalized(leadNeed, canonical, resolvedConfig);
  const usedCreatorIds = new Set(leadNeed.creatorId ? [leadNeed.creatorId] : []);
  const suggestedPartners = [];
  const roleResults = [];
  for (const roleDef of roleDefs) {
    const role = roleDef.role;
    const syntheticNeed = buildSyntheticNeedForRole(leadNeed, leadNorm, roleDef);
    const candidates = getCandidates(syntheticNeed, offerPosts, resolvedConfig, {
      needNormalized: syntheticNeed.normalized,
      maxCandidates: options.maxCandidates ?? 50
    });
    let best = null;
    let bestScore = threshold;
    for (const offer of candidates) {
      if (offer.creatorId && usedCreatorIds.has(offer.creatorId)) continue;
      const offerNorm = resolveNormalized(offer, canonical, resolvedConfig);
      if (!passHardGate(syntheticNeed, offer, syntheticNeed.normalized ?? {}, offerNorm, resolvedConfig)) {
        continue;
      }
      const { score } = scorePair(
        syntheticNeed,
        offer,
        resolvedConfig,
        syntheticNeed.normalized,
        offerNorm
      );
      if (score > bestScore) {
        bestScore = score;
        best = offer;
      }
    }
    if (best) {
      if (best.creatorId) usedCreatorIds.add(best.creatorId);
      roleResults.push({
        role,
        opportunityId: best.id,
        creatorId: best.creatorId,
        matchScore: bestScore
      });
      suggestedPartners.push({
        opportunityId: best.id,
        creatorId: best.creatorId,
        role
      });
    }
  }
  const aggregateScore = roleResults.length > 0 ? roleResults.reduce((sum, result) => sum + result.matchScore, 0) / roleResults.length : 0;
  const complete = roleResults.length === roles.length;
  const breakdown = roleResults.reduce((accumulator, result) => {
    accumulator[result.role] = result.matchScore;
    return accumulator;
  }, {});
  return {
    model: "consortium",
    roles,
    roleResults,
    complete,
    matches: complete || roleResults.length > 0 ? [{
      matchScore: aggregateScore,
      breakdown,
      suggestedPartners
    }] : []
  };
}

// src/models/circular.ts
function normalizeCycleRing(cycle) {
  if (!Array.isArray(cycle) || !cycle.length) return [];
  const ring = cycle.filter(Boolean);
  if (ring.length > 1 && ring[0] === ring[ring.length - 1]) {
    return ring.slice(0, -1);
  }
  return ring;
}
function buildCircularLinkScores(ring, edgeDetails) {
  if (!ring || ring.length < 2) return null;
  const linkScores = [];
  for (let index = 0; index < ring.length; index++) {
    const fromCreatorId = ring[index];
    const toCreatorId = ring[(index + 1) % ring.length];
    const detail = edgeDetails[`${fromCreatorId}->${toCreatorId}`];
    if (!detail || !detail.need || !detail.offer || detail.need.id == null || detail.offer.id == null || detail.score == null) {
      return null;
    }
    linkScores.push({
      fromCreatorId,
      toCreatorId,
      needId: detail.need.id,
      offerId: detail.offer.id,
      score: detail.score
    });
  }
  return linkScores;
}
function buildCreatorGraph(needPosts, offerPosts, config, canonical, threshold) {
  const outEdges = {};
  const edgeDetails = {};
  for (const need of needPosts) {
    const needNorm = resolveNormalized(need, canonical, config);
    const fromCreator = need.creatorId;
    if (!fromCreator) continue;
    for (const offer of offerPosts) {
      if (offer.creatorId === fromCreator) continue;
      const offerNorm = resolveNormalized(offer, canonical, config);
      if (!passHardGate(need, offer, needNorm, offerNorm, config)) continue;
      const { score } = scorePair(need, offer, config, needNorm, offerNorm);
      if (score < threshold || !offer.creatorId) continue;
      const toCreator = offer.creatorId;
      if (!outEdges[fromCreator]) outEdges[fromCreator] = [];
      if (!outEdges[fromCreator].includes(toCreator)) outEdges[fromCreator].push(toCreator);
      const key = `${fromCreator}->${toCreator}`;
      if (!edgeDetails[key] || score > edgeDetails[key].score) {
        edgeDetails[key] = { score, need, offer };
      }
    }
  }
  return { outEdges, edgeDetails };
}
function findCycles(outEdges, minCycleLength) {
  const creatorIds = [
    .../* @__PURE__ */ new Set([
      ...Object.keys(outEdges),
      ...Object.values(outEdges).flat()
    ])
  ];
  const cycles = [];
  const path = [];
  const pathSet = /* @__PURE__ */ new Set();
  function visit(node, depth, startNode) {
    if (depth >= minCycleLength && node === startNode && path.length >= minCycleLength) {
      cycles.push([...path]);
      return;
    }
    if (depth >= 6) return;
    const list = outEdges[node] ?? [];
    for (const next of list) {
      if (pathSet.has(next) && next !== startNode) continue;
      if (depth >= minCycleLength - 1 && next === startNode) {
        path.push(next);
        cycles.push([...path]);
        path.pop();
        continue;
      }
      pathSet.add(next);
      path.push(next);
      visit(next, depth + 1, startNode);
      path.pop();
      pathSet.delete(next);
    }
  }
  creatorIds.forEach((start) => {
    path.length = 0;
    pathSet.clear();
    pathSet.add(start);
    visit(start, 0, start);
  });
  return cycles;
}
function findCircularExchangesPure(needPosts, offerPosts, config, canonical = {}, options = {}) {
  const resolvedConfig = withRunnerConfig(config);
  const threshold = resolveThreshold(resolvedConfig);
  const minCycleLength = options.minCycleLength ?? 3;
  const { outEdges, edgeDetails } = buildCreatorGraph(
    needPosts,
    offerPosts,
    resolvedConfig,
    canonical,
    threshold
  );
  const cycles = findCycles(outEdges, minCycleLength);
  const uniqueCycles = [];
  const seen = /* @__PURE__ */ new Set();
  for (const cycle of cycles) {
    const ring = normalizeCycleRing(cycle);
    if (ring.length < minCycleLength) continue;
    const key = ring.slice().sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const linkScores = buildCircularLinkScores(ring, edgeDetails);
    if (!linkScores || linkScores.length < minCycleLength) continue;
    let cycleScore = 0;
    const suggestedPartners = [];
    for (const link of linkScores) {
      cycleScore += link.score;
      suggestedPartners.push({
        opportunityId: link.offerId,
        creatorId: link.toCreatorId
      });
    }
    cycleScore = ring.length > 0 ? cycleScore / ring.length : 0;
    uniqueCycles.push({
      matchScore: cycleScore,
      cycle: ring,
      suggestedPartners,
      linkScores,
      links: linkScores
    });
  }
  uniqueCycles.sort((a, b) => b.matchScore - a.matchScore);
  return { model: "circular", matches: uniqueCycles };
}

// src/engine/run-matching-for-post.ts
function normalizePost(post, canonical, config) {
  if (post.normalized) return post;
  return {
    ...post,
    normalized: extractAndNormalize(post, canonical, { config })
  };
}
function splitPool(pool) {
  const needs = [];
  const offers = [];
  for (const post of pool) {
    const intent = post.intent ?? "request";
    if (intent === "request" || intent === "hybrid") needs.push(post);
    if (intent === "offer" || intent === "hybrid") offers.push(post);
  }
  return { needs, offers };
}
function resolveModels(anchor, options) {
  const selected = options?.model ?? "auto";
  if (selected !== "auto") return [selected];
  return detectMatchingModel(anchor);
}
function toRunnerOptions(options) {
  return {
    topN: options?.topN,
    maxCandidates: options?.maxCandidates,
    minCycleLength: options?.minCycleLength
  };
}
function applyRanking(result) {
  const ranked = rankMatches([...result.matches], result.model);
  return { ...result, matches: ranked };
}
function applyTopN(result, topN) {
  if (topN == null) return result;
  return { ...result, matches: result.matches.slice(0, topN) };
}
function filterConsortiumResult(result, includeIncompleteConsortium) {
  if (includeIncompleteConsortium !== false || result.complete) {
    return result;
  }
  return { ...result, matches: [] };
}
function runOneWay(anchor, needs, offers, config, canonical, runnerOptions) {
  const intent = anchor.intent ?? "request";
  if (intent === "offer") {
    return findNeedsForOfferPure(anchor, needs, config, canonical, runnerOptions);
  }
  return findOffersForNeedPure(anchor, offers, config, canonical, runnerOptions);
}
function runMatchingForPost(input) {
  const config = withMatchingDefaults(input.config);
  const canonical = input.canonical ?? {};
  const options = input.options ?? {};
  const runnerOptions = toRunnerOptions(options);
  const anchor = normalizePost(input.anchorPost, canonical, config);
  const pool = input.opportunities.filter((post) => post.id !== anchor.id).map((post) => normalizePost(post, canonical, config));
  const { needs, offers } = splitPool([anchor, ...pool]);
  const models = resolveModels(anchor, options);
  const results = [];
  for (const model of models) {
    let result = null;
    switch (model) {
      case "one_way":
        result = runOneWay(anchor, needs, offers, config, canonical, runnerOptions);
        break;
      case "two_way":
        result = findBarterMatchesPure(anchor, needs, offers, config, canonical, runnerOptions);
        break;
      case "consortium":
        result = filterConsortiumResult(
          findConsortiumMatchesPure(anchor, offers, config, canonical, runnerOptions),
          options.includeIncompleteConsortium
        );
        break;
      case "circular":
        result = findCircularExchangesPure(needs, offers, config, canonical, runnerOptions);
        break;
      default:
        break;
    }
    if (result) {
      results.push(applyTopN(applyRanking(result), options.topN));
    }
  }
  return results;
}

// src/normalize/category.ts
function normalizeCategory(category, categoryExpansion = {}) {
  if (!category || typeof category !== "string") return "";
  const trimmed = category.trim();
  if (!trimmed) return "";
  const key = trimmed.toLowerCase();
  const expanded = categoryExpansion[key];
  if (Array.isArray(expanded) && expanded.length > 0) return expanded[0];
  if (typeof expanded === "string") return expanded;
  return trimmed;
}

// src/normalize/semantic-profile.ts
function resolveExpansion(canonical) {
  return canonical.semanticTerms ?? canonical.categoryExpansion ?? {};
}
function expandTerm(term, categoryExpansion = {}) {
  if (!term || typeof term !== "string") return [];
  const key = term.toLowerCase().trim();
  const expanded = categoryExpansion?.[key];
  if (Array.isArray(expanded)) return [...expanded];
  if (typeof expanded === "string") return [expanded];
  return [term];
}
function buildSemanticProfile(normalizedPost, opportunity = null, canonical = {}) {
  const expansion = resolveExpansion(canonical) ?? {};
  const categoryTags = [
    ...normalizedPost.categories ?? [],
    ...normalizedPost.modelType ? [normalizedPost.modelType] : [],
    ...normalizedPost.subModelType ? [normalizedPost.subModelType] : []
  ].filter(Boolean);
  const uniqueTags = [...new Set(categoryTags)];
  const expandedSet = new Set(normalizedPost.skills ?? []);
  (normalizedPost.skills ?? []).forEach((skill) => {
    expandTerm(skill, expansion).forEach((term) => expandedSet.add(term));
  });
  if (opportunity && (opportunity.title || opportunity.description)) {
    const text = [opportunity.title, opportunity.description].filter(Boolean).join(" ").toLowerCase();
    Object.keys(expansion).forEach((key) => {
      if (!text.includes(key)) return;
      const value = expansion[key];
      const terms = Array.isArray(value) ? value : value ? [value] : [];
      terms.forEach((term) => expandedSet.add(term));
    });
  }
  return {
    structured: normalizedPost,
    categoryTags: uniqueTags,
    expandedSkillsOrCategories: [...expandedSet]
  };
}
export {
  DEFAULT_MATCHING_CONFIG,
  DEFAULT_WEIGHTS,
  EMPTY_CANONICAL_DATA,
  LABEL_PARTIAL,
  ROLE_ALIASES,
  ROLE_COMPATIBILITY,
  attributeOverlap,
  barterSidePost,
  barterValueEquivalence,
  budgetCompatible,
  budgetFit,
  buildCircularLinkScores,
  buildRoleServices,
  buildSemanticProfile,
  buildSyntheticNeedForRole,
  categoryOverlap,
  detectMatchingModel,
  estimateValueSar,
  exchangeCompatibility,
  exchangeCompatibilityFactor,
  expandTerm,
  extractAndNormalize,
  extractBudget,
  extractTimeline,
  findBarterMatchesPure,
  findCircularExchangesPure,
  findConsortiumMatchesPure,
  findNeedsForOfferPure,
  findOffersForNeedPure,
  getCandidates,
  getCandidatesForOffer,
  getNeedRole,
  getNormalized,
  getOfferRole,
  labelFromScore,
  locationCompatible,
  locationFit,
  normalizeCategory,
  normalizeCycleRing,
  normalizeLocation,
  normalizeRoleLabel,
  normalizeSkill,
  oneWayValueFit,
  parseRoleDefinitions,
  passHardGate,
  passesCoreSkills,
  passesPair,
  passesServiceOverlap,
  rankMatches,
  reputationScore,
  resolveMaxCandidates,
  resolveNormalized,
  resolveThreshold,
  resolveWeights,
  rolesCompatible,
  runMatchingForPost,
  scorePair,
  serviceOverlapScore,
  timelineFit,
  timelineOverlap,
  toSkillString,
  valueCompatibility,
  valueCompatibilityFactor,
  valueEquivalenceText,
  withMatchingDefaults,
  withRunnerConfig
};
