import { describe, expect, it } from 'vitest';
import {
    buildAdminNegotiationAnalytics,
    isStalled,
    isExpiringSoon,
    isAgreedNoDeal,
    enrichNegotiationRow
} from '../src/services/matching/admin-negotiation-command-center.js';

describe('admin-negotiation-command-center', () => {
    const now = Date.now();
    const daysAgo = (d) => new Date(now - d * 86400000).toISOString();
    const hoursFromNow = (h) => new Date(now + h * 3600000).toISOString();

    it('detects stalled active negotiations', () => {
        const neg = {
            status: 'open',
            createdAt: daysAgo(10),
            updatedAt: daysAgo(8),
            rounds: []
        };
        expect(isStalled(neg, 5)).toBe(true);
    });

    it('detects expiring negotiations', () => {
        const neg = { status: 'counter_offered', expiresAt: hoursFromNow(24) };
        expect(isExpiringSoon(neg, 48)).toBe(true);
    });

    it('detects agreed without deal', () => {
        const neg = { id: 'n1', status: 'agreed' };
        const deals = [{ id: 'd1', negotiationId: 'n2' }];
        expect(isAgreedNoDeal(neg, deals)).toBe(true);
    });

    it('buildAdminNegotiationAnalytics aggregates counts', () => {
        const negotiations = [
            { id: '1', status: 'open', createdAt: daysAgo(2), updatedAt: daysAgo(1), rounds: [] },
            { id: '2', status: 'agreed', createdAt: daysAgo(5), agreedAt: daysAgo(1), rounds: [{}, {}] },
            { id: '3', status: 'cancelled', createdAt: daysAgo(3), rounds: [] }
        ];
        const deals = [{ negotiationId: '2' }];
        const stats = buildAdminNegotiationAnalytics(negotiations, deals, { stallDays: 5, expiringHours: 48 });
        expect(stats.total).toBe(3);
        expect(stats.active).toBe(1);
        expect(stats.agreed).toBe(1);
        expect(stats.dealsFromNegotiations).toBe(1);
        expect(stats.avgRoundsToAgree).toBe(2);
    });

    it('buildAdminNegotiationAnalytics counts active disputes', () => {
        const negotiations = [{ id: '1', status: 'open', rounds: [] }];
        const disputes = [
            { id: 'd1', negotiationId: '1', status: 'under_review' },
            { id: 'd2', negotiationId: '2', status: 'resolved' }
        ];
        const stats = buildAdminNegotiationAnalytics(negotiations, [], { disputes });
        expect(stats.activeDisputes).toBe(1);
        expect(stats.disputesUnderReview).toBe(1);
    });

    it('enrichNegotiationRow includes flags', () => {
        const row = enrichNegotiationRow(
            { id: 'x', status: 'open', createdAt: daysAgo(10), updatedAt: daysAgo(8), rounds: [], expiresAt: hoursFromNow(12) },
            { opportunityTitle: 'Test opp', partySummary: 'A · B', agreedNoDeal: false }
        );
        expect(row.opportunityTitle).toBe('Test opp');
        expect(row.flags.stalled).toBe(true);
        expect(row.flags.expiringSoon).toBe(true);
    });

    it('enrichNegotiationRow flags active dispute from context', () => {
        const row = enrichNegotiationRow(
            { id: 'x', status: 'counter_offered', rounds: [] },
            { hasActiveDispute: true }
        );
        expect(row.flags.hasDispute).toBe(true);
    });
});
