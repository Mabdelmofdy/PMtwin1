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

function _normScopeId(value) {
    return value != null && String(value).trim() ? String(value).trim() : '';
}

function _collectOpportunityScopeIds(scope = {}) {
    const ids = new Set();
    const primary = _normScopeId(scope.opportunityId);
    if (primary) ids.add(primary);
    (Array.isArray(scope.opportunityIds) ? scope.opportunityIds : []).forEach(id => {
        const v = _normScopeId(id);
        if (v) ids.add(v);
    });
    return ids;
}

/**
 * Whether an audit log belongs to a deal and/or linked opportunity scope.
 * @param {object} log
 * @param {{
 *   dealId?: string,
 *   opportunityId?: string,
 *   opportunityIds?: string[],
 *   matchId?: string,
 *   contractId?: string,
 *   applicationId?: string,
 *   negotiationId?: string
 * }} scope
 */
export function auditLogMatchesDealOrOpportunity(log, scope = {}) {
    if (!log) return false;
    const dId = _normScopeId(scope.dealId);
    const mId = _normScopeId(scope.matchId);
    const cId = _normScopeId(scope.contractId);
    const aId = _normScopeId(scope.applicationId);
    const nId = _normScopeId(scope.negotiationId);
    const oppIds = _collectOpportunityScopeIds(scope);
    if (!dId && !mId && !cId && !aId && !nId && oppIds.size === 0) return false;

    if (dId && log.entityType === 'deal' && log.entityId === dId) return true;
    if (mId && (log.entityType === 'match' || log.entityType === 'post_match') && log.entityId === mId) {
        return true;
    }
    if (cId && log.entityType === 'contract' && log.entityId === cId) return true;
    if (aId && log.entityType === 'application' && log.entityId === aId) return true;
    if (nId && log.entityType === 'negotiation' && log.entityId === nId) return true;
    for (const oId of oppIds) {
        if (log.entityType === 'opportunity' && log.entityId === oId) return true;
    }

    const d = log.details;
    if (!d || typeof d !== 'object') return false;

    if (dId && d.dealId === dId) return true;
    if (mId && d.matchId === mId) return true;
    if (cId && d.contractId === cId) return true;
    if (aId && d.applicationId === aId) return true;
    if (nId && d.negotiationId === nId) return true;
    for (const oId of oppIds) {
        if (d.opportunityId === oId) return true;
        if (d.sourceOpportunityId === oId) return true;
        if (Array.isArray(d.opportunityIds) && d.opportunityIds.includes(oId)) return true;
    }
    return false;
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
