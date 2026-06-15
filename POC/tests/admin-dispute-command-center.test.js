import { describe, expect, it } from 'vitest';
import {
    buildAdminDisputeAnalytics,
    enrichDisputeRow,
    isActiveStatus,
    isSlaBreached,
    buildAttentionQueues
} from '../src/services/matching/admin-dispute-command-center.js';

describe('admin-dispute-command-center', () => {
    const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

    it('detects active dispute statuses', () => {
        expect(isActiveStatus('raised')).toBe(true);
        expect(isActiveStatus('under_review')).toBe(true);
        expect(isActiveStatus('resolved')).toBe(false);
    });

    it('buildAdminDisputeAnalytics aggregates counts', () => {
        const disputes = [
            { id: '1', status: 'raised', raisedAt: daysAgo(2) },
            { id: '2', status: 'under_review', raisedAt: daysAgo(5) },
            { id: '3', status: 'resolved', raisedAt: daysAgo(10), resolution: { resolvedAt: daysAgo(8), outcome: 'dismiss' } }
        ];
        const stats = buildAdminDisputeAnalytics(disputes);
        expect(stats.total).toBe(3);
        expect(stats.active).toBe(2);
        expect(stats.needsReview).toBe(1);
        expect(stats.resolved).toBe(1);
    });

    it('enrichDisputeRow includes flags', () => {
        const row = enrichDisputeRow(
            { id: 'x', status: 'raised', category: 'value_mismatch', thread: [{ at: daysAgo(1) }] },
            { opportunityTitle: 'Test opp', raisedByName: 'Alice' }
        );
        expect(row.opportunityTitle).toBe('Test opp');
        expect(row.flags.needsReview).toBe(true);
        expect(row.flags.active).toBe(true);
    });

    it('buildAttentionQueues groups rows', () => {
        const rows = [
            enrichDisputeRow({ id: '1', status: 'raised', raisedAt: new Date(Date.now() - 72 * 3600000).toISOString() }, { slaHours: 48 }),
            enrichDisputeRow({ id: '2', status: 'mediation' }, {}),
            enrichDisputeRow({ id: '3', status: 'resolved', resolution: { outcome: 'dismiss' } }, {})
        ];
        const queues = buildAttentionQueues(rows);
        expect(queues.active).toHaveLength(2);
        expect(queues.slaBreached).toHaveLength(1);
        expect(queues.terminal).toHaveLength(1);
    });

    it('isSlaBreached flags old active disputes', () => {
        const old = { status: 'raised', raisedAt: new Date(Date.now() - 72 * 3600000).toISOString() };
        expect(isSlaBreached(old, { slaHours: 48 })).toBe(true);
    });
});
