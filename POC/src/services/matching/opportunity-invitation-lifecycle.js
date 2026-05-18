/**
 * Opportunity invitation terminal transitions (decline / cancel / expire).
 */
import { isActiveInvitation } from './opportunity-invitation-tracking.js';

export const TERMINAL_INVITATION_STATUSES = ['accepted', 'declined', 'cancelled', 'expired'];

export function isTerminalInvitationStatus(status) {
    return TERMINAL_INVITATION_STATUSES.includes((status || '').toLowerCase());
}

/**
 * @param {object} inv
 * @param {number} [nowMs]
 */
/**
 * @param {string} createdAt ISO timestamp
 * @param {number} [expiryDays]
 * @returns {string} ISO expiresAt
 */
export function computeDefaultInvitationExpiresAt(createdAt, expiryDays) {
    const days = typeof expiryDays === 'number' && expiryDays > 0 ? expiryDays : 14;
    const base = createdAt ? new Date(createdAt) : new Date();
    const ms = base.getTime();
    if (Number.isNaN(ms)) {
        return new Date(Date.now() + days * 86400000).toISOString();
    }
    return new Date(ms + days * 86400000).toISOString();
}

export function shouldExpireInvitation(inv, nowMs = Date.now()) {
    if (!inv || isTerminalInvitationStatus(inv.status)) return false;
    if (!isActiveInvitation(inv)) return false;
    if (!inv.expiresAt) return false;
    const t = new Date(inv.expiresAt).getTime();
    return !Number.isNaN(t) && t <= nowMs;
}

if (typeof window !== 'undefined') {
    window.opportunityInvitationLifecycle = {
        TERMINAL_INVITATION_STATUSES,
        isTerminalInvitationStatus,
        shouldExpireInvitation,
        computeDefaultInvitationExpiresAt
    };
}
