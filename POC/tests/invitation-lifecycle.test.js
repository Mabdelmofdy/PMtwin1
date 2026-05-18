import { describe, expect, it } from 'vitest';
import {
    isTerminalInvitationStatus,
    shouldExpireInvitation,
    computeDefaultInvitationExpiresAt,
    TERMINAL_INVITATION_STATUSES
} from '../src/services/matching/opportunity-invitation-lifecycle.js';
import { isActiveInvitation } from '../src/services/matching/opportunity-invitation-tracking.js';
import { normalizeAuditAction, normalizeNotificationType } from '../src/services/matching/lifecycle-constants.js';

describe('opportunity-invitation-lifecycle', () => {
    it('defines terminal invitation statuses', () => {
        expect(TERMINAL_INVITATION_STATUSES).toContain('accepted');
        expect(TERMINAL_INVITATION_STATUSES).toContain('declined');
    });

    it('detects terminal statuses', () => {
        expect(isTerminalInvitationStatus('accepted')).toBe(true);
        expect(isTerminalInvitationStatus('sent')).toBe(false);
    });

    it('expires only active sent invitations past expiresAt', () => {
        const now = new Date('2026-05-18T12:00:00.000Z').getTime();
        const sent = {
            status: 'sent',
            expiresAt: '2026-05-17T00:00:00.000Z'
        };
        const future = {
            status: 'sent',
            expiresAt: '2026-06-01T00:00:00.000Z'
        };
        const accepted = {
            status: 'accepted',
            expiresAt: '2026-05-01T00:00:00.000Z'
        };
        expect(shouldExpireInvitation(sent, now)).toBe(true);
        expect(shouldExpireInvitation(future, now)).toBe(false);
        expect(shouldExpireInvitation(accepted, now)).toBe(false);
        expect(isActiveInvitation(sent)).toBe(true);
    });

    it('does not expire invitations without expiresAt', () => {
        const now = Date.now();
        expect(shouldExpireInvitation({ status: 'sent' }, now)).toBe(false);
    });

    it('computeDefaultInvitationExpiresAt adds TTL days', () => {
        const expires = computeDefaultInvitationExpiresAt('2026-05-01T00:00:00.000Z', 14);
        const days = (new Date(expires).getTime() - new Date('2026-05-01T00:00:00.000Z').getTime()) / 86400000;
        expect(days).toBeCloseTo(14, 0);
    });
});

describe('lifecycle-constants aliases', () => {
    it('maps legacy notification types', () => {
        expect(normalizeNotificationType('match_found')).toBe('new_match_found');
        expect(normalizeNotificationType('opportunity_match')).toBe('new_match_found');
        expect(normalizeNotificationType('candidate_match')).toBe('new_match_found');
        expect(normalizeNotificationType('match')).toBe('new_match_found');
        expect(normalizeNotificationType('negotiation_countered')).toBe('negotiation_countered');
    });

    it('maps legacy audit actions', () => {
        expect(normalizeAuditAction('negotiation_counter_offer')).toBe('negotiation_countered');
    });
});
