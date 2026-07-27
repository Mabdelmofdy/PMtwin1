// src/types/profile-fit.ts
var PROFILE_FIT_SNAPSHOT_KIND = "profile-fit-snapshot";

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
  const offerServices = (offerNorm.offeredServices?.length ? offerNorm.offeredServices : void 0) ?? (offerNorm.skills?.length ? offerNorm.skills : void 0) ?? (offerNorm.requiredServices?.length ? offerNorm.requiredServices : void 0) ?? [];
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
  const needServices = (needNorm.requiredServices?.length ? needNorm.requiredServices : void 0) ?? (needNorm.skills?.length ? needNorm.skills : void 0) ?? [];
  const offerServices = (offerNorm.offeredServices?.length ? offerNorm.offeredServices : void 0) ?? (offerNorm.skills?.length ? offerNorm.skills : void 0) ?? (offerNorm.requiredServices?.length ? offerNorm.requiredServices : void 0) ?? [];
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

// src/scoring/profile-fit-scoring.ts
var FACTOR_WEIGHTS = {
  capabilities: 0.2,
  services: 0.2,
  sectors: 0.12,
  geography: 0.12,
  workMode: 0.1,
  availability: 0.1,
  verifiedCredentials: 0.08,
  counterpartPreference: 0.08
};
var SNAPSHOT_KEYS = [
  "kind",
  "capabilities",
  "services",
  "sectors",
  "geography",
  "workModes",
  "availability",
  "verifiedCredentials",
  "counterpartPreference"
];
var GEOGRAPHY_KEYS = ["countries", "regions", "cities"];
var PREFERENCE_KEYS = [
  "capabilities",
  "services",
  "sectors",
  "geography",
  "workModes",
  "verifiedCredentials"
];
var AVAILABILITY_KEYS = ["start", "end"];
var WORK_MODES = ["remote", "hybrid", "onsite"];
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasExactKeys(value, expected) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}
function isGeography(value) {
  return isRecord(value) && hasExactKeys(value, GEOGRAPHY_KEYS) && isStringArray(value.countries) && isStringArray(value.regions) && isStringArray(value.cities);
}
function isWorkModes(value) {
  return Array.isArray(value) && value.every((item) => WORK_MODES.includes(item));
}
function isIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function isAvailability(value) {
  return value === null || isRecord(value) && hasExactKeys(value, AVAILABILITY_KEYS) && isIsoDate(value.start) && isIsoDate(value.end) && value.start <= value.end;
}
function isCounterpartPreference(value) {
  return isRecord(value) && hasExactKeys(value, PREFERENCE_KEYS) && isStringArray(value.capabilities) && isStringArray(value.services) && isStringArray(value.sectors) && isGeography(value.geography) && isWorkModes(value.workModes) && isStringArray(value.verifiedCredentials);
}
function isProfileFitSnapshot(value) {
  return isRecord(value) && hasExactKeys(value, SNAPSHOT_KEYS) && value.kind === PROFILE_FIT_SNAPSHOT_KIND && isStringArray(value.capabilities) && isStringArray(value.services) && isStringArray(value.sectors) && isGeography(value.geography) && isWorkModes(value.workModes) && isAvailability(value.availability) && isStringArray(value.verifiedCredentials) && isCounterpartPreference(value.counterpartPreference);
}
function normalized(values) {
  return [...new Set(values.map((value) => value.trim().toLocaleLowerCase("en-US")))].sort();
}
function valuesFrom(value) {
  if (typeof value === "string" && value.trim()) return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && Boolean(item.trim()));
}
function mergeValues(...groups) {
  return normalized(groups.flat());
}
function geographyValues(geography) {
  return mergeValues(geography.countries, geography.regions, geography.cities);
}
function opportunityWorkModes(opportunity) {
  const raw = [
    ...valuesFrom(opportunity.attributes?.workMode),
    ...valuesFrom(opportunity.attributes?.workModes)
  ];
  if (opportunity.normalized?.location?.toLocaleLowerCase("en-US") === "remote" || opportunity.location?.toLocaleLowerCase("en-US") === "remote") {
    raw.push("remote");
  }
  const modes = raw.flatMap((value) => {
    const mode = value.trim().toLocaleLowerCase("en-US").replace(/[-_\s]/g, "");
    if (mode === "remote") return ["remote"];
    if (mode === "hybrid") return ["hybrid"];
    if (mode === "onsite" || mode === "office") return ["onsite"];
    return [];
  });
  return [...new Set(modes)].sort();
}
function opportunityGeography(opportunity) {
  return {
    countries: mergeValues(
      valuesFrom(opportunity.locationCountry),
      valuesFrom(opportunity.attributes?.locationCountry),
      valuesFrom(opportunity.attributes?.country)
    ),
    regions: mergeValues(
      valuesFrom(opportunity.locationRegion),
      valuesFrom(opportunity.attributes?.locationRegion),
      valuesFrom(opportunity.attributes?.region)
    ),
    cities: mergeValues(
      valuesFrom(opportunity.locationCity),
      valuesFrom(opportunity.location),
      valuesFrom(opportunity.normalized?.location),
      valuesFrom(opportunity.attributes?.locationRequirement),
      valuesFrom(opportunity.attributes?.city)
    ).filter((value) => value !== "remote")
  };
}
function opportunityCriteria(opportunity) {
  const scope = opportunity.scope ?? {};
  const attributes = opportunity.attributes ?? {};
  const normalizedPost = opportunity.normalized ?? {};
  const availability = normalizedPost.timeline ?? normalizedPost.availability;
  return {
    capabilities: mergeValues(
      normalizedPost.coreSkills ?? [],
      valuesFrom(scope.requiredCapabilities),
      valuesFrom(attributes.requiredCapabilities),
      valuesFrom(attributes.coreSkills)
    ),
    services: mergeValues(
      normalizedPost.requiredServices ?? [],
      valuesFrom(scope.requiredSkills),
      valuesFrom(scope.requiredServices),
      valuesFrom(attributes.requiredSkills),
      valuesFrom(attributes.requiredServices)
    ),
    sectors: mergeValues(
      normalizedPost.categories ?? [],
      valuesFrom(scope.sectors),
      valuesFrom(attributes.sectors),
      valuesFrom(attributes.sector)
    ),
    geography: opportunityGeography(opportunity),
    workModes: opportunityWorkModes(opportunity),
    availability: availability ? { start: availability.start, end: availability.end } : null,
    verifiedCredentials: mergeValues(
      valuesFrom(scope.requiredCredentials),
      valuesFrom(attributes.requiredCredentials),
      valuesFrom(attributes.verifiedCredentials)
    )
  };
}
function profileCriteria(profile) {
  const preference = profile.counterpartPreference;
  const preferredGeography = geographyValues(preference.geography).length ? preference.geography : profile.geography;
  return {
    capabilities: preference.capabilities.length ? preference.capabilities : profile.capabilities,
    services: preference.services.length ? preference.services : profile.services,
    sectors: preference.sectors.length ? preference.sectors : profile.sectors,
    geography: preferredGeography,
    workModes: preference.workModes.length ? preference.workModes : profile.workModes,
    availability: profile.availability,
    verifiedCredentials: preference.verifiedCredentials.length ? preference.verifiedCredentials : profile.verifiedCredentials
  };
}
function profileTraits(profile) {
  return {
    capabilities: profile.capabilities,
    services: profile.services,
    sectors: profile.sectors,
    geography: profile.geography,
    workModes: profile.workModes,
    availability: profile.availability,
    verifiedCredentials: profile.verifiedCredentials
  };
}
function coverage(factor, offered, required, explanation) {
  const offeredSet = new Set(normalized(offered));
  const requiredValues = normalized(required);
  const matched = requiredValues.filter((value) => offeredSet.has(value));
  const missing = requiredValues.filter((value) => !offeredSet.has(value));
  const applicable = requiredValues.length > 0;
  return {
    factor,
    score: applicable ? matched.length / requiredValues.length : 1,
    weight: FACTOR_WEIGHTS[factor],
    applicable,
    matched,
    missing,
    explanation: applicable ? `${explanation}: ${matched.length} of ${requiredValues.length} criteria matched.` : `${explanation}: no target criterion supplied; excluded from the total.`
  };
}
function availabilityFactor(offered, required) {
  const applicable = Boolean(required?.start || required?.end);
  if (!applicable) {
    return {
      factor: "availability",
      score: 1,
      weight: FACTOR_WEIGHTS.availability,
      applicable: false,
      matched: [],
      missing: [],
      explanation: "Availability: no target date criterion supplied; excluded from the total."
    };
  }
  if (!offered) {
    return {
      factor: "availability",
      score: 0,
      weight: FACTOR_WEIGHTS.availability,
      applicable: true,
      matched: [],
      missing: ["availability"],
      explanation: "Availability: the profile supplied no availability window."
    };
  }
  const offeredStart = Date.parse(`${offered.start}T00:00:00.000Z`);
  const offeredEnd = Date.parse(`${offered.end}T00:00:00.000Z`);
  const requiredStart = required?.start ? Date.parse(`${required.start}T00:00:00.000Z`) : Number.NEGATIVE_INFINITY;
  const requiredEnd = required?.end ? Date.parse(`${required.end}T00:00:00.000Z`) : Number.POSITIVE_INFINITY;
  const overlaps = offeredStart <= requiredEnd && offeredEnd >= requiredStart;
  let score = overlaps ? 1 : 0;
  if (overlaps && Number.isFinite(requiredStart) && Number.isFinite(requiredEnd) && requiredEnd > requiredStart) {
    const overlap = Math.max(
      0,
      Math.min(offeredEnd, requiredEnd) - Math.max(offeredStart, requiredStart)
    );
    score = overlap / (requiredEnd - requiredStart);
  }
  return {
    factor: "availability",
    score,
    weight: FACTOR_WEIGHTS.availability,
    applicable: true,
    matched: overlaps ? ["availability"] : [],
    missing: overlaps ? [] : ["availability"],
    explanation: overlaps ? `Availability: windows overlap with ${Math.round(score * 100)}% target coverage.` : "Availability: windows do not overlap."
  };
}
function preferenceFactor(preference, target) {
  const comparisons = [
    [preference.capabilities, target.capabilities],
    [preference.services, target.services],
    [preference.sectors, target.sectors],
    [geographyValues(preference.geography), geographyValues(target.geography)],
    [preference.workModes, target.workModes],
    [preference.verifiedCredentials, target.verifiedCredentials]
  ];
  const requirements = comparisons.flatMap(([required]) => normalized(required));
  const matched = [];
  const missing = [];
  for (const [required, offered] of comparisons) {
    const offeredSet = new Set(normalized(offered));
    for (const value of normalized(required)) {
      if (offeredSet.has(value)) matched.push(value);
      else missing.push(value);
    }
  }
  const applicable = requirements.length > 0;
  return {
    factor: "counterpartPreference",
    score: applicable ? matched.length / requirements.length : 1,
    weight: FACTOR_WEIGHTS.counterpartPreference,
    applicable,
    matched: [...new Set(matched)].sort(),
    missing: [...new Set(missing)].sort(),
    explanation: applicable ? `Counterpart preference: ${matched.length} of ${requirements.length} preferences matched.` : "Counterpart preference: no preference supplied; excluded from the total."
  };
}
function scoreProfileFit(profile, target) {
  if (!isProfileFitSnapshot(profile)) {
    throw new TypeError("Invalid ProfileFitSnapshot: exact non-PII schema required");
  }
  const hasSnapshotKind = isRecord(target) && target.kind === PROFILE_FIT_SNAPSHOT_KIND;
  if (hasSnapshotKind && !isProfileFitSnapshot(target)) {
    throw new TypeError("Invalid target ProfileFitSnapshot: exact non-PII schema required");
  }
  const targetProfile = isProfileFitSnapshot(target) ? target : null;
  const criteria = targetProfile ? profileCriteria(targetProfile) : opportunityCriteria(target);
  const counterpartTraits = targetProfile ? profileTraits(targetProfile) : criteria;
  const factors = [
    coverage("capabilities", profile.capabilities, criteria.capabilities, "Capabilities"),
    coverage("services", profile.services, criteria.services, "Services"),
    coverage("sectors", profile.sectors, criteria.sectors, "Sectors"),
    coverage(
      "geography",
      geographyValues(profile.geography),
      geographyValues(criteria.geography),
      "Geography"
    ),
    coverage("workMode", profile.workModes, criteria.workModes, "Work mode"),
    availabilityFactor(profile.availability, criteria.availability),
    coverage(
      "verifiedCredentials",
      profile.verifiedCredentials,
      criteria.verifiedCredentials,
      "Verified credentials"
    ),
    preferenceFactor(profile.counterpartPreference, counterpartTraits)
  ];
  const applicable = factors.filter((factor) => factor.applicable);
  const denominator = applicable.reduce((sum, factor) => sum + factor.weight, 0);
  const rawScore = denominator === 0 ? 0 : applicable.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / denominator;
  const score = Math.max(0, Math.min(1, Math.round(rawScore * 1e3) / 1e3));
  return {
    score,
    targetType: targetProfile ? "profile" : "opportunity",
    factors
  };
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
  const normalized2 = value.toLowerCase().replace(/-/g, "_");
  return MATCH_TOPOLOGY_SUBMODEL_ALIASES.has(normalized2);
}
function normalizeSubModelType(raw, hints) {
  if (!raw) return void 0;
  const normalized2 = raw.toLowerCase().replace(/-/g, "_").trim();
  if (isMatchTopologyValue(normalized2)) {
    return void 0;
  }
  if (LEGACY_SUB_MODEL_ALIASES[normalized2]) {
    return LEGACY_SUB_MODEL_ALIASES[normalized2];
  }
  if (normalized2 === "joint_venture") {
    if (hints?.modelType === "strategic_partnership") return "strategic_jv";
    return "project_jv";
  }
  return normalized2;
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
  const scope = roleDef.scope?.trim() ?? "";
  if (!scope) return [];
  const stop = /* @__PURE__ */ new Set([
    "and",
    "the",
    "for",
    "with",
    "from",
    "into",
    "across",
    "including"
  ]);
  return scope.split(/[,;|]/).map((phrase) => phrase.trim()).filter((phrase) => {
    const words = phrase.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 3) return false;
    return words.every((word) => !stop.has(word.toLowerCase()));
  }).filter((value, index, array) => array.indexOf(value) === index).slice(0, 10);
}
function buildRoleSkillHints(roleDef) {
  const fromPhrases = buildRoleServices(roleDef);
  const scope = roleDef.scope?.trim() ?? "";
  if (!scope) return fromPhrases;
  const techTokens = scope.split(/[\s,/|&+;-]+/).map((word) => word.trim()).filter((word) => {
    if (word.length < 2) return false;
    return /^[A-Z]{2,}[0-9]*$/.test(word) || /^[A-Z][a-zA-Z0-9+]{2,}$/.test(word);
  });
  return [...fromPhrases, ...techTokens].filter((value, index, array) => array.indexOf(value) === index).slice(0, 10);
}
function buildSyntheticNeedForRole(leadNeed, leadNorm, roleDef) {
  const role = roleDef.role;
  const skillHints = buildRoleSkillHints(roleDef);
  return {
    ...leadNeed,
    id: `${leadNeed.id ?? "need"}-role-${role.replace(/\s/g, "_")}`,
    attributes: { ...leadNeed.attributes ?? {}, targetRole: role },
    scope: {
      ...leadNeed.scope ?? {},
      requiredSkills: skillHints,
      coreSkills: []
    },
    normalized: {
      ...leadNorm,
      role,
      // Role slots must not inherit the lead Need's mandatory coreSkills
      // (e.g. BIM/Revit on an Architect+Structural consortium lead).
      coreSkills: [],
      // Do not hard-gate on tokenized scope prose; role compatibility + scoring suffice.
      requiredServices: [],
      skills: skillHints.length > 0 ? skillHints : [role]
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
function averageFactor(a, b) {
  return Math.round((a + b) / 2 * 1e3) / 1e3;
}
function averageScoreBreakdown(a, b) {
  return {
    skillMatch: averageFactor(a.skillMatch, b.skillMatch),
    attributeOverlap: averageFactor(a.attributeOverlap, b.attributeOverlap),
    serviceOverlapPct: averageFactor(a.serviceOverlapPct, b.serviceOverlapPct),
    exchangeCompatibility: averageFactor(
      a.exchangeCompatibility,
      b.exchangeCompatibility
    ),
    valueCompatibility: averageFactor(a.valueCompatibility, b.valueCompatibility),
    budgetFit: averageFactor(a.budgetFit, b.budgetFit),
    timelineFit: averageFactor(a.timelineFit, b.timelineFit),
    locationFit: averageFactor(a.locationFit, b.locationFit),
    reputation: averageFactor(a.reputation, b.reputation)
  };
}
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
      const scoredAtoB = scorePair(needB, offerA, resolvedConfig, normNeedB, normOfferA);
      const scoredBtoA = scorePair(needA, offerB, resolvedConfig, normNeedA, normOfferB);
      if (scoredAtoB.score < threshold || scoredBtoA.score < threshold) continue;
      const pairScore = (scoredAtoB.score + scoredBtoA.score) / 2;
      const equivalence = barterValueEquivalence(
        barterSidePost(needA, offerA),
        barterSidePost(needB, offerB)
      );
      matches.push({
        matchScore: pairScore,
        breakdown: {
          ...averageScoreBreakdown(scoredAtoB.breakdown, scoredBtoA.breakdown),
          scoreAtoB: scoredAtoB.score,
          scoreBtoA: scoredBtoA.score
        },
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
function hasServiceSignal(normalized2) {
  return (normalized2.requiredServices?.length ?? 0) > 0 || (normalized2.offeredServices?.length ?? 0) > 0 || (normalized2.skills?.length ?? 0) > 0 || (normalized2.coreSkills?.length ?? 0) > 0;
}
function isSparseNormalized(normalized2) {
  if (!normalized2) return true;
  if (!normalized2.role) return true;
  return !hasServiceSignal(normalized2);
}
function normalizePost(post, canonical, config) {
  if (post.normalized && !isSparseNormalized(post.normalized)) {
    return post;
  }
  const extracted = extractAndNormalize(
    { ...post, normalized: void 0 },
    canonical,
    { config }
  );
  const existing = post.normalized;
  if (!existing) {
    return { ...post, normalized: extracted };
  }
  return {
    ...post,
    normalized: {
      ...extracted,
      ...existing,
      role: existing.role || extracted.role,
      location: existing.location || extracted.location,
      requiredServices: (existing.requiredServices?.length ? existing.requiredServices : extracted.requiredServices) ?? [],
      offeredServices: (existing.offeredServices?.length ? existing.offeredServices : extracted.offeredServices) ?? [],
      skills: (existing.skills?.length ? existing.skills : extracted.skills) ?? [],
      coreSkills: (existing.coreSkills?.length ? existing.coreSkills : extracted.coreSkills) ?? [],
      modelType: existing.modelType ?? extracted.modelType,
      subModelType: existing.subModelType ?? extracted.subModelType,
      categories: (existing.categories?.length ? existing.categories : extracted.categories) ?? [],
      budget: existing.budget ?? extracted.budget,
      timeline: existing.timeline ?? extracted.timeline,
      deadline: existing.deadline ?? extracted.deadline,
      availability: existing.availability ?? extracted.availability,
      reputation: existing.reputation ?? extracted.reputation,
      intent: existing.intent ?? extracted.intent
    }
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
  PROFILE_FIT_SNAPSHOT_KIND,
  ROLE_ALIASES,
  ROLE_COMPATIBILITY,
  attributeOverlap,
  averageScoreBreakdown,
  barterSidePost,
  barterValueEquivalence,
  budgetCompatible,
  budgetFit,
  buildCircularLinkScores,
  buildRoleServices,
  buildRoleSkillHints,
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
  isProfileFitSnapshot,
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
  scoreProfileFit,
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
