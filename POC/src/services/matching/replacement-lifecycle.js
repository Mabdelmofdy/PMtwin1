/**
 * Replacement lifecycle helpers (Phase 6) — consortium & circular matches.
 */

function isReplacementEligibleMatchType(matchType) {
    return matchType === 'consortium' || matchType === 'circular';
}

function buildReplacementSlotKey(blockedParticipantId, roleToFill, blockedOpportunityId) {
    return [blockedParticipantId || '', roleToFill || '', blockedOpportunityId || ''].join('::');
}

function getReplacementRequestStatusLabel(status) {
    const s = (status || '').toLowerCase();
    if (s === 'pending_owner_review') return 'Replacement Suggested';
    if (s === 'pending_invitation') return 'Replacement Invited';
    if (s === 'invitation_sent') return 'Replacement Invited';
    if (s === 'replacement_accepted') return 'Replacement Accepted';
    if (s === 'rejected') return 'Suggestion Rejected';
    if (s === 'cancelled') return 'Cancelled';
    if (s === 'completed') return 'Replaced';
    if (s === 'superseded') return 'Superseded';
    return 'Replacement';
}

function invitationAcceptsActor(invitation, userId, companyId) {
    if (!invitation) return false;
    if (userId && invitation.invitedUserId === userId) return true;
    if (userId && invitation.invitedCompanyId === userId) return true;
    if (companyId && invitation.invitedCompanyId === companyId) return true;
    return false;
}

export {
    isReplacementEligibleMatchType,
    buildReplacementSlotKey,
    getReplacementRequestStatusLabel,
    invitationAcceptsActor
};

if (typeof window !== 'undefined') {
    window.replacementLifecycle = {
        isReplacementEligibleMatchType,
        buildReplacementSlotKey,
        getReplacementRequestStatusLabel,
        invitationAcceptsActor
    };
}
