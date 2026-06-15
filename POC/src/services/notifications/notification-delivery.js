/**
 * Notification delivery helpers — in-app + simulated email log (Phase 5 POC).
 */

const NEGOTIATION_EVENT_TYPES = new Set([
    'negotiation_dispute_raised',
    'dispute_resolved',
    'dispute_withdrawn',
    'dispute_assigned',
    'negotiation_proposal',
    'negotiation_agreed',
    'negotiation_cancelled'
]);

function getStoredSettings(storage, settingsKey) {
    if (!storage || !settingsKey) return {};
    try {
        return storage.get(settingsKey) || {};
    } catch (e) {
        void e;
        return {};
    }
}

function getNotificationPrefs(storage, settingsKey) {
    const settings = getStoredSettings(storage, settingsKey);
    const n = settings.notifications || {};
    return {
        channels: {
            inApp: n.channels?.inApp !== false,
            email: n.channels?.email === true,
            sms: n.channels?.sms === true
        },
        events: {
            matches: n.events?.matches !== false,
            deals: n.events?.deals !== false,
            contracts: n.events?.contracts !== false,
            negotiations: n.events?.negotiations !== false,
            system: n.events?.system !== false,
            marketing: n.events?.marketing === true
        },
        digest: n.digest || 'instant'
    };
}

function isNegotiationEventType(type) {
    return NEGOTIATION_EVENT_TYPES.has(type);
}

function shouldDeliverEmail(prefs, type) {
    if (!prefs?.channels?.email) return false;
    if (isNegotiationEventType(type)) {
        return prefs.events?.negotiations !== false;
    }
    if (type === 'system' || (type || '').startsWith('admin_')) {
        return prefs.events?.system !== false;
    }
    return prefs.events?.system !== false;
}

function appendDeliveryLog(storage, logKey, entry) {
    if (!storage || !logKey) return entry;
    const list = storage.get(logKey) || [];
    list.push(entry);
    storage.set(logKey, list);
    return entry;
}

export {
    getNotificationPrefs,
    shouldDeliverEmail,
    isNegotiationEventType,
    appendDeliveryLog,
    NEGOTIATION_EVENT_TYPES
};

if (typeof window !== 'undefined') {
    window.notificationDelivery = {
        getNotificationPrefs,
        shouldDeliverEmail,
        isNegotiationEventType,
        appendDeliveryLog,
        NEGOTIATION_EVENT_TYPES
    };
}
