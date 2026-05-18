/**
 * Deal lifecycle helpers (Phase 7) — source validation and friendly labels.
 */

const DEAL_SOURCE = {
    MATCH: 'match',
    APPLICATION: 'application',
    NEGOTIATION: 'negotiation'
};

function getDealSourceType(deal) {
    if (!deal) return null;
    if (deal.negotiationId) return DEAL_SOURCE.NEGOTIATION;
    if (deal.applicationId) return DEAL_SOURCE.APPLICATION;
    if (deal.matchId) return DEAL_SOURCE.MATCH;
    return null;
}

function getDealSourceLabel(deal) {
    const t = getDealSourceType(deal);
    if (t === DEAL_SOURCE.MATCH) return 'From Match';
    if (t === DEAL_SOURCE.APPLICATION) return 'From Application';
    if (t === DEAL_SOURCE.NEGOTIATION) return 'From Negotiation';
    return 'Deal Workspace';
}

function canCreateDealFromMatch(postMatch, requiredStatus) {
    if (!postMatch || !postMatch.id) return false;
    return (postMatch.status || '') === (requiredStatus || 'confirmed');
}

function canCreateDealFromApplication(application) {
    if (!application || !application.id) return false;
    return (application.status || '').toLowerCase() === 'accepted';
}

function canCreateDealFromNegotiation(negotiation) {
    if (!negotiation || !negotiation.id) return false;
    return (negotiation.status || '').toLowerCase() === 'agreed';
}

export {
    DEAL_SOURCE,
    getDealSourceType,
    getDealSourceLabel,
    canCreateDealFromMatch,
    canCreateDealFromApplication,
    canCreateDealFromNegotiation
};

if (typeof window !== 'undefined') {
    window.dealLifecycle = {
        DEAL_SOURCE,
        getDealSourceType,
        getDealSourceLabel,
        canCreateDealFromMatch,
        canCreateDealFromApplication,
        canCreateDealFromNegotiation
    };
}
