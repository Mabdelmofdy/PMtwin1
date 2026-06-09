/**
 * Lightweight cross-page event bus for local data mutations.
 * Pages subscribe via window.addEventListener; data-service emits after writes.
 */

export const PMTWIN_EVENTS = {
    NOTIFICATIONS_UPDATED: 'pmtwin:notifications-updated',
    MESSAGES_UPDATED: 'pmtwin:messages-updated',
    POST_MATCHES_UPDATED: 'pmtwin:post-matches-updated',
    DEALS_UPDATED: 'pmtwin:deals-updated',
    CONTRACTS_UPDATED: 'pmtwin:contracts-updated',
    DATA_CHANGED: 'pmtwin:data-changed'
};

export function emitPmtwinEvent(name, detail = {}) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (e) {
        void e;
    }
}

export function emitDataChange(sourceEvent, detail = {}) {
    emitPmtwinEvent(sourceEvent, detail);
    emitPmtwinEvent(PMTWIN_EVENTS.DATA_CHANGED, { ...detail, sourceEvent });
}

if (typeof window !== 'undefined') {
    window.PMTWIN_EVENTS = PMTWIN_EVENTS;
    window.emitPmtwinEvent = emitPmtwinEvent;
}
