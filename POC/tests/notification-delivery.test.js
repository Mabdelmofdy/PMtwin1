import { describe, expect, it } from 'vitest';
import {
    getNotificationPrefs,
    shouldDeliverEmail,
    isNegotiationEventType,
    appendDeliveryLog
} from '../src/services/notifications/notification-delivery.js';

describe('notification-delivery', () => {
    it('detects negotiation event types', () => {
        expect(isNegotiationEventType('negotiation_dispute_raised')).toBe(true);
        expect(isNegotiationEventType('dispute_resolved')).toBe(true);
        expect(isNegotiationEventType('match_found')).toBe(false);
    });

    it('shouldDeliverEmail respects channel and event prefs', () => {
        const prefs = {
            channels: { email: true },
            events: { negotiations: true }
        };
        expect(shouldDeliverEmail(prefs, 'dispute_resolved')).toBe(true);
        expect(shouldDeliverEmail({ channels: { email: false }, events: { negotiations: true } }, 'dispute_resolved')).toBe(false);
        expect(shouldDeliverEmail({ channels: { email: true }, events: { negotiations: false } }, 'dispute_resolved')).toBe(false);
    });

    it('appendDeliveryLog stores entries', () => {
        const storage = {
            data: {},
            get(k) { return this.data[k] || []; },
            set(k, v) { this.data[k] = v; }
        };
        appendDeliveryLog(storage, 'log', { id: '1', channel: 'email' });
        expect(storage.get('log')).toHaveLength(1);
    });

    it('getNotificationPrefs reads nested settings', () => {
        const storage = {
            get() {
                return { notifications: { channels: { email: true }, events: { negotiations: true } } };
            }
        };
        const prefs = getNotificationPrefs(storage, 'settings');
        expect(prefs.channels.email).toBe(true);
        expect(prefs.events.negotiations).toBe(true);
    });
});
