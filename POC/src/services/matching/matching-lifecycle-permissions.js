/**
 * Phase 9 — lifecycle permission helpers and audit/notification utilities.
 * Domain guards (owner/participant) plus admin capability checks via injectable hasCap.
 */

export const PERMISSION_ERRORS = {
    DENIED: 'You do not have permission to perform this action.',
    READ_ONLY_AUDITOR: 'This action is read-only for auditor accounts.',
    ALREADY_COMPLETED: 'Already completed.',
    NO_CHANGES: 'No changes were made.'
};

export const ADMIN_MATCHING_PERSIST = 'admin.matching.persist';
export const ADMIN_MATCHING_READ = 'admin.matching.read';
export const ADMIN_MATCHING_RESOLVE_BLOCKED = 'admin.matching.resolve_blocked';

function defaultHasCap(role, capability) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.hasAdminCapability === 'function') {
        return globalThis.hasAdminCapability(role, capability);
    }
    if (typeof window !== 'undefined' && typeof window.hasAdminCapability === 'function') {
        return window.hasAdminCapability(role, capability);
    }
    return role === 'admin';
}

export function isAuditorRole(role) {
    return role === 'auditor';
}

export function isReadOnlyAdminRole(role) {
    return isAuditorRole(role);
}

export function assertNotReadOnlyAdmin(role) {
    if (isReadOnlyAdminRole(role)) {
        throw new Error(PERMISSION_ERRORS.READ_ONLY_AUDITOR);
    }
}

export function assertAdminMatchingPersist(role, hasCap = defaultHasCap) {
    if (!hasCap(role, ADMIN_MATCHING_PERSIST)) {
        throw new Error(PERMISSION_ERRORS.DENIED);
    }
}

export function assertAdminMatchingRead(role, hasCap = defaultHasCap) {
    if (!hasCap(role, ADMIN_MATCHING_READ)) {
        throw new Error(PERMISSION_ERRORS.DENIED);
    }
}

export function assertReplacementOwnerOrAdmin(isOwner, actorRole, hasCap = defaultHasCap) {
    if (isOwner) return;
    if (hasCap(actorRole, ADMIN_MATCHING_RESOLVE_BLOCKED)) return;
    if (hasCap(actorRole, ADMIN_MATCHING_PERSIST)) return;
    throw new Error(PERMISSION_ERRORS.DENIED);
}

export function assertMatchParticipant(postMatch, actorUserId) {
    if (!actorUserId) {
        throw new Error(PERMISSION_ERRORS.DENIED);
    }
    const participants = postMatch?.participants || [];
    if (!participants.some(p => p.userId === actorUserId)) {
        throw new Error(PERMISSION_ERRORS.DENIED);
    }
}

export function assertMatchOwner(isOwner) {
    if (!isOwner) {
        throw new Error(PERMISSION_ERRORS.DENIED);
    }
}

export function assertNegotiationPartyOrOwner(negotiation, actorUserId, isOpportunityOwner) {
    if (!actorUserId) throw new Error(PERMISSION_ERRORS.DENIED);
    const parties = negotiation?.parties || [];
    if (parties.some(p => p.userId === actorUserId)) return;
    if (isOpportunityOwner) return;
    throw new Error(PERMISSION_ERRORS.DENIED);
}

export function buildLifecycleAuditDetails(details = {}, ctx = {}) {
    const merged = { ...(details && typeof details === 'object' ? details : {}) };
    const keys = [
        'actorRole',
        'opportunityId',
        'sourceOpportunityId',
        'matchId',
        'invitationId',
        'negotiationId',
        'replacementRequestId',
        'dealId',
        'contractId',
        'applicationId',
        'previewRunId',
        'matchingRunId'
    ];
    keys.forEach((k) => {
        if (ctx[k] != null && merged[k] == null) merged[k] = ctx[k];
    });
    return merged;
}

export function notificationDedupeKey(type, entityType, entityId) {
    return `${type || ''}:${entityType || ''}:${entityId || ''}`;
}

/**
 * @param {Array} notifications - user's notifications
 * @param {{ type: string, dedupeKey?: string, link?: string }} spec
 */
export function hasRecentDuplicateNotification(notifications, spec) {
    const type = spec.type;
    const dedupeKey = spec.dedupeKey || notificationDedupeKey(type, spec.entityType, spec.entityId);
    const link = spec.link;
    return (notifications || []).some((n) => {
        if ((n.type || '') !== type) return false;
        if (n.dedupeKey && n.dedupeKey === dedupeKey) return true;
        if (link && n.link === link && !n.read) return true;
        return false;
    });
}
