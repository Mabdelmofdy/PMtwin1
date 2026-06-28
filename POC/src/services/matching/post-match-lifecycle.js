/**
 * PostMatch aggregate lifecycle (ADR-002) — uses @pm-twin/lifecycle match entity.
 * Do not use getFsm('post_match') or enforceTransition('post_match') here.
 */
import {
    allowedTransitions,
    isTerminal,
    toCanonical,
} from '../../../vendor/@pm-twin/lifecycle/index.js';

export const MATCH_ENTITY_TYPE = 'match';

const ONE_WAY_QUORUM_ROLES = ['need_owner', 'offer_provider'];

export function canonicalMatchStatus(status) {
    return toCanonical(MATCH_ENTITY_TYPE, status ?? '') ?? '';
}

export function isBlockingDiscoverDuplicateStatus(status) {
    const canonical = canonicalMatchStatus(status);
    return canonical === 'discovered' || canonical === 'accepted';
}

export function resolveNeedOpportunityId(postMatch) {
    if (!postMatch) return undefined;
    return postMatch.needOpportunityId || postMatch.payload?.needOpportunityId;
}

export function resolveOfferOpportunityId(postMatch) {
    if (!postMatch) return undefined;
    return postMatch.offerOpportunityId || postMatch.payload?.offerOpportunityId;
}

/**
 * Read-path alias: legacy stored `pending` is exposed as canonical `discovered`.
 * localStorage bulk migration can be deferred while this normalizer is in place.
 */
export function normalizePostMatchForRead(postMatch) {
    if (!postMatch) return postMatch;
    const canonical = canonicalMatchStatus(postMatch.status);
    if (!canonical || canonical === postMatch.status) return postMatch;
    return { ...postMatch, status: canonical };
}

export function isExpirableMatchStatus(status) {
    const canonical = canonicalMatchStatus(status);
    return canonical === 'discovered' || canonical === 'accepted';
}

export function isTerminalMatchStatus(status) {
    return isTerminal(MATCH_ENTITY_TYPE, status);
}

export function assertAllowedMatchTransition(fromStatus, toStatus) {
    const from = canonicalMatchStatus(fromStatus);
    const to = toCanonical(MATCH_ENTITY_TYPE, toStatus);
    if (!to) {
        throw new Error(`Unknown match status "${toStatus}"`);
    }
    if (from === to) return;
    if (isTerminal(MATCH_ENTITY_TYPE, fromStatus)) {
        throw new Error(`Match is in terminal state "${from}" and cannot transition`);
    }
    const allowed = allowedTransitions(MATCH_ENTITY_TYPE, fromStatus);
    if (!allowed.includes(to)) {
        throw new Error(`Transition ${from} → ${to} is not allowed`);
    }
}

function isParticipantStatus(participant, status) {
    return (participant?.participantStatus || '').toLowerCase() === status.toLowerCase();
}

function hasAcceptedParticipant(participants) {
    return (participants || []).some((p) => isParticipantStatus(p, 'accepted'));
}

function hasDeclinedParticipant(participants) {
    return (participants || []).some((p) => isParticipantStatus(p, 'declined'));
}

function isOneWayQuorumMet(participants) {
    return ONE_WAY_QUORUM_ROLES.every((role) =>
        (participants || []).some(
            (p) => p.role === role && isParticipantStatus(p, 'accepted'),
        ),
    );
}

function allParticipantsAccepted(participants) {
    const list = participants || [];
    return list.length > 0 && list.every((p) => isParticipantStatus(p, 'accepted'));
}

/**
 * Resolve aggregate status after a participant accepts.
 * discovered → accepted (first accept) → confirmed (all required participants accepted).
 */
export function resolveAggregateStatusAfterAccept(postMatch, participants) {
    if (hasDeclinedParticipant(participants)) {
        return typeof CONFIG !== 'undefined' ? CONFIG.POST_MATCH_STATUS.DECLINED : 'declined';
    }

    const matchType = (postMatch?.matchType || 'one_way').toLowerCase();
    if (matchType === 'one_way' && isOneWayQuorumMet(participants)) {
        return typeof CONFIG !== 'undefined' ? CONFIG.POST_MATCH_STATUS.CONFIRMED : 'confirmed';
    }

    if (allParticipantsAccepted(participants)) {
        return typeof CONFIG !== 'undefined' ? CONFIG.POST_MATCH_STATUS.CONFIRMED : 'confirmed';
    }

    if (hasAcceptedParticipant(participants) && canonicalMatchStatus(postMatch?.status) === 'discovered') {
        return typeof CONFIG !== 'undefined' ? CONFIG.POST_MATCH_STATUS.ACCEPTED : 'accepted';
    }

    return undefined;
}
