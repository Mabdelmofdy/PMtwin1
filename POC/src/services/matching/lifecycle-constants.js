/**
 * Canonical lifecycle notification/audit names with backward-compatible aliases.
 * Do not mass-migrate stored records; use normalize* at write/display boundaries.
 */

/** @type {Record<string, string>} legacy notification type → canonical */
export const NOTIFICATION_TYPE_ALIASES = {
    match_found: 'new_match_found',
    opportunity_match: 'new_match_found',
    candidate_match: 'new_match_found',
    match: 'new_match_found',
    negotiation_counter_offer: 'negotiation_countered'
};

/** @type {Record<string, string>} legacy audit action → canonical */
export const AUDIT_ACTION_ALIASES = {
    negotiation_counter_offer: 'negotiation_countered'
};

export function normalizeNotificationType(type) {
    const t = type || '';
    return NOTIFICATION_TYPE_ALIASES[t] || t;
}

export function normalizeAuditAction(action) {
    const a = action || '';
    return AUDIT_ACTION_ALIASES[a] || a;
}

if (typeof window !== 'undefined') {
    window.lifecycleConstants = {
        NOTIFICATION_TYPE_ALIASES,
        AUDIT_ACTION_ALIASES,
        normalizeNotificationType,
        normalizeAuditAction
    };
}
