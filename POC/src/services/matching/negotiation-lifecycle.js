/**
 * Negotiation lifecycle helpers (Phase 5) — friendly labels and status rules.
 */

const ACTIVE_NEGOTIATION_STATUSES = ['open', 'counter_offered'];
const TERMINAL_NEGOTIATION_STATUSES = ['agreed', 'failed', 'expired', 'cancelled'];

function isActiveNegotiation(negotiation) {
    return negotiation && ACTIVE_NEGOTIATION_STATUSES.includes((negotiation.status || '').toLowerCase());
}

function isTerminalNegotiation(negotiation) {
    return negotiation && TERMINAL_NEGOTIATION_STATUSES.includes((negotiation.status || '').toLowerCase());
}

function getNegotiationStatusLabel(status) {
    const s = (status || '').toLowerCase();
    if (s === 'open') return 'Negotiation Open';
    if (s === 'counter_offered') return 'Negotiation Open';
    if (s === 'agreed') return 'Terms Agreed';
    if (s === 'cancelled') return 'Negotiation Cancelled';
    if (s === 'failed') return 'Negotiation Ended';
    if (s === 'expired') return 'Negotiation Expired';
    return 'Negotiation';
}

function canAddNegotiationRound(negotiation) {
    return isActiveNegotiation(negotiation);
}

function canAgreeNegotiation(negotiation) {
    return isActiveNegotiation(negotiation);
}

function canCancelNegotiation(negotiation) {
    return isActiveNegotiation(negotiation);
}

/**
 * Participant userIds required before negotiation can reach agreed.
 * Falls back to empty array when parties are unknown (caller treats first agree as full agree).
 */
function getNegotiationRequiredParticipantIds(negotiation) {
    const parties = negotiation?.parties || [];
    const ids = parties.map(p => p.userId).filter(Boolean);
    return [...new Set(ids)];
}

function hasParticipantAgreed(negotiation, userId) {
    if (!userId || !negotiation) return false;
    const agreements = negotiation.participantAgreements || [];
    if (agreements.some(a => a.userId === userId)) return true;
    const legacyAgreedBy = negotiation.agreedBy || negotiation.finalAgreedSnapshot?.agreedBy || [];
    return legacyAgreedBy.some(a => a.userId === userId);
}

function allRequiredParticipantsAgreed(negotiation, participantAgreements) {
    const required = getNegotiationRequiredParticipantIds(negotiation);
    if (!required.length) return true;
    const agreedIds = new Set((participantAgreements || []).map(a => a.userId));
    return required.every(id => agreedIds.has(id));
}

/**
 * Build immutable agreed snapshot when negotiation reaches agreed status.
 *
 * @param {object} params
 * @param {object} params.negotiation
 * @param {object|null} [params.match]
 * @param {object} params.terms
 * @param {string} params.actorUserId
 * @param {string} params.agreedAt
 * @param {Array<{userId: string, agreedAt: string}>} [params.agreedBy]
 * @param {boolean} [params.multiParty]
 */
function buildFinalAgreedSnapshot({
    negotiation,
    match,
    terms = {},
    actorUserId,
    agreedAt,
    agreedBy,
    multiParty
}) {
    const parties = negotiation?.parties || [];
    const participants = parties.map(p => ({
        userId: p.userId,
        role: p.role || 'participant'
    }));
    const opportunityIds = negotiation?.opportunityId
        ? [negotiation.opportunityId]
        : (match?.opportunityIds || []);
    const valueTerms = {
        agreedValue: terms.value != null
            ? { amount: terms.value, currency: terms.currency || 'SAR' }
            : (terms.agreedValue || null),
        paymentSchedule: terms.paymentSchedule || ''
    };
    const timeline = {
        start: terms.startDate || terms.start || null,
        end: terms.endDate || terms.end || null
    };
    const resolvedAgreedBy = agreedBy && agreedBy.length
        ? agreedBy
        : [{ userId: actorUserId, agreedAt }];
    const requiredCount = getNegotiationRequiredParticipantIds(negotiation).length;
    const useMultiParty = multiParty === true
        || (requiredCount > 1 && resolvedAgreedBy.length >= requiredCount);

    return {
        scope: terms.scope || terms.message || negotiation?.initialTerms?.scope || '',
        valueTerms,
        timeline,
        participants,
        opportunityIds,
        matchId: negotiation?.matchId || null,
        matchType: match?.matchType || null,
        applicationId: negotiation?.applicationId || null,
        invitationId: negotiation?.invitationId || match?.invitationId || null,
        negotiationId: negotiation?.id,
        agreedAt,
        agreedBy: resolvedAgreedBy,
        agreementMode: useMultiParty ? 'multi_party' : 'single_party_mvp'
    };
}

export {
    ACTIVE_NEGOTIATION_STATUSES,
    TERMINAL_NEGOTIATION_STATUSES,
    isActiveNegotiation,
    isTerminalNegotiation,
    getNegotiationStatusLabel,
    canAddNegotiationRound,
    canAgreeNegotiation,
    canCancelNegotiation,
    getNegotiationRequiredParticipantIds,
    hasParticipantAgreed,
    allRequiredParticipantsAgreed,
    buildFinalAgreedSnapshot
};

if (typeof window !== 'undefined') {
    window.negotiationLifecycle = {
        ACTIVE_NEGOTIATION_STATUSES,
        TERMINAL_NEGOTIATION_STATUSES,
        isActiveNegotiation,
        isTerminalNegotiation,
        getNegotiationStatusLabel,
        canAddNegotiationRound,
        canAgreeNegotiation,
        canCancelNegotiation,
        getNegotiationRequiredParticipantIds,
        hasParticipantAgreed,
        allRequiredParticipantsAgreed,
        buildFinalAgreedSnapshot
    };
}
