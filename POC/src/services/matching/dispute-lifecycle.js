/**
 * Negotiation dispute lifecycle helpers (Phase 3).
 */

const DISPUTE_CATEGORIES = {
    VALUE_MISMATCH: 'value_mismatch',
    SCOPE_DISAGREEMENT: 'scope_disagreement',
    PAYMENT_TERMS: 'payment_terms',
    BAD_FAITH: 'bad_faith',
    OTHER: 'other'
};

const DISPUTE_STATUS = {
    RAISED: 'raised',
    UNDER_REVIEW: 'under_review',
    MEDIATION: 'mediation',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated',
    WITHDRAWN: 'withdrawn'
};

const ACTIVE_DISPUTE_STATUSES = [
    DISPUTE_STATUS.RAISED,
    DISPUTE_STATUS.UNDER_REVIEW,
    DISPUTE_STATUS.MEDIATION
];

const TERMINAL_DISPUTE_STATUSES = [
    DISPUTE_STATUS.RESOLVED,
    DISPUTE_STATUS.ESCALATED,
    DISPUTE_STATUS.WITHDRAWN
];

const RESOLUTION_OUTCOMES = {
    AMEND_TERMS: 'amend_terms',
    FORCE_CLOSE: 'force_close',
    EXTEND_DEADLINE: 'extend_deadline',
    DISMISS: 'dismiss',
    ESCALATE_EXTERNAL: 'escalate_external'
};

function isActiveDispute(dispute) {
    return dispute && ACTIVE_DISPUTE_STATUSES.includes((dispute.status || '').toLowerCase());
}

function isTerminalDispute(dispute) {
    return dispute && TERMINAL_DISPUTE_STATUSES.includes((dispute.status || '').toLowerCase());
}

function getDisputeStatusLabel(status) {
    const s = (status || '').toLowerCase();
    if (s === 'raised') return 'Dispute raised';
    if (s === 'under_review') return 'Under admin review';
    if (s === 'mediation') return 'In mediation';
    if (s === 'resolved') return 'Resolved';
    if (s === 'escalated') return 'Escalated externally';
    if (s === 'withdrawn') return 'Withdrawn';
    return 'Dispute';
}

function getDisputeCategoryLabel(category) {
    const c = (category || '').toLowerCase();
    if (c === 'value_mismatch') return 'Value mismatch';
    if (c === 'scope_disagreement') return 'Scope disagreement';
    if (c === 'payment_terms') return 'Payment terms';
    if (c === 'bad_faith') return 'Bad faith';
    if (c === 'other') return 'Other';
    return category || '—';
}

/** Formal negotiation actions frozen while dispute is active. */
function negotiationFormalActionsFrozen(dispute) {
    return isActiveDispute(dispute);
}

function getResolutionOutcomeLabel(outcome) {
    const o = (outcome || '').toLowerCase();
    if (o === 'amend_terms') return 'Terms amended';
    if (o === 'force_close') return 'Negotiation closed';
    if (o === 'extend_deadline') return 'Deadline extended';
    if (o === 'dismiss') return 'Dismissed';
    if (o === 'escalate_external') return 'Escalated externally';
    return outcome || '—';
}

export {
    DISPUTE_CATEGORIES,
    DISPUTE_STATUS,
    ACTIVE_DISPUTE_STATUSES,
    TERMINAL_DISPUTE_STATUSES,
    RESOLUTION_OUTCOMES,
    isActiveDispute,
    isTerminalDispute,
    getDisputeStatusLabel,
    getDisputeCategoryLabel,
    negotiationFormalActionsFrozen,
    getResolutionOutcomeLabel
};

if (typeof window !== 'undefined') {
    window.disputeLifecycle = {
        DISPUTE_CATEGORIES,
        DISPUTE_STATUS,
        ACTIVE_DISPUTE_STATUSES,
        TERMINAL_DISPUTE_STATUSES,
        RESOLUTION_OUTCOMES,
        isActiveDispute,
        isTerminalDispute,
        getDisputeStatusLabel,
        getDisputeCategoryLabel,
        negotiationFormalActionsFrozen,
        getResolutionOutcomeLabel
    };
}
