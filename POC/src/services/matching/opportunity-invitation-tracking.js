/**
 * Pure helpers for opportunity invitation → application linking (Phase 4).
 */

const ACTIVE_INVITATION_STATUSES = ['sent', 'invitation_sent'];

function safeTime(iso) {
    const t = iso ? new Date(iso).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
}

function invitationMatchesApplicant(inv, { userId, companyId }) {
    if (!inv) return false;
    if (userId && inv.invitedUserId === userId) return true;
    if (companyId && inv.invitedCompanyId === companyId) return true;
    if (userId && inv.invitedCompanyId === userId) return true;
    return false;
}

function isActiveInvitation(inv) {
    return inv && ACTIVE_INVITATION_STATUSES.includes((inv.status || '').toLowerCase());
}

/**
 * Pick the best active invitation when multiple match the applicant.
 * @param {object[]} invitations
 * @param {{ opportunityId?: string, userId?: string, companyId?: string, matchId?: string, isReplacementApplication?: boolean }} options
 */
function pickActiveInvitation(invitations, options = {}) {
    const { opportunityId, userId, companyId, matchId, isReplacementApplication } = options;
    let pool = (invitations || []).filter(isActiveInvitation);
    if (opportunityId) {
        pool = pool.filter(inv => inv.opportunityId === opportunityId);
    }
    pool = pool.filter(inv => invitationMatchesApplicant(inv, { userId, companyId }));
    if (!pool.length) return null;

    if (matchId) {
        const exact = pool.filter(inv => inv.matchId === matchId);
        if (exact.length) pool = exact;
    }

    pool.sort((a, b) => {
        const kindA = (a.invitationKind || 'apply') === 'replacement' ? 1 : 0;
        const kindB = (b.invitationKind || 'apply') === 'replacement' ? 1 : 0;
        if (!isReplacementApplication && kindA !== kindB) return kindA - kindB;
        if (isReplacementApplication && kindA !== kindB) return kindB - kindA;
        return safeTime(b.createdAt) - safeTime(a.createdAt);
    });

    return pool[0];
}

function getInvitationLifecycleLabel(inv, context = {}) {
    if (!inv) return '';
    const status = (inv.status || '').toLowerCase();
    if (context.dealId) return 'View Deal';
    if (context.applicationId || inv.applicationId) return 'Application Submitted';
    if (status === 'sent' || status === 'invitation_sent') return 'Invitation Sent';
    if (status === 'accepted') return 'Application Submitted';
    if (status === 'declined') return 'Invitation Declined';
    if (status === 'cancelled') return 'Invitation Cancelled';
    if (status === 'expired') return 'Invitation Expired';
    return 'Invitation';
}

export {
    ACTIVE_INVITATION_STATUSES,
    pickActiveInvitation,
    getInvitationLifecycleLabel,
    invitationMatchesApplicant,
    isActiveInvitation
};

if (typeof window !== 'undefined') {
    window.opportunityInvitationTracking = {
        ACTIVE_INVITATION_STATUSES,
        pickActiveInvitation,
        getInvitationLifecycleLabel,
        invitationMatchesApplicant,
        isActiveInvitation
    };
}
