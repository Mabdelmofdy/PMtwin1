/**
 * Deal creation helper. Strict validation; throws on invalid input (no silent failures).
 * Validates postMatch and builds the deal payload (matchType, participants, opportunityIds by match type).
 */

const MSG_POST_MATCH_REQUIRED = "createDealFromMatch: valid postMatch is required.";
const MSG_POST_MATCH_ID_REQUIRED = "createDealFromMatch: postMatch.id is required.";
const MSG_STATUS_NOT_CONFIRMED = "createDealFromMatch: postMatch.status must be confirmed to create a deal.";

function isPlainObject(v) {
    return typeof v === "object" && v !== null && !Array.isArray(v) && Object.prototype.toString.call(v) === "[object Object]";
}

function collectOppIds(payload, matchType) {
    const oppIds = [];
    const p = payload || {};

    if (matchType === "one_way") {
        if (p.needOpportunityId) oppIds.push(p.needOpportunityId);
        if (p.offerOpportunityId) oppIds.push(p.offerOpportunityId);
    } else if (matchType === "two_way") {
        const a = p.sideA || {};
        const b = p.sideB || {};
        if (a.needId) oppIds.push(a.needId);
        if (a.offerId) oppIds.push(a.offerId);
        if (b.needId) oppIds.push(b.needId);
        if (b.offerId) oppIds.push(b.offerId);
    } else if (matchType === "consortium") {
        if (p.leadNeedId) oppIds.push(p.leadNeedId);
        (p.roles || []).forEach((r) => {
            if (r && r.opportunityId) oppIds.push(r.opportunityId);
        });
    } else if (matchType === "circular") {
        (p.links || []).forEach((l) => {
            if (!l) return;
            if (l.offerId) oppIds.push(l.offerId);
            if (l.needId) oppIds.push(l.needId);
        });
    }

    return [...new Set(oppIds.filter(Boolean))];
}

/**
 * Validates postMatch and builds the deal payload. Throws on invalid input or non-confirmed status.
 * @param {object} postMatch - Post match object (must have id, status === requiredStatus)
 * @param {string} requiredStatus - Required postMatch.status (e.g. CONFIG.POST_MATCH_STATUS.CONFIRMED)
 * @returns {object} Deal payload: { matchId, matchType, participants, opportunityIds, primaryOpportunityId, payload, roleSlots }
 * @throws {Error} When postMatch is missing, has no id, or status !== requiredStatus
 */
export function createDealFromMatch(postMatch, requiredStatus = "confirmed") {
    if (postMatch == null) throw new Error(MSG_POST_MATCH_REQUIRED);
    if (!isPlainObject(postMatch)) throw new Error(MSG_POST_MATCH_REQUIRED);
    if (postMatch.id == null) throw new Error(MSG_POST_MATCH_ID_REQUIRED);
    if ((postMatch.status || "") !== requiredStatus) throw new Error(MSG_STATUS_NOT_CONFIRMED);

    const matchId = postMatch.id;
    const matchType = postMatch.matchType || "one_way";
    const allowedTypes = new Set(["one_way", "two_way", "consortium", "circular"]);
    if (!allowedTypes.has(matchType)) {
        throw new Error(`createDealFromMatch: unsupported matchType "${matchType}".`);
    }
    const payload = postMatch.payload || {};
    const rawParticipants = Array.isArray(postMatch.participants) ? postMatch.participants : [];
    const seen = new Set();
    const participants = [];
    for (const p of rawParticipants) {
        if (!p || !p.userId || seen.has(p.userId)) continue;
        seen.add(p.userId);
        participants.push({ userId: p.userId, role: p.role || "participant" });
    }
    if (participants.length === 0) {
        throw new Error("createDealFromMatch: at least one valid participant is required.");
    }

    const opportunityIds = collectOppIds(payload, matchType);
    if (opportunityIds.length === 0) {
        throw new Error("createDealFromMatch: at least one opportunityId is required.");
    }
    const primaryOpportunityId =
        payload.leadNeedId || payload.needOpportunityId || opportunityIds[0] || null;
    const roleSlots =
        matchType === "consortium"
            ? (payload.roles || []).reduce((acc, r) => {
                  if (r && r.userId) acc[r.userId] = r.role || "consortium_member";
                  return acc;
              }, {})
            : null;

    return {
        matchId,
        matchType,
        participants,
        opportunityIds,
        primaryOpportunityId,
        payload: matchType === "consortium" ? payload : null,
        roleSlots: matchType === "consortium" && roleSlots && Object.keys(roleSlots).length ? roleSlots : null
    };
}
